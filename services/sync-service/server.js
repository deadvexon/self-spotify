const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis'); // NEW: Import redis
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, { /* ... CORS config ... */ });

// --- NEW: Redis Connection ---
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);
// ----------------------------

const activeRooms = new Map(); // We still use this for fast, in-memory access

app.get('/health', (req, res) => { /* ... health check ... */ });

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', async (data) => { // Made this async
    const { roomId } = data;
    socket.join(roomId);

    if (!activeRooms.has(roomId)) {
      // --- NEW: Try to load the room from Redis first ---
      const roomStateFromRedis = await redisClient.get(`room:${roomId}:state`);
      if (roomStateFromRedis) {
        // If room exists in Redis, load it into memory
        activeRooms.set(roomId, { ...JSON.parse(roomStateFromRedis), listeners: new Set() });
        console.log(`Loaded room ${roomId} from Redis.`);
      } else {
        // Otherwise, create a new room
        activeRooms.set(roomId, {
          currentTrack: null, currentTime: 0, isPlaying: false, listeners: new Set(), host: null
        });
      }
    }

    const room = activeRooms.get(roomId);
    room.listeners.add(socket.id);

    if (!room.host) {
      room.host = socket.id;
      socket.emit('hostAssigned');
    }

    socket.emit('roomState', { /* ... same as before ... */ });
    socket.to(roomId).emit('listenerJoined', { listenerCount: room.listeners.size });

    // --- NEW: Save the updated state to Redis ---
    const stateToCache = { host: room.host, currentTrack: room.currentTrack, currentTime: room.currentTime, isPlaying: room.isPlaying };
    // Set to expire in 2 hours to auto-clean abandoned rooms
    await redisClient.setEx(`room:${roomId}:state`, 7200, JSON.stringify(stateToCache));
  });

  // --- Every function that modifies the room state must now also save to Redis ---

  socket.on('changeTrack', async (data) => { // Made async
    const { roomId, trackId } = data;
    const room = activeRooms.get(roomId);
    if (room && room.host === socket.id) {
      room.currentTrack = trackId;
      room.currentTime = 0;
      room.isPlaying = true;
      io.to(roomId).emit('trackChanged', { trackId: room.currentTrack });

      // --- NEW: Save state to Redis ---
      const stateToCache = { host: room.host, currentTrack: room.currentTrack, currentTime: room.currentTime, isPlaying: room.isPlaying };
      await redisClient.setEx(`room:${roomId}:state`, 7200, JSON.stringify(stateToCache));
    }
  });

  // Replace the entire disconnect handler in services/sync-service/server.js

socket.on('disconnect', async () => {
  console.log('User disconnected:', socket.id);
  for (const [roomId, room] of activeRooms.entries()) {
      if (room.listeners.has(socket.id)) {
          room.listeners.delete(socket.id);
          let hostChanged = false;

          if (room.host === socket.id) {
              hostChanged = true; // Mark that the host has changed
              if (room.listeners.size > 0) {
                  // Promote the next listener
                  const newHost = room.listeners.values().next().value;
                  room.host = newHost;
                  io.to(newHost).emit('hostAssigned');
              } else {
                  // Room is now empty, no host
                  room.host = null;
              }
          }

          socket.to(roomId).emit('listenerLeft', { listenerCount: room.listeners.size });

          if (room.listeners.size === 0) {
              // If room is empty, delete from Redis and memory
              await redisClient.del(`room:${roomId}:state`);
              activeRooms.delete(roomId);
              console.log(`Room ${roomId} is empty, deleted from memory and Redis.`);
          } else if (hostChanged) {
              // --- THIS IS THE FIX ---
              // If the host changed and the room is NOT empty,
              // save the updated state (with the new host) back to Redis.
              const stateToCache = { host: room.host, currentTrack: room.currentTrack, currentTime: room.currentTime, isPlaying: room.isPlaying };
              await redisClient.setEx(`room:${roomId}:state`, 7200, JSON.stringify(stateToCache));
              console.log(`Host changed in room ${roomId}, updated Redis.`);
          }
          break; 
      }
  }
});

});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Sync service running on port ${PORT}`);
});
