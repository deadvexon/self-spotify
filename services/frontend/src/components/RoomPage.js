import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SocketService from '../services/socket';
import { fetchPlaylist, setHost, updateListenerCount, clearRoom } from '../store/roomSlice';
import { setCurrentTrack, setPlaying, syncState } from '../store/playerSlice';
import Player from './Player';

const RoomPage = () => {
  const { roomId } = useParams();
  const dispatch = useDispatch();

  const { isHost, playlist, currentRoom } = useSelector((state) => state.room);
  const { currentTrack } = useSelector((state) => state.player);
  
  // Main effect for connection management
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    SocketService.connect(apiUrl);
    SocketService.joinRoom(roomId);
    dispatch(fetchPlaylist(roomId));

    // --- Set up all event listeners ---
    SocketService.onRoomState((data) => {
      console.log("Received initial room state:", data);
      dispatch(setHost(data.isHost));
      dispatch(updateListenerCount(data.listenerCount));
      const track = playlist.find(t => t.id === data.currentTrack);
      dispatch(syncState({ ...data, currentTrack: track }));
    });
    
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

    SocketService.onTrackChanged((data) => {
      console.log('Track changed:', data);
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

    // --- Cleanup function when the component is unmounted ---
    return () => {
      console.log("Leaving room, disconnecting socket.");
      dispatch(clearRoom());
      SocketService.disconnect();
    };
  }, [roomId, dispatch]);


  const handleTrackSelect = (trackId) => {
    if (isHost) {
      SocketService.emitChangeTrack(roomId, trackId);
    }
  };

  return (
    <div>
      <h1>Room: {currentRoom?.name || roomId}</h1>
      {isHost && <h2>You are the host!</h2>}

      <hr />
      
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div>
          <h2>Playlist</h2>
          {playlist.length === 0 ? (
            <p>The playlist is empty. Upload some music!</p>
          ) : (
            <ul>
              {playlist.map((track) => (
                <li key={track.id} style={{ backgroundColor: track.id === currentTrack?.id ? '#555' : 'transparent', padding: '5px' }}>
                  <button 
                    onClick={() => handleTrackSelect(track.id)}
                    disabled={!isHost}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: isHost ? 'pointer' : 'default', textAlign: 'left' }}
                  >
                    {track.title} - {track.artist}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <Player />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
