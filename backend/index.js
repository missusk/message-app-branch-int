const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const routes = require('./routes');
const cors = require('cors');
const socketio = require('socket.io');
dotenv.config();


const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = socketio(server);

io.on('connection', (socket) => {
    console.log('New connection');
    socket.on('message', (message) => {
       io.emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

});

app.use('/', routes(io));

server.listen(5000, () => { 
    console.log('Server is running on port 5000');
});