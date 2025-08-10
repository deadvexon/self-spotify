// services/frontend/src/components/Player.js
import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import SocketService from '../services/socket';

const Player = () => {
  const audioRef = useRef(null); // Ref to control the <audio> element

  const { currentTrack, isPlaying } = useSelector((state) => state.player);
  const { isHost, currentRoom } = useSelector((state) => state.room);

  const handlePlayPause = () => {
    if (!currentTrack) return;

    const newIsPlaying = !isPlaying;

    if (isHost) {
      SocketService.emitPlayPause({
        roomId: currentRoom.id,
        isPlaying: newIsPlaying,
        currentTime: audioRef.current.currentTime,
        trackId: currentTrack.id,
      });
    }
  };

  // Effect to sync the <audio> element with the Redux state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    // Construct the full URL to the audio file
    const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3000').replace('/api','');
    const trackUrl = `${apiUrl}/api/files${currentTrack.file_url}`;

    if (audioRef.current.src !== trackUrl) {
        audioRef.current.src = trackUrl;
    }

    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [currentTrack, isPlaying]);

  return (
    <div>
      <h2>Player</h2>
      <audio ref={audioRef} />
      {currentTrack && (
        <div>
          <p>Now Playing: {currentTrack.title} - {currentTrack.artist}</p>
          <button onClick={handlePlayPause} disabled={!isHost}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Player;
