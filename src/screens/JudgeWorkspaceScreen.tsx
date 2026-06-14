import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClipboardCheck, FileText, Scale } from 'lucide-react-native';
import { eventsApi } from '../features/events/api/eventsApi';
import { judgingBoardsApi } from '../features/judging/api/judgingBoardsApi';
import { roundsApi } from '../features/rounds/api/roundsApi';
import { scoringApi } from '../features/scoring/api/scoringApi';
import { submissionsApi } from '../features/submissions/api/submissionsApi';
import type { Event, JudgingBoard, JudgingBoardTeam, Round, ScoreSheet, Submission } from '../core/api/types';
import { useAuth } from '../core/session/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { Header } from '../shared/ui/Header';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function JudgeWorkspaceScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, hasPermission } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [boards, setBoards] = useState<JudgingBoard[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scoreSheets, setScoreSheets] = useState<ScoreSheet[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null,
    [rounds, selectedRoundId]
  );

  const myBoard = useMemo(() => {
    const assigned = boards.find((board) => board.judgeIds.includes(user?.id || ''));
    if (assigned) return assigned;
    return hasPermission('JUDGING_ASSIGN') ? boards[0] || null : null;
  }, [boards, hasPermission, user?.id]);

  const submissionByTeam = useMemo(() => {
    return submissions.reduce<Record<string, Submission>>((acc, submission) => {
      acc[submission.teamId] = submission;
      return acc;
    }, {});
  }, [submissions]);

  const scoreSheetByTeam = useMemo(() => {
    return scoreSheets.reduce<Record<string, ScoreSheet>>((acc, sheet) => {
      acc[sheet.teamId] = sheet;
      return acc;
    }, {});
  }, [scoreSheets]);

  const loadEvents = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await eventsApi.list({ page: 1, limit: 50 });
      setEvents(response.data);
      setSelectedEventId((current) => {
        if (current && response.data.some((event) => event.id === current)) return current;
        return response.data[0]?.id || '';
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadRoundContext = useCallback(async (eventId: string) => {
    if (!eventId) {
      setRounds([]);
      setBoards([]);
      setSubmissions([]);
      setScoreSheets([]);
      return;
    }

    setError('');
    try {
      const roundResponse = await roundsApi.list({ eventId, limit: 50 });
      setRounds(roundResponse.data);
      setSelectedRoundId((current) => {
        if (current && roundResponse.data.some((round) => round.id === current)) return current;
        return roundResponse.data[0]?.id || '';
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, []);

  const loadScoringContext = useCallback(async (round: Round | null) => {
    if (!round) {
      setBoards([]);
      setSubmissions([]);
      setScoreSheets([]);
      return;
    }

    setError('');
    try {
      const [boardResponse, submissionResponse, sheetResponse] = await Promise.all([
        judgingBoardsApi.list({ roundId: round.id, limit: 50 }),
        submissionsApi.list({ roundId: round.id, status: 'SUBMITTED', limit: 100 }),
        user?.id
          ? scoringApi.listSheets({ roundId: round.id, judgeId: user.id, limit: 100 })
          : Promise.resolve({ data: [], pagination: null }),
      ]);
      setBoards(boardResponse.data);
      setSubmissions(submissionResponse.data);
      setScoreSheets(sheetResponse.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [user?.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadRoundContext(selectedEvent?.id || '');
  }, [loadRoundContext, selectedEvent?.id]);

  useEffect(() => {
    loadScoringContext(selectedRound);
  }, [loadScoringContext, selectedRound]);

  function refreshAll() {
    loadEvents('refresh');
    if (selectedEvent?.id) loadRoundContext(selectedEvent.id);
    if (selectedRound) loadScoringContext(selectedRound);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Judging" subtitle="Assigned teams and score sheets" user={user} />
        <LoadingState label="Loading judging workspace..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Judging" subtitle="Assigned teams and score sheets" user={user} />
        <ErrorState message={error} onRetry={() => loadEvents()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Judging" subtitle="Assigned teams and score sheets" user={user} />
      <FlatList
        contentContainerStyle={styles.content}
        data={myBoard?.teams || []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        ListHeaderComponent={(
          <>
            <Selector label="Event" items={events} selectedId={selectedEvent?.id || ''} onSelect={setSelectedEventId} />
            <Selector label="Round" items={rounds} selectedId={selectedRound?.id || ''} onSelect={setSelectedRoundId} />

            {selectedRound ? (
              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <Scale color={Colors.primary} size={24} />
                </View>
                <Text style={styles.heroTitle}>{selectedRound.name}</Text>
                <Text style={styles.heroSub}>Deadline: {formatDateTime(selectedRound.submissionDeadline || selectedRound.endTime)}</Text>
                {myBoard ? (
                  <View style={styles.boardRow}>
                    <View style={styles.flex}>
                      <Text style={styles.boardName}>{myBoard.name}</Text>
                      <Text style={styles.boardSub}>Board {myBoard.boardNumber} - {myBoard.teams.length} assigned teams</Text>
                    </View>
                    <StatusBadge value={myBoard.status} />
                  </View>
                ) : (
                  <Text style={styles.emptyInline}>No judging board is assigned to your account for this round.</Text>
                )}
              </View>
            ) : (
              <EmptyState title="No rounds available" message="Judging opens after rounds are configured." />
            )}

            {myBoard && <Text style={styles.sectionLabel}>Assigned teams</Text>}
            {refreshing && <ActivityIndicator color={Colors.primary} />}
          </>
        )}
        ListEmptyComponent={myBoard ? (
          <EmptyState title="No teams assigned" message="Teams assigned to your judging board will appear here." />
        ) : null}
        renderItem={({ item }) => (
          <AssignedTeamCard
            scoreSheet={scoreSheetByTeam[item.id]}
            submission={submissionByTeam[item.id]}
            team={item}
            onPress={() => navigation.navigate('ScoreSheet', {
              eventId: selectedEvent!.id,
              roundId: selectedRound!.id,
              boardId: myBoard!.id,
              teamId: item.id,
              teamName: item.name,
              submissionId: submissionByTeam[item.id]?.id,
              rubricId: selectedRound?.rubricId || undefined,
              scoreSheetId: scoreSheetByTeam[item.id]?.id,
              repositoryId: submissionByTeam[item.id]?.repositoryId || undefined,
            })}
          />
        )}
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
      <Text style={styles.sectionLabel}>{label}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            style={[styles.chip, selectedId === item.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, selectedId === item.id && styles.chipTextOn]} numberOfLines={1}>
              {item.title || item.name || item.id}
            </Text>
          </TouchableOpacity>
        )}
      />
    </>
  );
}

function AssignedTeamCard({
  onPress,
  scoreSheet,
  submission,
  team,
}: {
  onPress: () => void;
  scoreSheet?: ScoreSheet;
  submission?: Submission;
  team: JudgingBoardTeam;
}) {
  return (
    <TouchableOpacity style={styles.teamCard} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamSub}>{team.projectName || 'Project name not set'}</Text>
        </View>
        <StatusBadge value={scoreSheet?.status || (submission ? 'READY' : 'NO_SUBMISSION')} />
      </View>

      <View style={styles.statRow}>
        <Stat label="Submission" value={submission?.status || 'Missing'} />
        <Stat label="Score" value={scoreSheet ? String(scoreSheet.finalScore || scoreSheet.totalScore || 0) : 'Draft'} />
      </View>

      <View style={styles.cardAction}>
        <FileText color={Colors.primary} size={17} />
        <Text style={styles.actionLabel}>{submission ? 'Open score sheet' : 'Review team'}</Text>
        <ClipboardCheck color={Colors.textMuted} size={17} />
      </View>
    </TouchableOpacity>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.replaceAll('_', ' ')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  sectionLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 10 },
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
    marginBottom: 16,
    padding: 16,
    ...Shadow.sm,
  },
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
  boardRow: {
    alignItems: 'flex-start',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 13,
  },
  boardName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  boardSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  emptyInline: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 12 },
  flex: { flex: 1 },
  teamCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  teamName: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  teamSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 13 },
  stat: { backgroundColor: Colors.gray50, borderRadius: Radius.md, flex: 1, padding: 10 },
  statValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 3 },
  cardAction: {
    alignItems: 'center',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 13,
  },
  actionLabel: { color: Colors.primary, flex: 1, fontSize: 13, fontWeight: '800' },
});
