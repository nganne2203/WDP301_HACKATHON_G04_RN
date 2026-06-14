import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, FileText, GitBranch, Upload } from 'lucide-react-native';
import { roundsApi } from '../features/rounds/api/roundsApi';
import { submissionsApi } from '../features/submissions/api/submissionsApi';
import type { Round, Submission } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Submissions'>;

export function SubmissionsScreen({ navigation, route }: Props) {
  const { eventId, teamId, eventTitle, teamName } = route.params;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const submissionsByRound = useMemo(() => {
    return submissions.reduce<Record<string, Submission>>((acc, item) => {
      acc[item.roundId] = item;
      return acc;
    }, {});
  }, [submissions]);

  const loadData = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [roundResponse, submissionResponse] = await Promise.all([
        roundsApi.list({ eventId, limit: 50 }),
        submissionsApi.list({ eventId, teamId, limit: 50 }),
      ]);
      setRounds(roundResponse.data);
      setSubmissions(submissionResponse.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId, teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState label="Loading submissions..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadData()} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={rounds}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData('refresh')} />}
      ListHeaderComponent={(
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Upload color={Colors.primary} size={24} />
          </View>
          <Text style={styles.title}>Submissions</Text>
          <Text style={styles.subtitle}>{teamName || 'Your team'} - {eventTitle || 'Selected event'}</Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => navigation.navigate('RepositoryViewer', { eventId, teamId, eventTitle, teamName })}
            >
              <GitBranch color={Colors.primary} size={17} />
              <Text style={styles.outlineText}>Repositories</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={(
        <EmptyState
          title="No rounds yet"
          message="Submissions open after event rounds are configured."
        />
      )}
      renderItem={({ item }) => (
        <RoundSubmissionCard
          round={item}
          submission={submissionsByRound[item.id]}
          onPress={() => navigation.navigate('SubmissionEditor', {
            eventId,
            teamId,
            roundId: item.id,
            submissionId: submissionsByRound[item.id]?.id,
          })}
        />
      )}
    />
  );
}

function RoundSubmissionCard({
  onPress,
  round,
  submission,
}: {
  onPress: () => void;
  round: Round;
  submission?: Submission;
}) {
  const deadline = round.submissionDeadline || round.endTime;
  const action = submission?.status === 'DRAFT' ? 'Edit draft' : submission ? 'View submission' : 'Start draft';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{round.name}</Text>
          <Text style={styles.cardSub}>{round.roundType.replaceAll('_', ' ')}</Text>
        </View>
        <StatusBadge value={submission?.status || round.status} />
      </View>

      <View style={styles.detailGrid}>
        <Info label="Deadline" value={formatDateTime(deadline)} />
        <Info label="Submitted" value={submission?.submittedAt ? formatDateTime(submission.submittedAt) : 'Not submitted'} />
      </View>

      {submission ? (
        <View style={styles.artifacts}>
          <Artifact present={Boolean(submission.repositoryId)} label="Repository" />
          <Artifact present={Boolean(submission.demoUrl)} label="Demo" />
          <Artifact present={Boolean(submission.reportUrl)} label="Report" />
          <Artifact present={Boolean(submission.presentationUrl)} label="Slides" />
        </View>
      ) : (
        <Text style={styles.emptyLine}>No draft has been created for this round.</Text>
      )}

      <View style={styles.cardAction}>
        <FileText color={Colors.primary} size={17} />
        <Text style={styles.cardActionText}>{action}</Text>
        <ChevronRight color={Colors.textMuted} size={18} />
      </View>
    </TouchableOpacity>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Artifact({ label, present }: { label: string; present: boolean }) {
  return (
    <View style={[styles.artifact, present && styles.artifactOn]}>
      <Text style={[styles.artifactText, present && styles.artifactTextOn]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  hero: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
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
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 12 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  heroActions: { flexDirection: 'row', marginTop: 14 },
  outlineButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outlineText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  cardSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  detailGrid: { flexDirection: 'row', gap: 10, marginTop: 13 },
  info: { backgroundColor: Colors.gray50, borderRadius: Radius.md, flex: 1, padding: 10 },
  infoLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  infoValue: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 4 },
  artifacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  artifact: { backgroundColor: Colors.gray100, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  artifactOn: { backgroundColor: Colors.greenLight },
  artifactText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800' },
  artifactTextOn: { color: Colors.greenDark },
  emptyLine: { color: Colors.textSecondary, fontSize: 13, marginTop: 12 },
  cardAction: {
    alignItems: 'center',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 13,
  },
  cardActionText: { color: Colors.primary, flex: 1, fontSize: 13, fontWeight: '800' },
});
