import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ChatMessage } from '../../core/api/types';
import { getAccessToken } from '../../core/storage/tokenStorage';
import { useAuth } from '../../core/session/AuthContext';
import { useChatStore } from '../../features/chat/model/chatStore';
import { connectSocket, disconnectSocket, getSocket, type AppSocket } from './socket';
import { SOCKET_EVENTS } from './socketEvents';
import { useNotificationStore } from '../../features/notifications/model/notificationStore';

interface SocketContextValue {
  socket: AppSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

function isChatMessage(payload: unknown): payload is ChatMessage {
  return Boolean(payload && typeof payload === 'object' && 'id' in payload && 'chatRoomId' in payload);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootSocket() {
      if (!isAuthenticated) {
        disconnectSocket();
        useChatStore.getState().resetChat();
        setSocket(null);
        setConnected(false);
        return;
      }

      const token = await getAccessToken();
      if (!token || !mounted) return;

      useChatStore.getState().setConnectionStatus('connecting');
      const activeSocket = connectSocket(token);
      setSocket(activeSocket);

      activeSocket.on(SOCKET_EVENTS.CONNECT, () => {
        setConnected(true);
        useChatStore.getState().setConnectionStatus('connected');
      });

      activeSocket.on(SOCKET_EVENTS.DISCONNECT, () => {
        setConnected(false);
        useChatStore.getState().setConnectionStatus('disconnected');
      });

      activeSocket.on('connect_error', () => {
        setConnected(false);
        useChatStore.getState().setConnectionStatus('error');
      });

      activeSocket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (payload) => {
        if (isChatMessage(payload)) useChatStore.getState().upsertMessage(payload);
      });

      activeSocket.on(SOCKET_EVENTS.USER_TYPING, (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const typing = payload as { teamId?: string; userId?: string; fullName?: string; role?: string };
        if (typing.teamId && typing.userId) {
          useChatStore.getState().setTypingUser({
            teamId: typing.teamId,
            userId: typing.userId,
            fullName: typing.fullName,
            role: typing.role,
          });
        }
      });

      activeSocket.on(SOCKET_EVENTS.USER_STOP_TYPING, (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const typing = payload as { teamId?: string; userId?: string };
        if (typing.teamId && typing.userId) useChatStore.getState().removeTypingUser(typing.teamId, typing.userId);
      });

      activeSocket.on(SOCKET_EVENTS.MESSAGE_SEEN, (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const seen = payload as { chatRoomId?: string };
        if (seen.chatRoomId) useChatStore.getState().markRoomSeen(seen.chatRoomId);
      });

      activeSocket.on(SOCKET_EVENTS.NOTIFICATION_CREATED, () => {
        useNotificationStore.getState().requestRefresh();
      });

      activeSocket.on(SOCKET_EVENTS.NOTIFICATION_READ, () => {
        useNotificationStore.getState().requestRefresh();
      });

      activeSocket.on(SOCKET_EVENTS.NOTIFICATIONS_READ_ALL, () => {
        useNotificationStore.getState().requestRefresh();
      });
    }

    bootSocket();

    return () => {
      mounted = false;
      const activeSocket = getSocket();
      activeSocket?.off(SOCKET_EVENTS.CONNECT);
      activeSocket?.off(SOCKET_EVENTS.DISCONNECT);
      activeSocket?.off('connect_error');
      activeSocket?.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
      activeSocket?.off(SOCKET_EVENTS.USER_TYPING);
      activeSocket?.off(SOCKET_EVENTS.USER_STOP_TYPING);
      activeSocket?.off(SOCKET_EVENTS.MESSAGE_SEEN);
      activeSocket?.off(SOCKET_EVENTS.NOTIFICATION_CREATED);
      activeSocket?.off(SOCKET_EVENTS.NOTIFICATION_READ);
      activeSocket?.off(SOCKET_EVENTS.NOTIFICATIONS_READ_ALL);
    };
  }, [isAuthenticated]);

  const value = useMemo<SocketContextValue>(() => ({
    socket,
    isConnected: connected,
  }), [connected, socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside SocketProvider');
  return context;
}
