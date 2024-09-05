const express = require('express');
const dotenv = require('dotenv');
const routes = require('./routes');
const cors = require('cors');
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/', routes);

app.listen(5000, () => { 
    console.log('Server is running on port 5000');
});