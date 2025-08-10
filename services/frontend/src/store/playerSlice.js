import { createSlice } from '@reduxjs/toolkit';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentTrackId: null, // Store ID instead of the full object
    isPlaying: false,
  },
  reducers: {
    setCurrentTrackId: (state, action) => {
      state.currentTrackId = action.payload;
    },
    setPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    syncState: (state, action) => {
      state.currentTrackId = action.payload.currentTrack; // Server sends track ID
      state.isPlaying = action.payload.isPlaying;
    },
  },
});

export const { setCurrentTrackId, setPlaying, syncState } = playerSlice.actions;
export default playerSlice.reducer;
