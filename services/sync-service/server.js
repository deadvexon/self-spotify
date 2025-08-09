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

//in-memory store for active rooms
const activeRooms = new Map();


//health check 
app.get('/health', (req, res) => {
	res.json({ status: 'healthy', service: 'sync-service' });
});

//handle websocket connections 
io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	// Handle a user joining a room
	socket.on('joinRoom', (data) => {
		const { roomId } = data;
		socket.join(roomId);

		// initialize room if it doesn't exist in the mmeory store
		if (!activeRooms.has(roomId)) {
			activeRooms.set(roomId, {
				currentTrack: null,
				currentTime: 0,
				isPlaying: false,
				listeners: new Set(),
				host: null
			});
		}

		const room = activeRooms.get(roomId);
		room.listeners.add(socket.id);

		// set the first joiner as host
		if (!room.host) {
			room.host = socket.id;
			socket.emit('hostAssigned');
		}

		// send the current room state to the user who just joined
		//
		socket.emit('roomState', {
			currentTrack: room.currentTrack,
			currentTime: room.currentTime,
			isPlaying: room.isPlaying,
			isHost: room.host === socket.id
		});

		//Notify everyone else in the room about the new listener

		socket.to(roomId).emit('listenerJoined', {
			listenerCount: room.listeners.size
		});

		console.log(`User ${socket.id} joined room ${roomId}. Total listeners: ${room.listeners.size}`);
	});

		//handle play/pause events from the host
		socket.on('playPause', (data) => {
			const { roomId, isPlaying, currentTime, trackId } = data;
			const room = activeRooms.get(roomId);

			//setting such that only host can control playback
			if (room && room.host === socket.id) {
				room.isPlaying = isPlaying;
				room.currentTime = currentTime;
				room.currentTrack = trackId;

				//broadcast change to all other users
				socket.to(roomId).emit('playPause', {
					isPlaying, 
					currentTime,
					trackId
				});
			}
		});

		
	// handle user disconnections	

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);

		//find which room the user was in and remove them 
		activeRooms.forEach((room, roomId) => {
			if (room.listeners.has(socket.id)) {
				rooms.listeners.delete(socket.id);

				//if the host disconnected, assign a new host 
				if (room.host == socket.id && room.listeners.size > 0) {
					const newHost = room.listeners.values().next().value;
					room.host = newHost;
					io.to(newHost).emit('hostAssigned');
				}

				//Notify others that a listener left
				socket.to(roomId).emit('listenerLeft', {
					listenerCount: room.listeners.size
				});

				// if the room is now empty, delete it to save memory
				if (room.listeners.size === 0) {
					activeRooms.delete(roomId);
					console.log(`Room ${roomId} is now empty and has been closed.`);
				}
			}
		});
	});
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
	console.log(`Sync service running on port ${PORT}`);
});
