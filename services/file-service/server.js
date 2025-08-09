// services/file-service/server.js

const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const { parseFile } = require('music-metadata');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- Database Connection ---
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

// --- Multer COnfiguration ---
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null,'uploads/');
	},
	filename: (req, file, cb) => {
		const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
		cb(null, uniqueName);
	}
});

const upload = multer({
	storage: storage, 
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'audio/mpeg') { //allowing only mp3 files
			cb(null, true);
		} else {
			cb(new Error('only mp3 files are allowed'), false);
		}
	},
	limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// -- Health Check --

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'file-service' });
});

// --- Upload Endpoint --- 
app.post('/upload/:roomId', upload.single('music'), async(req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' })
		}

		const { roomId } = req.params;
		const filePath = req.file.path;

		// Extracting metadata 
		const metadata = await parseFile(filePath);
		const title = metadata.common.title || 'Unkown Title';
		const artist = metadata.common.artist || 'Unknown Artist';
		const duration = Math.round(metadata.format.duration || 0);

		//for now, just using the local file path
		const fileUrl = `/uploads/${req.file.filename}`;

		// saving to database 
		const query = `
		  INSERT INTO tracks (id, room_id, title, artist, duration, file_url, filename)
		  VALUES ($1, $2, $3, $4, $5, $6, $7)
		  RETURNING *
		  `;
		const trackId = uuidv4();
		const values = [trackId, roomId, title, artist, duration, fileUrl, req.file.filename];
		const result = await pool.query(query, values);
		const track = result.rows[0];

		res.status(201).json(track);
	}catch(error) {
		console.error('Error uploading file:', error);
		//clean up failed uplaod 
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		res.status(500).json({error: 'Internal server error' });
	}
});


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
	console.log(`File service running on port ${PORT}`);
});
