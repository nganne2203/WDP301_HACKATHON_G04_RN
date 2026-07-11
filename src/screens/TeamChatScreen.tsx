import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SendHorizontal } from 'lucide-react-native';
import { chatApi } from '../features/chat/api/chatApi';
import { teamsApi } from '../features/teams/api/teamsApi';
import { useChatStore } from '../features/chat/model/chatStore';
import { useAuth } from '../core/session/AuthContext';
import type { ChatMessage, ChatRoom, Team } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, initials } from '../core/utils/format';
import { EmptyState, ErrorState } from '../shared/ui/ScreenState';
import { useSocket } from '../services/socket/socketProvider';
import { SOCKET_EVENTS } from '../services/socket/socketEvents';
import { Colors, Radius } from '../theme/colors';

type ChatRoute = RouteProp<RootStackParamList, 'TeamChat'>;
const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_TYPING_USERS: ReturnType<typeof useChatStore.getState>['typingUsers'][string] = [];

export function TeamChatScreen() {
  const route = useRoute<ChatRoute>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const setRooms = useChatStore((state) => state.setRooms);
  const upsertRoom = useChatStore((state) => state.upsertRoom);
  const setMessages = useChatStore((state) => state.setMessages);
  const upsertMessage = useChatStore((state) => state.upsertMessage);
  const markMessageFailed = useChatStore((state) => state.markMessageFailed);
  const markRoomSeen = useChatStore((state) => state.markRoomSeen);
  const typingUsers = useChatStore((state) => state.typingUsers[route.params.teamId] || EMPTY_TYPING_USERS);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const stopTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const messages = useChatStore((state) => (room?.id ? state.messages[room.id] || EMPTY_MESSAGES : EMPTY_MESSAGES));
  const visibleTypingUsers = useMemo(() => typingUsers.filter((typingUser) => typingUser.userId !== user?.id), [typingUsers, user?.id]);

  const loadRoom = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const roomsResponse = await chatApi.listRooms();
      setRooms(roomsResponse.data);
      const activeRoom = roomsResponse.data.find((item) => (
        item.id === route.params.chatRoomId || item.teamId === route.params.teamId
      ));

      if (!activeRoom) throw new Error('Team chat room is not available for your account.');

      setRoom(activeRoom);
      upsertRoom(activeRoom);

      const teamResponse = await teamsApi.getById(activeRoom.teamId);
      setTeam(teamResponse.data);

      const messagesResponse = await chatApi.listMessages(activeRoom.id, { limit: 80 });
      setMessages(activeRoom.id, messagesResponse.data);
      markRoomSeen(activeRoom.id);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [markRoomSeen, route.params.chatRoomId, route.params.teamId, setMessages, setRooms, upsertRoom]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    if (!socket || !room) return undefined;

    socket.emit(SOCKET_EVENTS.JOIN_TEAM_ROOM, {
      teamId: room.teamId,
      userId: user?.id,
      role: room.participantRole,
    }, (response) => {
      const joinResponse = response as { ok?: boolean; room?: ChatRoom };
      if (joinResponse?.room) {
        setRoom(joinResponse.room);
        upsertRoom(joinResponse.room);
      }
    });

    socket.emit(SOCKET_EVENTS.MESSAGE_SEEN, { chatRoomId: room.id, teamId: room.teamId });

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_TEAM_ROOM, { teamId: room.teamId, roomKey: room.roomKey });
    };
  }, [room?.id, socket, upsertRoom, user?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  const emitStopTyping = useCallback(() => {
    if (!socket || !room) return;
    socket.emit(SOCKET_EVENTS.USER_STOP_TYPING, { teamId: room.teamId });
  }, [room, socket]);

  const handleDraftChange = useCallback((value: string) => {
    setDraft(value);
    if (!socket || !room || !isConnected) return;

    if (value.trim()) socket.emit(SOCKET_EVENTS.USER_TYPING, { teamId: room.teamId });
    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(emitStopTyping, 1200);
  }, [emitStopTyping, isConnected, room, socket]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || !room || sending) return;

    const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    const optimisticMessage: ChatMessage = {
      id: clientMessageId,
      chatRoomId: room.id,
      teamId: room.teamId,
      senderId: user?.id || '',
      sender: user ? { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl } : null,
      senderRole: room.participantRole || 'member',
      message: text,
      messageType: 'text',
      clientMessageId,
      isSeen: false,
      createdAt,
      updatedAt: createdAt,
      status: 'sending',
    };

    setDraft('');
    setSending(true);
    emitStopTyping();
    upsertMessage(optimisticMessage);

    if (socket && isConnected) {
      const timeout = setTimeout(() => {
        markMessageFailed(room.id, clientMessageId);
        setSending(false);
      }, 10000);

      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        teamId: room.teamId,
        chatRoomId: room.id,
        message: text,
        messageType: 'text',
        clientMessageId,
      }, (response) => {
        clearTimeout(timeout);
        const sendResponse = response as { ok?: boolean; message?: ChatMessage };
        if (sendResponse?.ok && sendResponse.message) upsertMessage(sendResponse.message);
        else markMessageFailed(room.id, clientMessageId);
        setSending(false);
      });
      return;
    }

    try {
      const response = await chatApi.sendMessage({
        chatRoomId: room.id,
        teamId: room.teamId,
        message: text,
        messageType: 'text',
        clientMessageId,
      });
      upsertMessage(response.data);
    } catch {
      markMessageFailed(room.id, clientMessageId);
    } finally {
      setSending(false);
    }
  }, [draft, emitStopTyping, isConnected, markMessageFailed, room, sending, socket, upsertMessage, user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.muted}>Opening team chat...</Text>
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={loadRoom} />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      {!!team?.assignedMentors?.length && (
        <View style={styles.mentorBar}>
          <Text style={styles.mentorLabel}>Mentor</Text>
          <View style={styles.mentorPills}>
            {team.assignedMentors.map((mentor) => (
              <View key={mentor.id} style={styles.mentorPill}>
                <Text style={styles.mentorPillText}>{mentor.fullName || mentor.email}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <FlatList
        ref={listRef}
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="No messages yet" message="Start the team conversation with your mentor." />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <MessageBubble message={item} isMine={item.senderId === user?.id} />}
      />
      {visibleTypingUsers.length > 0 && (
        <Text style={styles.typing}>
          {visibleTypingUsers[0].fullName || 'Someone'} is typing...
        </Text>
      )}
      <View style={styles.composer}>
        <TextInput
          multiline
          onChangeText={handleDraftChange}
          placeholder="Message your team..."
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          value={draft}
        />
        <TouchableOpacity
          disabled={!draft.trim() || sending}
          onPress={sendMessage}
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonOff]}
        >
          <SendHorizontal color="#fff" size={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  const senderName = message.sender?.fullName || message.sender?.email || (isMine ? 'You' : 'Participant');

  return (
    <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
      {!isMine && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(senderName, message.sender?.email)}</Text>
        </View>
      )}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {!isMine && (
          <View style={styles.metaRow}>
            <Text style={styles.sender} numberOfLines={1}>{senderName}</Text>
            <Text style={styles.role}>{message.senderRole.toUpperCase()}</Text>
          </View>
        )}
        <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{message.message}</Text>
        <Text style={[styles.messageState, isMine && styles.messageStateMine]}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  center: { alignItems: 'center', backgroundColor: Colors.background, flex: 1, justifyContent: 'center' },
  muted: { color: Colors.textSecondary, fontSize: 13, marginTop: 10 },
  mentorBar: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  mentorLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  mentorPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mentorPill: {
    backgroundColor: Colors.blue100,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mentorPillText: { color: Colors.primary, fontSize: 11, fontWeight: '700' },
  messages: { flexGrow: 1, padding: 14, paddingBottom: 20 },
  messageRow: { alignItems: 'flex-end', flexDirection: 'row', marginBottom: 12, maxWidth: '88%' },
  messageRowMine: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.blue100,
    borderRadius: Radius.full,
    height: 32,
    justifyContent: 'center',
    marginRight: 8,
    width: 32,
  },
  avatarText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  bubble: { borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleMine: { backgroundColor: Colors.primary },
  bubbleOther: { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 4 },
  sender: { color: Colors.textPrimary, flexShrink: 1, fontSize: 12, fontWeight: '800' },
  role: { color: Colors.primary, fontSize: 10, fontWeight: '900' },
  messageText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
  messageTextMine: { color: '#fff' },
  messageState: { color: Colors.textMuted, fontSize: 10, marginTop: 5 },
  messageStateMine: { color: Colors.blue100 },
  typing: { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic', paddingHorizontal: 16, paddingVertical: 6 },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  input: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendButtonOff: { backgroundColor: Colors.gray300 },
});
