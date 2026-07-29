import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle2, Clock3 } from 'lucide-react-native';
import { participantsApi } from '../features/participants/api/participantsApi';
import type { Participant } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, initials } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

export function CheckInScreen({ route }: Props) {
  const { competitionId } = route.params;
  const { hasPermission } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingId, setCheckingId] = useState('');
  const [error, setError] = useState('');

  const checkedInCount = useMemo(() => {
    return participants.filter((participant) => participant.checkInStatus === 'CHECKED_IN').length;
  }, [participants]);

  const loadParticipants = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (!hasPermission('PARTICIPANT_VIEW')) {
      setLoading(false);
      return;
    }

    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await participantsApi.list({ competitionId, page: 1, limit: 100 });
      setParticipants(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [competitionId, hasPermission]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  async function checkIn(participantId: string) {
    if (!hasPermission('PARTICIPANT_APPROVE')) return;
    setCheckingId(participantId);
    try {
      const response = await participantsApi.checkIn(participantId);
      setParticipants((items) => items.map((item) => item.id === participantId ? response.data : item));
    } catch (checkError) {
      setError(errorMessage(checkError));
    } finally {
      setCheckingId('');
    }
  }

  if (!hasPermission('PARTICIPANT_VIEW')) {
    return (
      <View style={styles.container}>
        <EmptyState title="Check-in requires coordinator access" message="This backend endpoint is protected by PARTICIPANT_VIEW and PARTICIPANT_APPROVE." />
      </View>
    );
  }

  if (loading) return <LoadingState label="Loading participants..." />;
  if (error && !participants.length) return <ErrorState message={error} onRetry={() => loadParticipants()} />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={participants}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadParticipants('refresh')} />}
      style={styles.container}
      ListHeaderComponent={(
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Competition check-in</Text>
          <Text style={styles.summaryValue}>{checkedInCount}/{participants.length}</Text>
          <Text style={styles.summarySub}>participants checked in</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No participants" message="Registered participants for this competition will appear here." />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(item.user?.fullName, item.user?.email)}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{item.user?.fullName || item.user?.email || 'Participant'}</Text>
            <Text style={styles.sub}>{item.user?.email || item.team?.name || 'No email'}</Text>
            <View style={styles.statusRow}>
              <StatusBadge value={item.checkInStatus} />
              <StatusBadge value={item.status} />
            </View>
          </View>
          {item.checkInStatus === 'CHECKED_IN' ? (
            <CheckCircle2 color={Colors.green} size={22} />
          ) : (
            <TouchableOpacity
              disabled={!hasPermission('PARTICIPANT_APPROVE') || checkingId === item.id}
              onPress={() => checkIn(item.id)}
              style={styles.checkButton}
            >
              {checkingId === item.id ? <ActivityIndicator color="#fff" /> : <Clock3 color="#fff" size={16} />}
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  summary: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    ...Shadow.sm,
  },
  summaryTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  summaryValue: { color: Colors.primary, fontSize: 34, fontWeight: '800', marginTop: 6 },
  summarySub: { color: Colors.textSecondary, fontSize: 13 },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.blue100,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 11,
    width: 40,
  },
  avatarText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  body: { flex: 1 },
  name: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  sub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  checkButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  error: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    padding: 10,
    textAlign: 'center',
  },
});
