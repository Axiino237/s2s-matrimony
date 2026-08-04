import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    const baseUrl = API_URL.replace(/\/api\/v1\/?$/, '');
    
    socket = io(`${baseUrl}/chat`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected to server:', socket?.id);
    });
  }
  return socket;
};
