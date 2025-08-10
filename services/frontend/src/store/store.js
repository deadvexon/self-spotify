// services/frontend/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import roomReducer from './roomSlice';
import playerReducer from './playerSlice';

export const store = configureStore({
  reducer: {
    room: roomReducer,
    player: playerReducer,
  },
});
