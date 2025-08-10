// services/frontend/src/services/socket.js
import io from 'socket.io-client';

class SocketService {
  socket = null;

  connect(apiUrl) {
    // We connect to the gateway, which will proxy to the sync-service
    this.socket = io(apiUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('joinRoom', { roomId });
    }
  }

  // --- Listen for events from the server ---
  onRoomState(callback) {
    if (this.socket) {
      this.socket.on('roomState', callback);
    }
  }

  onListenerJoined(callback) {
    if (this.socket) {
      this.socket.on('listenerJoined', callback);
    }
  }

  onListenerLeft(callback) {
    if (this.socket) {
      this.socket.on('listenerLeft', callback);
    }
  }

  onHostAssigned(callback) {
    if (this.socket) {
      this.socket.on('hostAssigned', callback);
    }
  }

  emitChangeTrack(roomId, trackId) {
  if (this.socket) {
    this.socket.emit('changeTrack', { roomId, trackId });
  }
 }
  emitPlayPause(data) {
  if (this.socket) this.socket.emit('playPause', data);
}

onTrackChanged(callback) {
  if (this.socket) this.socket.on('trackChanged', callback);
}

onPlayPause(callback) {
  if (this.socket) this.socket.on('playPause', callback);
}

}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
