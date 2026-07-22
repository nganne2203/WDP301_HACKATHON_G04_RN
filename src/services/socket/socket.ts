import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../core/api/client';
import { SOCKET_EVENTS } from './socketEvents';

type ServerToClientEvents = {
  [SOCKET_EVENTS.RECEIVE_MESSAGE]: (payload: unknown) => void;
  [SOCKET_EVENTS.USER_TYPING]: (payload: unknown) => void;
  [SOCKET_EVENTS.USER_STOP_TYPING]: (payload: unknown) => void;
  [SOCKET_EVENTS.MESSAGE_SEEN]: (payload: unknown) => void;
  [SOCKET_EVENTS.NOTIFICATION_CREATED]: (payload: unknown) => void;
  [SOCKET_EVENTS.NOTIFICATION_READ]: (payload: unknown) => void;
  [SOCKET_EVENTS.NOTIFICATIONS_READ_ALL]: (payload: unknown) => void;
  [SOCKET_EVENTS.ERROR]: (payload: unknown) => void;
};

type ClientToServerEvents = {
  [SOCKET_EVENTS.JOIN_TEAM_ROOM]: (payload: unknown, callback?: (response: unknown) => void) => void;
  [SOCKET_EVENTS.LEAVE_TEAM_ROOM]: (payload: unknown, callback?: (response: unknown) => void) => void;
  [SOCKET_EVENTS.SEND_MESSAGE]: (payload: unknown, callback?: (response: unknown) => void) => void;
  [SOCKET_EVENTS.USER_TYPING]: (payload: unknown) => void;
  [SOCKET_EVENTS.USER_STOP_TYPING]: (payload: unknown) => void;
  [SOCKET_EVENTS.MESSAGE_SEEN]: (payload: unknown, callback?: (response: unknown) => void) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, '');

let socket: AppSocket | null = null;

export function connectSocket(token: string) {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}

export function isConnected() {
  return Boolean(socket?.connected);
}
