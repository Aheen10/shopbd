import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};

export const connectSocket = (userId?: number, role?: string) => {
  const s = getSocket();

  // Remove old listeners to avoid duplicates
  s.off('connect');

  const joinRoom = () => {
    console.log('🔌 Socket connected, joining room...', { userId, role });
    s.emit('join', { userId, role });
  };

  if (s.connected) {
    // Already connected, join immediately
    joinRoom();
  } else {
    s.on('connect', joinRoom);
    if (!s.connected) s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};