import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { chatApi } from '../features/chat/api/chatApi';
import { useChatStore } from '../features/chat/model/chatStore';
import type { ChatRoom } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState } from '../shared/ui/ScreenState';
import { Colors, Radius } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ChatRoomsScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const rooms = useChatStore((state) => state.rooms);
  const setRooms = useChatStore((state) => state.setRooms);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRooms = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await chatApi.listRooms();
      setRooms(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setRooms]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.muted}>Loading chats...</Text>
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => loadRooms()} />;

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Team chats</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={rooms}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRooms('refresh')} />}
        ListEmptyComponent={<EmptyState title="No chat rooms" message="Your team chats will appear here once you join a team." />}
        renderItem={({ item }) => (
          <ChatRoomRow
            room={item}
            onPress={() => navigation.navigate('TeamChat', {
              chatRoomId: item.id,
              teamId: item.teamId,
              teamName: item.team?.name,
            })}
          />
        )}
      />
    </View>
  );
}

function ChatRoomRow({ room, onPress }: { room: ChatRoom; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.icon}>
        <MessageCircle color={Colors.primary} size={20} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.roomName} numberOfLines={1}>{room.team?.name || 'Team chat'}</Text>
          <Text style={styles.time}>{formatDateTime(room.lastMessage?.createdAt || room.updatedAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {room.lastMessage ? room.lastMessage.message : 'No messages yet'}
        </Text>
      </View>
      {room.unreadCount > 0 && (
        <View style={styles.unread}>
          <Text style={styles.unreadText}>{room.unreadCount > 99 ? '99+' : room.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  center: { alignItems: 'center', backgroundColor: Colors.background, flex: 1, justifyContent: 'center' },
  muted: { color: Colors.textSecondary, fontSize: 13, marginTop: 10 },
  statusBar: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 28 },
  row: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    marginRight: 11,
    width: 42,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  roomName: { color: Colors.textPrimary, flex: 1, fontSize: 14, fontWeight: '800' },
  time: { color: Colors.textMuted, fontSize: 10, maxWidth: 92 },
  preview: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  unread: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 24,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 24,
    paddingHorizontal: 7,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
