import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MonitorPlay, Trophy, UserRound } from 'lucide-react-native';
import { workshopsApi } from '../features/workshops/api/workshopsApi';
import type { Workshop } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { Header } from '../shared/ui/Header';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function WorkshopListScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadWorkshops = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await workshopsApi.list({ page: 1, limit: 30 });
      setWorkshops(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Workshops" subtitle="Sessions, speakers, and meeting links" user={user} />
        <LoadingState label="Loading workshops..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Workshops" subtitle="Sessions, speakers, and meeting links" user={user} />
        <ErrorState message={error} onRetry={() => loadWorkshops()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Workshops" subtitle={`${workshops.length} sessions available`} user={user} />
      <FlatList
        contentContainerStyle={styles.list}
        data={workshops}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadWorkshops('refresh')} />}
        ListEmptyComponent={<EmptyState title="No workshops found" message="Workshops you can view will appear here." />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('WorkshopDetail', { workshopId: item.id })}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <MonitorPlay color={Colors.primary} size={20} />
              </View>
              <StatusBadge value={item.status} />
            </View>
            <View style={styles.competitionRow}>
              <Trophy color={Colors.primary} size={14} />
              <Text style={styles.competition} numberOfLines={1}>
                {item.competition?.title || 'Competition unavailable'}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}
            <Text style={styles.time}>{formatDateTime(item.startTime)}</Text>
            <View style={styles.presenterRow}>
              <UserRound color={Colors.textSecondary} size={14} />
              <Text style={styles.presenter}>
                {item.presenter?.fullName || item.speakerInfo?.name || item.speakerInfo?.email || 'Presenter TBA'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  list: { padding: 16, paddingBottom: 28 },
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
  competitionRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 8 },
  competition: { color: Colors.primary, flex: 1, fontSize: 12, fontWeight: '800' },
  title: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  time: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 12 },
  presenterRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 8 },
  presenter: { color: Colors.textSecondary, flex: 1, fontSize: 12 },
});
