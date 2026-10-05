import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketHost =
      import.meta.env.VITE_SOCKET_URL ||
      (apiUrl.startsWith('http') ? apiUrl.replace(/\/api\/v1\/?$/, '') : '');

    socket = io(socketHost ? `${socketHost}/chat` : '/chat', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected to server:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚡ Socket.io connection error:', err.message);
    });
  }
  return socket;
};
