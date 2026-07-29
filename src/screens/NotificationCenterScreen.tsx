import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, CheckCheck, Trophy } from 'lucide-react-native';
import { notificationsApi } from '../features/notifications/api/notificationsApi';
import type { Notification } from '../core/api/types';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { Header } from '../shared/ui/Header';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';
import { useNotificationStore } from '../features/notifications/model/notificationStore';

export function NotificationCenterScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const refreshRevision = useNotificationStore((state) => state.refreshRevision);

  const unreadCount = notifications.filter((item) => item.status === 'UNREAD').length;

  const loadNotifications = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await notificationsApi.list({ page: 1, limit: 50 });
      setNotifications(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, refreshRevision]);

  async function markAsRead(notification: Notification) {
    if (notification.status === 'READ') return;
    const previous = notifications;
    setNotifications((items) => items.map((item) => (
      item.id === notification.id ? { ...item, status: 'READ' } : item
    )));
    try {
      const response = await notificationsApi.markAsRead(notification.id);
      setNotifications((items) => items.map((item) => (
        item.id === notification.id ? response.data : item
      )));
    } catch {
      setNotifications(previous);
    }
  }

  async function markAllAsRead() {
    if (!unreadCount) return;
    setMarkingAll(true);
    const previous = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, status: 'READ' })));
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      setNotifications(previous);
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Notifications" subtitle="Your latest updates" user={user} />
        <LoadingState label="Loading notifications..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Notifications" subtitle="Your latest updates" user={user} />
        <ErrorState message={error} onRetry={() => loadNotifications()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notifications" subtitle={`${unreadCount} unread`} user={user} />
      <FlatList
        contentContainerStyle={styles.list}
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications('refresh')} />}
        ListHeaderComponent={(
          <TouchableOpacity
            disabled={!unreadCount || markingAll}
            onPress={markAllAsRead}
            style={[styles.markAll, (!unreadCount || markingAll) && styles.disabled]}
          >
            <CheckCheck color={unreadCount ? Colors.primary : Colors.textMuted} size={17} />
            <Text style={[styles.markAllText, !unreadCount && styles.mutedText]}>Mark all as read</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No notifications" message="Updates for your account will appear here." />}
        renderItem={({ item }) => {
          const competitionTitle = getCompetitionTitle(item);

          return (
            <TouchableOpacity activeOpacity={0.78} onPress={() => markAsRead(item)} style={styles.card}>
              <View style={[styles.iconWrap, item.status === 'UNREAD' && styles.iconUnread]}>
                <Bell color={item.status === 'UNREAD' ? Colors.primary : Colors.textMuted} size={18} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.title}>{item.title}</Text>
                  <StatusBadge value={item.status} />
                </View>
                {!!competitionTitle && (
                  <View style={styles.competitionRow}>
                    <Trophy color={Colors.primary} size={12} />
                    <Text style={styles.competition} numberOfLines={1}>{competitionTitle}</Text>
                  </View>
                )}
                {!!item.message && <Text style={styles.message}>{item.message}</Text>}
                <Text style={styles.time}>{item.type.replaceAll('_', ' ')} - {formatDateTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function getCompetitionTitle(notification: Notification) {
  const value = notification.metadata?.eventTitle || notification.metadata?.competitionTitle;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  list: { padding: 16, paddingBottom: 28 },
  markAll: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    padding: 12,
  },
  disabled: { opacity: 0.65 },
  markAllText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  mutedText: { color: Colors.textMuted },
  card: {
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 14,
    ...Shadow.sm,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconUnread: { backgroundColor: Colors.blue50 },
  cardBody: { flex: 1 },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  title: { color: Colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '800' },
  competitionRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 7 },
  competition: { color: Colors.primary, flex: 1, fontSize: 11, fontWeight: '700' },
  message: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 7 },
  time: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 9 },
});
