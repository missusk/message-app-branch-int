const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

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

// Agent Login Route

router.post('/agents/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM agents WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({error: 'Invalid username or password'});
        }

        const agent = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, agent.password);

        if (!isPasswordValid) {
            return res.status(400).json({error: 'Invalid username or password'});
        }

        const token = jwt.sign(
             {agent_id: agent.agent_id, username: agent.username }, 
             process.env.JWT_SECRET, 
             {expiresIn: '1h',}
        );
        res.json({message: 'Agent logged in successfully', token});
    }

    catch (err) {
        console.log(err.message);
        res.status(500).json({error: 'Server error, agent login failed'});
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

// Customer Login Route

router.post('/customers/login', async (req, res) => {
    const {username, password} = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({error: 'Invalid username or password'});
    }

    const user = result.rows[0];

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
        return res.status(400).json({error: 'Invalid username or password'});
    }

    const token = jwt.sign(
        {user_id: user.user_id, username: user.username},
        process.env.JWT_SECRET, 
        {expiresIn: '1h'}
    );

    res.json({message: 'Customer logged in successfully', token});
    }

    catch (err) {
        console.log(err.message);
        res.status(500).json({error: 'Server error, customer login failed'});
    }
});

module.exports = router;