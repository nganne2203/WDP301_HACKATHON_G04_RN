import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Award, Medal, RefreshCw, Send } from 'lucide-react-native';
import { competitionsApi } from '../features/competitions/api/competitionsApi';
import { participantsApi } from '../features/participants/api/participantsApi';
import { finalistsApi } from '../features/finalists/api/finalistsApi';
import { rankingsApi } from '../features/rankings/api/rankingsApi';
import { resultsApi } from '../features/results/api/resultsApi';
import { roundsApi } from '../features/rounds/api/roundsApi';
import type { Competition, Ranking, RepositoryAccessAction, Round } from '../core/api/types';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { filterVisibleCompetitions } from '../core/utils/CompetitionVisibility';
import { Header } from '../shared/ui/Header';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type ResultTab = 'leaderboard' | 'finalists';
type ActionMode = 'idle' | 'generate' | 'select' | 'publish';

export function ResultsScreen() {
  const { user, hasPermission } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [finalists, setFinalists] = useState<Ranking[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [activeTab, setActiveTab] = useState<ResultTab>('leaderboard');
  const [repositoryAccessAction, setRepositoryAccessAction] = useState<RepositoryAccessAction>('NONE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>('idle');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const canPublish = hasPermission('RESULT_PUBLISH');

  const selectedCompetition = useMemo(
    () => competitions.find((competition) => competition.id === selectedCompetitionId) || competitions[0] || null,
    [competitions, selectedCompetitionId]
  );

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null,
    [rounds, selectedRoundId]
  );

  const list = activeTab === 'leaderboard' ? rankings : finalists;

  const loadCompetitions = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await competitionsApi.list({ page: 1, limit: 50 });
      const visibleCompetitions = await filterVisibleCompetitions(response.data, user, participantsApi.getMine);
      setCompetitions(visibleCompetitions);
      setSelectedCompetitionId((current) => {
        if (current && visibleCompetitions.some((competition) => competition.id === current)) return current;
        return visibleCompetitions[0]?.id || '';
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const loadRounds = useCallback(async (competitionId: string) => {
    if (!competitionId) {
      setRounds([]);
      return;
    }

    setError('');
    try {
      const response = await roundsApi.list({ competitionId, limit: 50 });
      setRounds(response.data);
      setSelectedRoundId((current) => {
        if (current && response.data.some((round) => round.id === current)) return current;
        return response.data[0]?.id || '';
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, []);

  const loadResults = useCallback(async (competitionId: string, roundId: string) => {
    if (!competitionId || !roundId) {
      setRankings([]);
      setFinalists([]);
      return;
    }

    setError('');
    try {
      const [rankingResponse, finalistResponse] = await Promise.all([
        rankingsApi.list({ competitionId, roundId, limit: 100 }),
        finalistsApi.list({ competitionId, roundId, limit: 100 }),
      ]);
      setRankings(rankingResponse.data);
      setFinalists(finalistResponse.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, []);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  useEffect(() => {
    loadRounds(selectedCompetition?.id || '');
  }, [loadRounds, selectedCompetition?.id]);

  useEffect(() => {
    loadResults(selectedCompetition?.id || '', selectedRound?.id || '');
  }, [loadResults, selectedCompetition?.id, selectedRound?.id]);

  function refreshAll() {
    loadCompetitions('refresh');
    if (selectedCompetition?.id) loadRounds(selectedCompetition.id);
    if (selectedCompetition?.id && selectedRound?.id) loadResults(selectedCompetition.id, selectedRound.id);
  }

  async function runAction(mode: Exclude<ActionMode, 'idle'>) {
    if (!selectedCompetition?.id || !selectedRound?.id) return;
    setActionMode(mode);
    setActionError('');
    try {
      if (mode === 'generate') {
        const response = await rankingsApi.generate({ competitionId: selectedCompetition.id, roundId: selectedRound.id });
        Alert.alert('Rankings generated', `${response.data.generated} leaderboard entries generated.`);
      }
      if (mode === 'select') {
        const response = await finalistsApi.select({ competitionId: selectedCompetition.id, roundId: selectedRound.id });
        Alert.alert('Finalists selected', `${response.data.selected} teams selected.`);
      }
      if (mode === 'publish') {
        const response = await resultsApi.publish({
          competitionId: selectedCompetition.id,
          roundId: selectedRound.id,
          repositoryAccessAction,
        });
        Alert.alert('Results published', `${response.data.published} rankings published. Repositories: ${response.data.repositoryAccessAction}.`);
      }
      await loadResults(selectedCompetition.id, selectedRound.id);
    } catch (actionFailure) {
      setActionError(errorMessage(actionFailure));
    } finally {
      setActionMode('idle');
    }
  }

  function confirmPublish() {
    Alert.alert(
      'Publish results?',
      'Published rankings become visible as official results for this round.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', style: 'destructive', onPress: () => runAction('publish') },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Results" subtitle="Leaderboard and finalists" user={user} />
        <LoadingState label="Loading results..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Results" subtitle="Leaderboard and finalists" user={user} />
        <ErrorState message={error} onRetry={() => loadCompetitions()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Results" subtitle="Leaderboard and finalists" user={user} />
      <FlatList
        contentContainerStyle={styles.content}
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        ListHeaderComponent={(
          <>
            <Selector label="Competition" items={competitions} selectedId={selectedCompetition?.id || ''} onSelect={setSelectedCompetitionId} />
            <Selector label="Round" items={rounds} selectedId={selectedRound?.id || ''} onSelect={setSelectedRoundId} />

            <View style={styles.hero}>
              <View style={styles.cardTop}>
                <View style={styles.heroIcon}>
                  <Award color={Colors.primary} size={24} />
                </View>
                {selectedRound && <StatusBadge value={selectedRound.status} />}
              </View>
              <Text style={styles.heroTitle}>{selectedRound?.name || 'No round selected'}</Text>
              <Text style={styles.heroSub}>
                {rankings.length} ranked teams - {finalists.length} finalists
              </Text>
            </View>

            <View style={styles.tabRow}>
              <TabButton label={`Leaderboard ${rankings.length}`} active={activeTab === 'leaderboard'} onPress={() => setActiveTab('leaderboard')} />
              <TabButton label={`Finalists ${finalists.length}`} active={activeTab === 'finalists'} onPress={() => setActiveTab('finalists')} />
            </View>

            {canPublish && selectedCompetition && selectedRound && (
              <View style={styles.actionsCard}>
                <Text style={styles.sectionTitle}>Coordinator actions</Text>
                <View style={styles.actionRow}>
                  <ActionButton
                    icon={<RefreshCw color={Colors.primary} size={16} />}
                    label="Generate"
                    loading={actionMode === 'generate'}
                    onPress={() => runAction('generate')}
                    variant="outline"
                  />
                  <ActionButton
                    icon={<Medal color={Colors.primary} size={16} />}
                    label="Finalists"
                    loading={actionMode === 'select'}
                    onPress={() => runAction('select')}
                    variant="outline"
                  />
                </View>

                <Text style={styles.optionLabel}>Repository access</Text>
                <View style={styles.accessRow}>
                  {(['NONE', 'FREEZE', 'REVOKE'] as RepositoryAccessAction[]).map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setRepositoryAccessAction(item)}
                      style={[styles.accessChip, repositoryAccessAction === item && styles.accessChipOn]}
                    >
                      <Text style={[styles.accessText, repositoryAccessAction === item && styles.accessTextOn]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ActionButton
                  icon={<Send color="#fff" size={16} />}
                  label="Publish results"
                  loading={actionMode === 'publish'}
                  onPress={confirmPublish}
                />
                {!!actionError && <Text style={styles.actionError}>{actionError}</Text>}
              </View>
            )}
          </>
        )}
        ListEmptyComponent={(
          <EmptyState
            title={activeTab === 'leaderboard' ? 'No rankings yet' : 'No finalists yet'}
            message={activeTab === 'leaderboard' ? 'Generate rankings after scores are locked.' : 'Select finalists after rankings are ready.'}
          />
        )}
        renderItem={({ item }) => <RankingRow ranking={item} finalistView={activeTab === 'finalists'} />}
      />
    </View>
  );
}

function Selector<T extends { id: string; title?: string; name?: string }>({
  items,
  label,
  onSelect,
  selectedId,
}: {
  items: T[];
  label: string;
  onSelect: (id: string) => void;
  selectedId: string;
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>{label}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelect(item.id)} style={[styles.chip, selectedId === item.id && styles.chipOn]}>
            <Text style={[styles.chipText, selectedId === item.id && styles.chipTextOn]} numberOfLines={1}>
              {item.title || item.name || item.id}
            </Text>
          </TouchableOpacity>
        )}
      />
    </>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabOn]}>
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({
  icon,
  label,
  loading,
  onPress,
  variant = 'primary',
}: {
  icon: ReactNode;
  label: string;
  loading: boolean;
  onPress: () => void;
  variant?: 'primary' | 'outline';
}) {
  const outline = variant === 'outline';
  return (
    <TouchableOpacity disabled={loading} onPress={onPress} style={[styles.actionButton, outline && styles.outlineButton]}>
      {loading ? <ActivityIndicator color={outline ? Colors.primary : '#fff'} /> : icon}
      <Text style={[styles.actionText, outline && styles.outlineText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RankingRow({ finalistView, ranking }: { finalistView: boolean; ranking: Ranking }) {
  return (
    <View style={styles.rankCard}>
      <View style={styles.cardTop}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankNumber}>{ranking.rank}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.teamName}>{ranking.team?.name || 'Team'}</Text>
          <Text style={styles.teamSub}>{ranking.team?.projectName || ranking.team?.chapterName || 'Project name not set'}</Text>
        </View>
        {finalistView || ranking.isSelectedForFinal ? <StatusBadge value="FINALIST" /> : null}
      </View>
      <View style={styles.statRow}>
        <Stat label="Score" value={formatNumber(ranking.score)} />
        <Stat label="Delta" value={formatNumber(ranking.pointDelta)} />
        <Stat label="Tie break" value={ranking.tieBreakMethod.replaceAll('_', ' ')} />
      </View>
      <Text style={styles.rankSub}>
        {ranking.publishedAt ? `Published ${formatDateTime(ranking.publishedAt)}` : `Calculated ${formatDateTime(ranking.calculatedAt)}`}
      </Text>
      {!!ranking.selectionReason && <Text style={styles.reason}>{ranking.selectionReason}</Text>}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 10 },
  chipRow: { gap: 8, paddingBottom: 14 },
  chip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: 230,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800' },
  chipTextOn: { color: '#fff' },
  hero: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  heroTitle: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800', marginTop: 12 },
  heroSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tab: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  tabOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '800' },
  tabTextOn: { color: '#fff' },
  actionsCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
    ...Shadow.sm,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 43,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  outlineButton: { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  outlineText: { color: Colors.primary },
  optionLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  accessRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  accessChip: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.full,
    flex: 1,
    paddingVertical: 8,
  },
  accessChipOn: { backgroundColor: Colors.primary },
  accessText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  accessTextOn: { color: '#fff' },
  actionError: { color: Colors.red, fontSize: 12, lineHeight: 18, marginTop: 10 },
  rankCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
    ...Shadow.sm,
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  rankNumber: { color: Colors.primary, fontSize: 18, fontWeight: '800' },
  flex: { flex: 1 },
  teamName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  teamSub: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  stat: { backgroundColor: Colors.gray50, borderRadius: Radius.md, flex: 1, padding: 9 },
  statValue: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: 10, marginTop: 3 },
  rankSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 10 },
  reason: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    color: Colors.greenDark,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    padding: 10,
  },
});
