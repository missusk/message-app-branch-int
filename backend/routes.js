const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const authenticateToken = require('./authMiddleware');

const router = express.Router();

// Agent Signup Route
router.post('/agents/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO agents (username, password) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );
    res.status(201).json({ message: 'Agent created successfully', agent: result.rows[0] });
  } catch (err) {
    console.error('Error in agent signup:', err.message);
    res.status(500).json({ error: 'Server error, agent registration failed' });
  }
});

// Customer Signup Route

router.post('/customers/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );
    res.status(201).json({ message: 'Customer created successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error in customer signup:', err.message);
    res.status(500).json({ error: 'Server error, customer registration failed' });
  }
});

// Agent Login
router.post('/agents/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM agents WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    const agent = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, agent.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign(
      { agent_id: agent.agent_id, username: agent.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Agent logged in successfully', token, agent_id: agent.agent_id });
  } catch (err) {
    console.error('Error in agent login:', err.message);
    res.status(500).json({ error: 'Server error, agent login failed' });
  }
});

// Customer Login
router.post('/customers/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Customer logged in successfully', token, user_id: user.user_id });
  } catch (err) {
    console.error('Error in customer login:', err.message);
    res.status(500).json({ error: 'Server error, customer login failed' });
  }
});

// Chat Routes - Fetch chat history
router.get('/messages/:user_id', authenticateToken, async (req, res) => {
  const { user_id } = req.params;
  try {
    // Fetch user messages
    const userMessages = await pool.query(
      'SELECT message_body, timestamp, \'user\' as sender FROM messages WHERE user_id = $1 ORDER BY timestamp ASC',
      [user_id]
    );

    // Fetch agent responses for the user
    const agentResponses = await pool.query(
      `SELECT r.response_body as message_body, r.timestamp, 'agent' as sender 
       FROM responses r 
       INNER JOIN messages m ON r.message_id = m.message_id 
       WHERE m.user_id = $1 
       ORDER BY r.timestamp ASC`,
      [user_id]
    );

    // Merge the user messages and agent responses
    const allMessages = [...userMessages.rows, ...agentResponses.rows];

    // Sort all messages chronologically
    allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ messages: allMessages });
  } catch (err) {
    console.error('Error fetching messages and responses:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});



//send message

router.post('/messages/send', authenticateToken, async (req, res) => {
  const { user_id } = req.user;
  console.log(user_id);
  const { message_body } = req.body;

  try {
    const lastAssignedMessage = await pool.query(
      'SELECT agent_id FROM messages WHERE user_id = $1 AND status = $2 ORDER BY timestamp DESC LIMIT 1',
      [user_id, 'assigned']
    );

    let agentId = null;
    if (lastAssignedMessage.rows.length > 0) {
      agentId = lastAssignedMessage.rows[0].agent_id;
    }

    const result = await pool.query(
      'INSERT INTO messages (user_id, agent_id, message_body, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, agentId, message_body, agentId ? 'assigned' : 'unassigned']
    );

    res.status(201).json({ message: 'Message sent', data: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// Agent views unassigned messages route

router.get('/unassigned-messages', authenticateToken, async (req, res) => {
    const { agent_id } = req.user;

    if (!agent_id) {
        return res.status(403).json({ error: 'Access denied, only agents can view unassigned messages' });
    }

    try {
        const result = await pool.query(
        `SELECT u.user_id, u.username, m.message_id 
        FROM messages m 
        JOIN users u ON u.user_id = m.user_id 
        WHERE m.status = $1`,
        ['unassigned']
      );
      res.json({ unassignedMessages: result.rows });
  }
    catch (err) {
        console.log(err.message);
        res.status(500).json({ error: 'Server error, unable to fetch unassigned messages' });
    }
});


// Agent assigns message and respond route

router.post('/respond-and-assign', authenticateToken, async (req, res) => {
  const { agent_id } = req.user;  
  const { user_id, response_body } = req.body;  

  if (!agent_id) {
    return res.status(403).json({ error: 'Access denied: Only agents can respond to messages' });
  }

  try {
    const unassignedMessages = await pool.query(
      'SELECT message_id FROM messages WHERE user_id = $1 AND status = $2',
      [user_id, 'unassigned']
    );

    if (unassignedMessages.rows.length === 0) {
      return res.status(404).json({ error: 'No unassigned messages from this user' });
    }

    await pool.query(
      'UPDATE messages SET agent_id = $1, status = $2 WHERE user_id = $3 AND status = $4',
      [agent_id, 'assigned', user_id, 'unassigned']
    );

    const response = await pool.query(
      'INSERT INTO responses (message_id, agent_id, response_body) VALUES ($1, $2, $3) RETURNING *',
      [unassignedMessages.rows[0].message_id, agent_id, response_body]
    );

    res.json({ message: 'Response saved and user assigned to you', data: response.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Agent responds to an already assigned message

router.post('/messages/respond-by-user', authenticateToken, async (req, res) => {
  const { agent_id } = req.user;  
  const { user_id, response_body } = req.body;  

  if (!agent_id) {
    return res.status(403).json({ error: 'Access denied: Only agents can respond to messages' });
  }

  try {
    const lastAssignedMessage = await pool.query(
      'SELECT agent_id FROM messages WHERE user_id = $1 AND status = $2 ORDER BY timestamp DESC LIMIT 1',
      [user_id, 'assigned']
    );

    if (lastAssignedMessage.rows.length === 0 || lastAssignedMessage.rows[0].agent_id !== agent_id) {
      return res.status(403).json({ error: 'You are not authorized to respond to this user\'s messages' });
    }

    const response = await pool.query(
      'INSERT INTO responses (message_id, agent_id, response_body) VALUES ((SELECT message_id FROM messages WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1), $2, $3) RETURNING *',
      [user_id, agent_id, response_body]
    );

    res.json({ message: 'Response sent successfully', data: response.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch assigned users for an agent

router.get('/agents/assigned-users', authenticateToken, async (req, res) => {
  const { agent_id } = req.user;

  if (!agent_id) {
    return res.status(403).json({ error: 'Access denied, missing agent ID' });
  }

  try {
    // Fetching distinct users that are assigned to this agent from the messages table
    const result = await pool.query(
      `SELECT DISTINCT u.user_id, u.username
       FROM messages m
       JOIN users u ON u.user_id = m.user_id
       WHERE m.agent_id = $1 AND m.status = $2`,
      [agent_id, 'assigned']
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching assigned users:', err.message, err.stack);
    res.status(500).json({ error: 'Server error fetching assigned users' });
  }
});


module.exports = router;
