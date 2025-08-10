// services/file-service/server.js
const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const amqp = require('amqplib'); // Add amqplib
const { parseFile } = require('music-metadata');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve local files

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- NEW: RabbitMQ Connection ---
let channel;
(async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('file_events', 'topic');
    console.log("File service connected to RabbitMQ");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ", error);
  }
})();
// --------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

app.get('/health', (req, res) => { /* ... same as before ... */ });

app.post('/upload/:roomId', upload.single('music'), async (req, res) => {
  try {
    // ... (existing upload and metadata logic is the same)
    const { roomId } = req.params;
    const filePath = req.file.path;
    const metadata = await parseFile(filePath);
    const title = metadata.common.title || 'Unknown Title';
    const artist = metadata.common.artist || 'Unknown Artist';
    const duration = Math.round(metadata.format.duration || 0);
    const fileUrl = `/uploads/${req.file.filename}`;

    const query = `INSERT INTO tracks (id, room_id, title, artist, duration, file_url, filename) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const trackId = uuidv4();
    const values = [trackId, roomId, title, artist, duration, fileUrl, req.file.filename];
    const result = await pool.query(query, values);
    const track = result.rows[0];

    // --- NEW: Publish the event ---
    if (channel) {
      const event = { track, roomId };
      channel.publish('file_events', 'track.uploaded', Buffer.from(JSON.stringify(event)));
      console.log(`Published track.uploaded event for room ${roomId}`);
    }
    // ------------------------------

    res.status(201).json(track);
  } catch (error) {
    console.error('Error uploading file:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`File service running on port ${PORT}`);
});
