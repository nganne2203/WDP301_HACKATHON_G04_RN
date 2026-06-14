import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarDays, Search } from 'lucide-react-native';
import { eventsApi } from '../features/events/api/eventsApi';
import type { Event, Pagination } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateRange } from '../core/utils/format';
import { Header } from '../shared/ui/Header';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function EventListScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await eventsApi.list({ page: 1, limit: 20 });
      setEvents(response.data);
      setPagination(response.pagination);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Events" subtitle="Hackathon seasons and schedules" user={user} onLogoutPress={logout} />
        <LoadingState label="Loading events..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Events" subtitle="Hackathon seasons and schedules" user={user} onLogoutPress={logout} />
        <ErrorState message={error} onRetry={() => loadEvents()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Events" subtitle={`${pagination?.totalItems ?? events.length} available`} user={user} onLogoutPress={logout} />
      <FlatList
        contentContainerStyle={styles.list}
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadEvents('refresh')} />}
        ListEmptyComponent={<EmptyState title="No events found" message="Events you can view will appear here." />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <CalendarDays color={Colors.primary} size={20} />
              </View>
              <StatusBadge value={item.status} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.theme && <Text style={styles.theme}>{item.theme}</Text>}
            {!!item.description && <Text numberOfLines={2} style={styles.description}>{item.description}</Text>}
            <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate)}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{item.seriesName || 'SEAL Hackathon'}</Text>
              <Text style={styles.meta}>{item.season || item.semester || 'Season TBA'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={(
          <View style={styles.searchHint}>
            <Search color={Colors.textSecondary} size={16} />
            <Text style={styles.searchText}>Showing events available to your role</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  list: { padding: 16, paddingBottom: 28 },
  searchHint: {
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
  searchText: { color: Colors.textSecondary, fontSize: 13 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.blue50,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  theme: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 3 },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  date: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  meta: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.full,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
});
