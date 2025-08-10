import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SocketService from '../services/socket';
import { setPlaying } from '../store/playerSlice';

const Player = () => {
  const audioRef = useRef(null);
  const dispatch = useDispatch();

  // Get state from Redux
  const { currentTrackId, isPlaying } = useSelector((state) => state.player);
  const { isHost, currentRoom, playlist } = useSelector((state) => state.room);

  // Find the full track object using the ID from the player state
  const currentTrack = playlist.find(track => track.id === currentTrackId);

  const handlePlayPause = () => {
    if (!currentTrack || !isHost) return;
    const newIsPlaying = !isPlaying;
    dispatch(setPlaying(newIsPlaying));
    SocketService.emitPlayPause({ roomId: currentRoom.id, isPlaying: newIsPlaying });
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]); // Also run this effect if the track changes

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const trackUrl = `${process.env.REACT_APP_API_URL}/api/files${currentTrack.file_url}`;
      if (audioRef.current.src !== trackUrl) {
        audioRef.current.src = trackUrl;
      }
    }
  }, [currentTrack]);

  return (
    <div>
      <h2>Player</h2>
      <audio ref={audioRef} />
      {currentTrack ? (
        <div>
          <p>Now Playing: {currentTrack.title} - {currentTrack.artist}</p>
          <button onClick={handlePlayPause} disabled={!isHost}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      ) : <p>No track selected.</p>}
    </div>
  );
};

export default Player;
