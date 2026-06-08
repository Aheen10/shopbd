import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (userId?: number, role?: string) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      console.log('🔌 Socket connected');
      s.emit('join', { userId, role });
    });
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};