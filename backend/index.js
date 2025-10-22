const express = require('express');
const app = express();
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // React app address
        methods: ["GET", "POST"]
    }
});

const port = 3000;

// Serve static files (optional)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Listen for chat messages from clients
    socket.on('chat message', (messageData) => {
        console.log('Message received:', messageData);
        
        // Broadcast the message to ALL connected clients (including sender)
        io.emit('chat message', {
            name: messageData.name,
            content: messageData.content,
          //  timestamp: new Date().toISOString(),
           // socketId: socket.id
        });
    });

    socket.on('typing' , (username)=>{
        //broadcast the typing event to all the clients
        socket.broadcast.emit('user typing', username);

    });

    socket.on('stop typing', (username)=>{
        //broadcast the 'stop typing' to all the other clients
        socket.broadcast.emit('user stop typing', username)
    })
    
    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});