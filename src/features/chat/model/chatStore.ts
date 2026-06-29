import { create } from 'zustand';
import type { ChatMessage, ChatRoom } from '../../../core/api/types';

export type SocketConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TypingUser {
  userId: string;
  teamId: string;
  fullName?: string;
  role?: string;
}

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, TypingUser[]>;
  connectionStatus: SocketConnectionStatus;
  unreadCount: number;
  setConnectionStatus: (status: SocketConnectionStatus) => void;
  setRooms: (rooms: ChatRoom[]) => void;
  upsertRoom: (room: ChatRoom) => void;
  setMessages: (chatRoomId: string, messages: ChatMessage[]) => void;
  upsertMessage: (message: ChatMessage) => void;
  markMessageFailed: (chatRoomId: string, clientMessageId: string) => void;
  setTypingUser: (typingUser: TypingUser) => void;
  removeTypingUser: (teamId: string, userId: string) => void;
  markRoomSeen: (chatRoomId: string) => void;
  resetChat: () => void;
}

const sortByCreatedAt = (messages: ChatMessage[]) => {
  return [...messages].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
};

const getMessageKey = (message: ChatMessage) => message.clientMessageId || message.id;

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  messages: {},
  typingUsers: {},
  connectionStatus: 'idle',
  unreadCount: 0,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setRooms: (rooms) => set({
    rooms,
    unreadCount: rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0),
  }),

  upsertRoom: (room) => set((state) => {
    const existing = state.rooms.filter((item) => item.id !== room.id);
    const rooms = [room, ...existing];
    return {
      rooms,
      unreadCount: rooms.reduce((sum, item) => sum + (item.unreadCount || 0), 0),
    };
  }),

  setMessages: (chatRoomId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatRoomId]: sortByCreatedAt(messages),
    },
  })),

  upsertMessage: (message) => set((state) => {
    const currentMessages = state.messages[message.chatRoomId] || [];
    const key = getMessageKey(message);
    const filtered = currentMessages.filter((item) => item.id !== message.id && getMessageKey(item) !== key);
    const normalizedMessage = { ...message, status: message.status || 'sent' };
    const messages = sortByCreatedAt([...filtered, normalizedMessage]);
    const rooms = state.rooms.map((room) => (
      room.id === message.chatRoomId ? { ...room, lastMessage: normalizedMessage } : room
    ));

    return {
      messages: {
        ...state.messages,
        [message.chatRoomId]: messages,
      },
      rooms,
    };
  }),

  markMessageFailed: (chatRoomId, clientMessageId) => set((state) => ({
    messages: {
      ...state.messages,
      [chatRoomId]: (state.messages[chatRoomId] || []).map((message) => (
        message.clientMessageId === clientMessageId ? { ...message, status: 'failed' } : message
      )),
    },
  })),

  setTypingUser: (typingUser) => set((state) => {
    const current = state.typingUsers[typingUser.teamId] || [];
    return {
      typingUsers: {
        ...state.typingUsers,
        [typingUser.teamId]: [
          typingUser,
          ...current.filter((user) => user.userId !== typingUser.userId),
        ],
      },
    };
  }),

  removeTypingUser: (teamId, userId) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [teamId]: (state.typingUsers[teamId] || []).filter((user) => user.userId !== userId),
    },
  })),

  markRoomSeen: (chatRoomId) => set((state) => {
    const rooms = state.rooms.map((room) => (
      room.id === chatRoomId ? { ...room, unreadCount: 0 } : room
    ));

    return {
      rooms,
      unreadCount: rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0),
    };
  }),

  resetChat: () => set({
    rooms: [],
    messages: {},
    typingUsers: {},
    connectionStatus: 'idle',
    unreadCount: 0,
  }),
}));
