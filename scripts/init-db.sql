-- scripts/init-db.sql 

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR(100) NOT NULL,
	is_active BOOLEAN DEFAULT true,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance 
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);

-- Tracks table 
CREATE TABLE IF NOT EXISTS tracks (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
	title VARCHAR(200) NOT NULL,
	artist VARCHAR(200) DEFAULT 'Unknown Artist',
	duration INTEGER DEFAULT 0, -- Store duration in seconds
	file_url TEXT NOT NULL,
	filename VARCHAR(255),
	upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_tracks_room_id ON tracks(room_id);
