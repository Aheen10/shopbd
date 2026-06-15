import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let lastJoinedKey: string | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    // Reset join tracking on disconnect so we rejoin after reconnect
    socket.on('disconnect', () => {
      lastJoinedKey = null;
    });
  }
  return socket;
};

export const joinRoom = (userId?: number, role?: string) => {
  const s = getSocket();
  const key = `${userId}_${role}`;

  // Avoid re-emitting join for the same user/role if already joined
  if (lastJoinedKey === key && s.connected) {
    return;
  }

  if (!s.connected) {
    s.connect();
    s.once('connect', () => {
      console.log('✅ Socket connected, emitting join:', { userId, role });
      s.emit('join', { userId, role });
      lastJoinedKey = key;
    });
  } else {
    console.log('✅ Emitting join:', { userId, role });
    s.emit('join', { userId, role });
    lastJoinedKey = key;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastJoinedKey = null;
  }
};