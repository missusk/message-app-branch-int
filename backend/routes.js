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

        res.status(201).json({message: 'Agent created successfully', agent: result.rows[0]});
    }

    catch (err) {
        console.log(err.message);
        resizeTo.status(500).json({error: 'Server error, agent registration failed'});
    }

});


// Customer Signup Route

router.post('/customers/signup', async (req, res) => {
    const {username, password} = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
        res.status(201).json({message: 'Customer created successfully', user: result.rows[0]});
    }

    catch (err) {
        console.log(err.message);
        res.status(500).json({error: 'Server error, customer registration failed'});
    }
});


// Agent Login Route
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

        res.json({ message: 'Agent logged in successfully', token });
    } catch (err) {
        console.error('Error in agent login:', err.message); 
        res.status(500).json({ error: 'Server error, agent login failed' });
    }
});

// Customer Login Route
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

        res.json({ message: 'Customer logged in successfully', token });
    } catch (err) {
        console.error('Error in customer login:', err.message); 
        res.status(500).json({ error: 'Server error, customer login failed' });
    }
});

// Protected route tetsing

router.get('/profile', authenticateToken, async (req, res) => {
    const {user_id, username} = req.user;

    try {
        const result = await pool.query(
            'SELECT username FROM users WHERE user_id = $1', [user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not foound'});
        }

        res.json({ profile: result.rows[0]});
    } 

    catch (err) {
        console.log(err.message);
        res.status(500).json({error: 'Server error, unable to fetch user profile'});
    }
});

// Send message by customer route

router.post('/messages', authenticateToken, async (req, res) => {
  const { user_id } = req.user;  
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

router.get('/messages/unassigned', authenticateToken, async (req, res) => {
    const {agent_id} = req.user;

    if (!agent_id) {
        return res.status(403).json({error: 'Access denied, only agents can view unassigned messages'});
    }

    try {
        const result = await pool.query(
            'SELECT * FROM messages WHERE status = $1',
            ['unassigned']
        );
        res.json({unassignedMessages: result.rows});
    }
    catch (err) {
        console.log(err.message);
        res.status(500).json({error: 'Server error, unable to fetch unassigned messages'});
    }
});

// Agent assigns message and respond route

router.post('/messages/respond-and-assign', authenticateToken, async (req, res) => {
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


module.exports = router;