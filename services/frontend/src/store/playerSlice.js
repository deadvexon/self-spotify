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
  },
});

export const { setCurrentTrackId, setPlaying } = playerSlice.actions;
export default playerSlice.reducer;
