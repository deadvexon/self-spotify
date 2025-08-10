import { createSlice } from '@reduxjs/toolkit';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentTrackId: null,
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
      // This now correctly handles the raw ID from the server
      state.currentTrackId = action.payload.currentTrack;
      state.isPlaying = action.payload.isPlaying;
    },
  },
});

export const { setCurrentTrackId, setPlaying, syncState } = playerSlice.actions;
export default playerSlice.reducer;
