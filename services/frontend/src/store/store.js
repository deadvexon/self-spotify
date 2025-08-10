import { configureStore } from '@reduxjs/toolkit';
import roomReducer from './roomSlice';
import playerReducer from './playerSlice'; // Import the new reducer

export const store = configureStore({
  reducer: {
    room: roomReducer,
    player: playerReducer, // Add it to the store
  },
});
