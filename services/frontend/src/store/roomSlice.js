// services/frontend/src/store/roomSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roomAPI } from '../services/api';

// Async thunk for creating a room
export const createRoom = createAsyncThunk(
  'room/createRoom',
  async (roomName, { rejectWithValue }) => {
    try {
      const response = await roomAPI.createRoom({ name: roomName });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState: {
    currentRoom: null,
    loading: false,
    error: null,
    listenerCount: 0,
    isHost: false,
  },
  reducers: {
    setHost: (state, action) => {
      state.isHost = action.payload;
    },
    updateListenerCount: (state, action) => {
      state.listenerCount = action.payload;
    },
    clearRoom: (state) => {
        state.currentRoom = null;
        state.isHost = false;
        state.listenerCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRoom = action.payload;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setHost, updateListenerCount, clearRoom } = roomSlice.actions;

export default roomSlice.reducer;
