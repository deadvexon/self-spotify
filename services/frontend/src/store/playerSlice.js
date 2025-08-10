// services/frontend/src/store/playerSlice.js
import { createSlice } from '@reduxjs/toolkit';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
  },
  reducers: {
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
    },
    setPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    // A special reducer to sync the whole state at once
    syncState: (state, action) => {
      const { currentTrack, currentTime, isPlaying } = action.payload;
      state.currentTrack = currentTrack;
      state.currentTime = currentTime;
      state.isPlaying = isPlaying;
    },
  },
});

export const { setCurrentTrack, setPlaying, setCurrentTime, syncState } = playerSlice.actions;
export default playerSlice.reducer;
