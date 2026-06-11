import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
};

export const joinRoom = (userId?: number, role?: string) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.once('connect', () => {
      console.log('✅ Socket connected, emitting join:', { userId, role });
      s.emit('join', { userId, role });
    });
  } else {
    console.log('✅ Already connected, emitting join:', { userId, role });
    s.emit('join', { userId, role });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};