import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Clock3 } from 'lucide-react-native';
import { timelinesApi } from '../features/timelines/api/timelinesApi';
import type { TimelineEvent } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Timeline'>;

export function TimelineScreen({ route }: Props) {
  const { eventId, eventTitle } = route.params;
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadItems = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await timelinesApi.list({ eventId, limit: 50 });
      setItems(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  if (loading) return <LoadingState label="Loading timeline..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadItems()} />;

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadItems('refresh')} />}
        ListHeaderComponent={(
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Timeline</Text>
            {!!eventTitle && <Text style={styles.headerSub}>{eventTitle}</Text>}
          </View>
        )}
        ListEmptyComponent={<EmptyState title="No timeline items" message="This event does not have published timeline entries yet." />}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.left}>
              <View style={styles.dot}>
                <Clock3 color={Colors.primary} size={14} />
              </View>
              {index < items.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.title}>{item.title}</Text>
                <StatusBadge value={item.status} />
              </View>
              <Text style={styles.type}>{item.eventType.replaceAll('_', ' ')}</Text>
              {!!item.description && <Text style={styles.description}>{item.description}</Text>}
              <Text style={styles.time}>{formatDateTime(item.startTime)}</Text>
              {!!item.endTime && <Text style={styles.endTime}>Ends {formatDateTime(item.endTime)}</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  list: { padding: 16, paddingBottom: 28 },
  headerCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    ...Shadow.sm,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800' },
  headerSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row' },
  left: { alignItems: 'center', marginRight: 12, width: 28 },
  dot: {
    alignItems: 'center',
    backgroundColor: Colors.blue50,
    borderColor: Colors.blue100,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  line: { backgroundColor: Colors.border, flex: 1, marginVertical: 4, width: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  title: { color: Colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '800' },
  type: { color: Colors.primary, fontSize: 11, fontWeight: '800', marginTop: 5 },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  time: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 10 },
  endTime: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
});
