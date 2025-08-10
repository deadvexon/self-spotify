const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const amqp = require('amqplib');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- Redis Connection ---
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);


// --- RabbitMQ Connection ---
// This block connects to RabbitMQ and listens for events from other services.
(async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange('file_events', 'topic');
    const q = await channel.assertQueue('sync_file_events', { durable: false });
    await channel.bindQueue(q.queue, 'file_events', '#');

    channel.consume(q.queue, (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        
        if (routingKey === 'track.uploaded') {
          console.log(`Received track.uploaded event for room ${event.roomId}`);
          io.to(event.roomId).emit('trackAdded', event.track);
        }
      }
    }, { noAck: true });
  } catch (error) {
    console.error("Failed to connect or consume from RabbitMQ", error);
  }
})();


// We still use a Map for fast, in-memory access to listener sets, etc.
const activeRooms = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sync-service' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', async (data) => {
    const { roomId } = data;
    socket.join(roomId);

    if (!activeRooms.has(roomId)) {
      const roomStateFromRedis = await redisClient.get(`room:${roomId}:state`);
      if (roomStateFromRedis) {
        activeRooms.set(roomId, { ...JSON.parse(roomStateFromRedis), listeners: new Set() });
        console.log(`Loaded room ${roomId} from Redis.`);
      } else {
        activeRooms.set(roomId, { host: null, currentTrack: null, currentTime: 0, isPlaying: false, listeners: new Set() });
      }
    }

    const room = activeRooms.get(roomId);
    room.listeners.add(socket.id);

    if (!room.host) {
      room.host = socket.id;
    }

    // This is the single source of truth for a new user's state.
    socket.emit('roomState', {
      currentTrack: room.currentTrack,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      isHost: room.host === socket.id,
      listenerCount: room.listeners.size
    });

    socket.to(roomId).emit('listenerJoined', { listenerCount: room.listeners.size });
    
    // Save the potentially updated host back to Redis.
    const stateToCache = { host: room.host, currentTrack: room.currentTrack, currentTime: room.currentTime, isPlaying: room.isPlaying };
    await redisClient.setEx(`room:${roomId}:state`, 7200, JSON.stringify(stateToCache));
  });
  
  // --- Playback Controls ---

  socket.on('playPause', async (data) => {
    const { roomId, isPlaying } = data;
    const room = activeRooms.get(roomId);

    if (room && room.host === socket.id) {
      room.isPlaying = isPlaying;
      socket.to(roomId).emit('playPause', { isPlaying: room.isPlaying });

      const stateToCache = { host: room.host, currentTrack: room.currentTrack, currentTime: room.currentTime, isPlaying: room.isPlaying };
      await redisClient.setEx(`room:${roomId}:state`, 7200, JSON.stringify(stateToCache));
    }
  });

  socket.on('changeTrack', async (data) => {
    const { roomId, trackId } = data;
    const room = activeRooms.get(roomId);

    if (room && room.host === socket.id) {
      room.currentTrack = trackId;
      room.currentTime = 0;
      room.isPlaying = true;
      io.to(roomId).emit('trackChanged', { trackId: room.currentTrack, isPlaying: true });

      const stateToCache = { host: room.host, currentTrack: room.currentTrack, currentTime: room.currentTime, isPlaying: room.isPlaying };
      await redisClient.setEx(`room:${roomId}:state`, 7200, JSON.stringify(stateToCache));
    }
  });


  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    for (const [roomId, room] of activeRooms.entries()) {
        if (room.listeners.has(socket.id)) {
            room.listeners.delete(socket.id);
            let hostChanged = false;
            
            if (room.host === socket.id) {
                hostChanged = true;
                if (room.listeners.size > 0) {
                    const newHost = room.listeners.values().next().value;
                    room.host = newHost;
                    io.to(newHost).emit('hostAssigned');
                } else {
                    room.host = null;
                }
            }
            
            socket.to(roomId).emit('listenerLeft', { listenerCount: room.listeners.size });

            if (room.listeners.size === 0) {
                await redisClient.del(`room:${roomId}:state`);
                activeRooms.delete(roomId);
            } else if (hostChanged) {
                const stateToCache = { host: room.host, currentTrack: room.currentTrack, currentTime: room.currentTime, isPlaying: room.isPlaying };
                await redisClient.setEx(`room:${roomId}:state`, 7200, JSON.stringify(stateToCache));
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
