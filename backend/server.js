const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');


const app = express();
const cors = require('cors');
app.use(cors({
  origin: 'https://citi-mall-xhw6.vercel.app/', 
  credentials: true,
}));


const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

let bids = []; 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send initial bids to client
  socket.emit('initial-bids', bids);

  socket.on('new-bid', (data) => {
    console.log('New bid received:', data);

    // Save bid in memory
    bids.unshift(data);

    // Broadcast to all clients
    io.emit('new-bid', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log('WebSocket server running on port 3001');
});
