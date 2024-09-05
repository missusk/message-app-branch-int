const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes');
const cors = require('cors');
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/', routes);

app.get('/test', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM users');
        res.json(results.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(5000, () => { 
    console.log('Server is running on port 5000');
});