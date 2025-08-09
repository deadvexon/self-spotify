// services/frontend/src/components/RoomPage.js
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SocketService from '../services/socket';
import { setHost, updateListenerCount, clearRoom } from '../store/roomSlice';

const RoomPage = () => {
  const { roomId } = useParams(); // Get roomId from URL
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { listenerCount, isHost } = useSelector((state) => state.room);

  useEffect(() => {
    // --- Connect and set up listeners when the component mounts ---
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    SocketService.connect(apiUrl);
    SocketService.joinRoom(roomId);

    SocketService.onHostAssigned(() => {
      console.log("I am the host!");
      dispatch(setHost(true));
    });

    SocketService.onListenerJoined((data) => {
      dispatch(updateListenerCount(data.listenerCount));
    });

    SocketService.onListenerLeft((data) => {
      dispatch(updateListenerCount(data.listenerCount));
    });
    
    // --- Disconnect when the component unmounts ---
    return () => {
      console.log("Leaving room, disconnecting socket.");
      dispatch(clearRoom());
      SocketService.disconnect();
    };
  }, [roomId, dispatch, navigate]);

  return (
    <div>
      <h1>You are in room: {roomId}</h1>
      <p>Listeners: {listenerCount}</p>
      {isHost && <h2>You are the host!</h2>}
    </div>
  );
};

export default RoomPage;
