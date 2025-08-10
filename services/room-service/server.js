// services/room-service/server.js

const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- Database Connection ---
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

//--- Validation Schema ---

const roomSchema = Joi.object({
	name: Joi.string().min(1).max(100).required()
});

//--- Health Check ---

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'room-service' });
});

// --- API Endpoints ---
//
// Create a room 
app.post('/', async(req, res) => {
	try{
		const{error, value} = roomSchema.validate(req.body);
		if (error) {
			return res.status(400).json({error: error.details[0].message });
		}

		const query = 'INSERT INTO rooms (name) VALUES ($1) RETURNING *';
		const result = await pool.query(query, [value.name]);
		const room = result.rows[0];
		res.status(201).json(room);
	}catch (error) {
		console.error('Error creating room:', error);
		res.status(500).json({error: 'Internal server error'});
	}
});

// Get a room (bruh)
app.get('/:roomId', async(req, res) => {
	try {
		const { roomId } = req.params;

		const query = 'SELECT * FROM rooms WHERE id = $1 AND is_active=true';
		const result = await pool.query(query, [roomId]);

		if (result.rows.length == 0) {
			return res.status(404).json({error: 'Room not found' });
		}

		const room = result.rows[0];
		res.json(room);
	}catch(error) {
		console.error('Error fetching room:' ,error);
		res.status(500).json({error: 'Internal server error'});
	}
});

// Get room playlist
app.get('/:roomId/playlist', async (req, res) => {
  try {
    const { roomId } = req.params;

    const query = `
      SELECT t.* FROM tracks t 
      JOIN rooms r ON t.room_id = r.id 
      WHERE r.id = $1 AND r.is_active = true AND t.is_active = true
      ORDER BY t.upload_timestamp ASC
    `;
    const result = await pool.query(query, [roomId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Room service running on port ${PORT}`);
});

