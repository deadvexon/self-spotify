import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SocketService from '../services/socket';
import { fetchPlaylist, setHost, updateListenerCount, clearRoom } from '../store/roomSlice';
import { setCurrentTrackId, setPlaying } from '../store/playerSlice';
import Player from './Player';

const RoomPage = () => {
  const { roomId } = useParams();
  const dispatch = useDispatch();

  const { isHost, playlist, currentRoom } = useSelector((state) => state.room);
  const { currentTrackId } = useSelector((state) => state.player);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    SocketService.connect(apiUrl);
    SocketService.joinRoom(roomId);
    dispatch(fetchPlaylist(roomId));

    SocketService.onHostAssigned(() => dispatch(setHost(true)));
    SocketService.onTrackChanged((data) => {
      dispatch(setCurrentTrackId(data.trackId));
      dispatch(setPlaying(data.isPlaying));
    });
    SocketService.onPlayPause((data) => dispatch(setPlaying(data.isPlaying)));

    return () => {
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
      
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '80vw' }}>
        <div style={{ flex: 1 }}>
          <h2>Playlist</h2>
          {playlist.length === 0 ? <p>Playlist is empty. Use curl to upload a song!</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {playlist.map((track) => (
                <li key={track.id} style={{ backgroundColor: track.id === currentTrackId ? '#555' : 'transparent', padding: '5px', borderRadius: '5px' }}>
                  <button onClick={() => handleTrackSelect(track.id)} disabled={!isHost} style={{ background: 'none', border: 'none', color: 'white', cursor: isHost ? 'pointer' : 'default', textAlign: 'left', fontSize: '1em' }}>
                    {track.title} - {track.artist}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <Player />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
