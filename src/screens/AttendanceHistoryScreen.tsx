import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClipboardList } from 'lucide-react-native';
import { participantsApi } from '../features/participants/api/participantsApi';
import type { Participant } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AttendanceHistory'>;

export function AttendanceHistoryScreen({ route }: Props) {
  const { eventId } = route.params;
  const { user, hasPermission } = useAuth();
  const [items, setItems] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadItems = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (!hasPermission('PARTICIPANT_VIEW')) {
      setLoading(false);
      return;
    }

    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await participantsApi.list({
        eventId,
        userId: user?.id,
        page: 1,
        limit: 50,
      });
      setItems(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId, hasPermission, user?.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  if (!hasPermission('PARTICIPANT_VIEW')) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Attendance history is restricted"
          message="The current backend exposes attendance reads through participant listing, which requires PARTICIPANT_VIEW."
        />
      </View>
    );
  }

  if (loading) return <LoadingState label="Loading attendance..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadItems()} />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadItems('refresh')} />}
      style={styles.container}
      ListHeaderComponent={(
        <View style={styles.header}>
          <ClipboardList color={Colors.primary} size={28} />
          <Text style={styles.title}>Attendance history</Text>
          <Text style={styles.sub}>Check-in and attended activities for your participant record.</Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No attendance records" message="Register for this event to create a participant record." />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.top}>
            <Text style={styles.cardTitle}>{item.event?.title || 'Event registration'}</Text>
            <StatusBadge value={item.checkInStatus} />
          </View>
          <Text style={styles.meta}>Participant status: {item.status}</Text>
          <Text style={styles.meta}>Team: {item.team?.name || 'No team'}</Text>
          <Text style={styles.meta}>Joined: {formatDateTime(item.joinedAt || item.createdAt)}</Text>
          <View style={styles.activityWrap}>
            {item.attendedActivities.length ? item.attendedActivities.map((activity) => (
              <StatusBadge key={activity} value={activity} />
            )) : <Text style={styles.noActivities}>No activities recorded</Text>}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    ...Shadow.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 10 },
  sub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  top: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  cardTitle: { color: Colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '800' },
  meta: { color: Colors.textSecondary, fontSize: 13, marginTop: 6 },
  activityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  noActivities: { color: Colors.textMuted, fontSize: 12, fontStyle: 'italic' },
});
