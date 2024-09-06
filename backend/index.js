const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const routes = require('./routes');
const cors = require('cors');
const socketio = require('socket.io');
dotenv.config();
const PORT = process.env.PORT || 5000;


const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: `${FRONT_END_URL}`,
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

server.listen(PORT, () => { 
    console.log(`Server is running on port ${PORT}`);
});