// services/frontend/src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// Interceptor to log errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const roomAPI = {
  createRoom: (data) => apiClient.post('/api/rooms', data),
  getRoom: (roomId) => apiClient.get(`/api/rooms/${roomId}`),
  getPlaylist: (roomId) => apiClient.get(`/api/rooms/${roomId}/playlist`),
};

export default apiClient;
