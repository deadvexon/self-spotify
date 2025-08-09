// services/frontend/src/components/HomePage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../store/roomSlice';

const HomePage = () => {
  const [roomName, setRoomName] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentRoom, loading, error } = useSelector((state) => state.room);

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      dispatch(createRoom(roomName));
    }
  };

  // When a room is created successfully, navigate to it
  useEffect(() => {
    if (currentRoom) {
      navigate(`/room/${currentRoom.id}`);
    }
  }, [currentRoom, navigate]);

  return (
    <div>
      <h1>Create a Music Room</h1>
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter room name"
        disabled={loading}
      />
      <button onClick={handleCreateRoom} disabled={loading}>
        {loading ? 'Creating...' : 'Create Room'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error.error}</p>}
    </div>
  );
};

export default HomePage;
