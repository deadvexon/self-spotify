// services/frontend/src/components/RoomPage.js
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SocketService from '../services/socket';
import { fetchPlaylist, setHost, updateListenerCount, clearRoom } from '../store/roomSlice';
import { setCurrentTrack, setPlaying, syncState } from '../store/playerSlice';
import Player from './Player';

const RoomPage = () => {
  const { roomId } = useParams(); // Get roomId from URL
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { listenerCount, isHost, playlist, currentRoom } = useSelector((state) => state.room);

  useEffect(() => {
    // --- Connect and set up listeners when the component mounts ---
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    SocketService.connect(apiUrl);
    SocketService.joinRoom(roomId);

    dispatch(fetchPlaylist(roomId));
    SocketService.onHostAssigned(() => {
      console.log("I am the host!");
      dispatch(setHost(true));
    });
    SocketService.onRoomState((data) => {
    console.log("Received initial room state:", data);
    dispatch(setHost(data.isHost));
    dispatch(updateListenerCount(data.listenerCount));
    // Find the track object from the full playlist
    const track = playlist.find(t => t.id === data.currentTrack);
    dispatch(syncState({ ...data, currentTrack: track }));
  });

  SocketService.onTrackChanged((data) => {
    console.log('Track changed:', data);
    // Find the full track object from our playlist using the ID from the server
    const track = playlist.find(t => t.id === data.trackId);
    if (track) {
      dispatch(setCurrentTrack(track));
      dispatch(setPlaying(true));
    }
  });

  SocketService.onPlayPause((data) => {
    console.log('Play/pause changed:', data);
    dispatch(setPlaying(data.isPlaying));
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

  const handleTrackSelect = (trackId) => {
    if (isHost) {
      SocketService.emitChangeTrack(roomId, trackId);
    }
  };

  return (
    <div>
      <h1>You are in room: {currentRoom?.name || roomId}</h1>
      <p>Listeners: {listenerCount}</p>
      {isHost && <h2>You are the host!</h2>}

      <hr />

      {/* NEW: Playlist Display */}
      <div>
        <h2>Playlist</h2>
        {playlist.length === 0 ? (
          <p>The playlist is empty. Upload some music!</p>
        ) : (
          <ul>
            {playlist.map((track) => (
              <li key={track.id}>
                <button 
                  onClick={() => handleTrackSelect(track.id)}
                  disabled={!isHost}
                >
                  {track.title} - {track.artist}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
