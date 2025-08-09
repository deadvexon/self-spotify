// services/sync-service/server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
// create http server from the express app
const server = http.createServer(app);

//attach socket.Io to the HTTP server 
const io = socketIo(server, {
	cors: {
		origin: "*", //allow connections from any origin 
		mehtodds: ["GET", "POST"]
	}
});

//health check 
app.get('/health', (req, res) => {
	res.json({ status: 'healthy', service: 'sync-service' });
});

//handle websocket connections 
io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);
	});
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
	console.log(`Sync service running on port ${PORT}`);
});
