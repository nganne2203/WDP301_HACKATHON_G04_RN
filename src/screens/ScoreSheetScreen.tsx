import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExternalLink, GitBranch, Save, Send } from 'lucide-react-native';
import { rubricsApi } from '../features/rubrics/api/rubricsApi';
import { scoringApi } from '../features/scoring/api/scoringApi';
import { submissionsApi } from '../features/submissions/api/submissionsApi';
import type { Criterion, Rubric, ScoreSheet, Submission } from '../core/api/types';
import { useAuth } from '../core/session/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ScoreSheet'>;
type SaveMode = 'idle' | 'draft' | 'submit';

export function ScoreSheetScreen({ navigation, route }: Props) {
  const {
    boardId,
    competitionId,
    repositoryId,
    roundId,
    rubricId,
    scoreSheetId,
    submissionId,
    teamId,
    teamName,
  } = route.params;
  const { user } = useAuth();
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [scoreSheet, setScoreSheet] = useState<ScoreSheet | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [generalComment, setGeneralComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SaveMode>('idle');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const criteria = useMemo(() => {
    return [...(rubric?.criteria || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [rubric?.criteria]);

  const total = useMemo(() => {
    return criteria.reduce((sum, criterion) => sum + Number(scores[criterion.id] || 0), 0);
  }, [criteria, scores]);

  const maxTotal = useMemo(() => {
    return criteria.reduce((sum, criterion) => sum + Number(criterion.maxScore || 0), 0);
  }, [criteria]);

  const locked = scoreSheet?.status === 'LOCKED' || scoreSheet?.status === 'SUBMITTED';
  const resolvedRepositoryId = repositoryId || submission?.repositoryId || undefined;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rubricResponse, submissionResponse, sheetResponse] = await Promise.all([
        rubricId ? rubricsApi.getById(rubricId) : Promise.resolve(null),
        submissionId ? submissionsApi.getById(submissionId) : Promise.resolve(null),
        scoreSheetId
          ? scoringApi.getSheetById(scoreSheetId)
          : user?.id
            ? scoringApi.listSheets({ roundId, teamId, judgeId: user.id, limit: 1 })
            : Promise.resolve(null),
      ]);

      const loadedRubric = rubricResponse?.data || null;
      const loadedSubmission = submissionResponse?.data || null;
      const loadedSheet = Array.isArray(sheetResponse?.data)
        ? sheetResponse.data[0] || null
        : sheetResponse?.data || null;

      setRubric(loadedRubric);
      setSubmission(loadedSubmission);
      setScoreSheet(loadedSheet);

      if (loadedSheet) {
        const nextScores: Record<string, string> = {};
        const nextComments: Record<string, string> = {};
        for (const entry of loadedSheet.scores) {
          nextScores[entry.criterionId] = String(entry.scoreValue);
          if (entry.comment) nextComments[entry.criterionId] = entry.comment;
        }
        setScores(nextScores);
        setComments(nextComments);
        setGeneralComment(loadedSheet.generalComment || '');
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [roundId, rubricId, scoreSheetId, submissionId, teamId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function setCriterionScore(criterion: Criterion, value: string) {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setScores((current) => ({ ...current, [criterion.id]: cleaned }));
  }

  function validateScores(requireComplete: boolean) {
    if (!rubric) return 'Rubric is required before scoring.';
    if (!submissionId) return 'This team does not have a submitted artifact for this round.';

    for (const criterion of criteria) {
      const raw = scores[criterion.id];
      if (requireComplete && (raw === undefined || raw === '')) {
        return `Score "${criterion.name}" before submitting.`;
      }
      if (raw !== undefined && raw !== '') {
        const value = Number(raw);
        if (Number.isNaN(value)) return `Score "${criterion.name}" must be a number.`;
        if (value < 0) return `Score "${criterion.name}" cannot be negative.`;
        if (value > criterion.maxScore) return `Score "${criterion.name}" cannot exceed ${criterion.maxScore}.`;
      }
    }

    return '';
  }

  async function save(submit: boolean) {
    const validationError = validateScores(submit);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setSaving(submit ? 'submit' : 'draft');
    setActionError('');
    try {
      const response = await scoringApi.submitSheet({
        scoreSheetId: scoreSheet?.id,
        competitionId,
        roundId,
        boardId,
        teamId,
        submissionId: submissionId!,
        rubricId: rubric?.id || rubricId || null,
        generalComment: generalComment.trim() || null,
        submit,
        scores: criteria
          .filter((criterion) => scores[criterion.id] !== undefined && scores[criterion.id] !== '')
          .map((criterion) => ({
            criterionId: criterion.id,
            scoreValue: Number(scores[criterion.id]),
            comment: comments[criterion.id]?.trim() || null,
          })),
      });
      setScoreSheet(response.data);
      Alert.alert(submit ? 'Score submitted' : 'Draft saved', submit ? 'The score sheet is now locked.' : 'Your draft was saved.');
      if (submit) navigation.goBack();
    } catch (saveError) {
      setActionError(errorMessage(saveError));
    } finally {
      setSaving('idle');
    }
  }

  function confirmSubmit() {
    Alert.alert(
      'Submit and lock score sheet?',
      'After submission, the backend locks this score sheet and it cannot be edited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', style: 'destructive', onPress: () => save(true) },
      ]
    );
  }

  if (loading) return <LoadingState label="Loading score sheet..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!rubric) return <EmptyState title="No rubric available" message="This round needs a rubric before official scoring." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.cardTop}>
          <View style={styles.flex}>
            <Text style={styles.title}>{teamName}</Text>
            <Text style={styles.subtitle}>{rubric.title}</Text>
          </View>
          <StatusBadge value={scoreSheet?.status || 'DRAFT'} />
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{total}/{rubric.totalScore || maxTotal}</Text>
          <Text style={styles.scoreLabel}>Current score</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Submission review</Text>
        {submission ? (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>Submitted {formatDateTime(submission.submittedAt)}</Text>
            <ArtifactLink label="Demo" url={submission.demoUrl} />
            <ArtifactLink label="Report" url={submission.reportUrl} />
            <ArtifactLink label="Presentation" url={submission.presentationUrl} />
            {!!resolvedRepositoryId && (
              <TouchableOpacity
                style={styles.repositoryButton}
                onPress={() => navigation.navigate('RepositoryDetail', { repositoryId: resolvedRepositoryId })}
              >
                <GitBranch color={Colors.primary} size={17} />
                <Text style={styles.repositoryText}>Open repository evidence</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>No submitted artifact exists for this team and round.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rubric scoring</Text>
        {criteria.map((criterion) => (
          <View key={criterion.id} style={styles.criterionCard}>
            <View style={styles.cardTop}>
              <View style={styles.flex}>
                <Text style={styles.criterionName}>{criterion.name}</Text>
                {!!criterion.description && <Text style={styles.criterionDescription}>{criterion.description}</Text>}
              </View>
              <Text style={styles.maxScore}>/{criterion.maxScore}</Text>
            </View>
            <TextInput
              editable={!locked}
              keyboardType="decimal-pad"
              onChangeText={(value) => setCriterionScore(criterion, value)}
              placeholder="Score"
              placeholderTextColor={Colors.textMuted}
              style={[styles.scoreInput, locked && styles.disabledInput]}
              value={scores[criterion.id] || ''}
            />
            <TextInput
              editable={!locked}
              multiline
              onChangeText={(value) => setComments((current) => ({ ...current, [criterion.id]: value }))}
              placeholder="Criterion comment"
              placeholderTextColor={Colors.textMuted}
              style={[styles.commentInput, locked && styles.disabledInput]}
              value={comments[criterion.id] || ''}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General comment</Text>
        <TextInput
          editable={!locked}
          multiline
          onChangeText={setGeneralComment}
          placeholder="Overall feedback for this team"
          placeholderTextColor={Colors.textMuted}
          style={[styles.generalInput, locked && styles.disabledInput]}
          value={generalComment}
        />
      </View>

      {!!actionError && <Text style={styles.errorText}>{actionError}</Text>}

      {locked ? (
        <Text style={styles.lockedText}>This score sheet is locked and cannot be edited.</Text>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={saving !== 'idle'}
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => save(false)}
          >
            {saving === 'draft' ? <ActivityIndicator color={Colors.primary} /> : <Save color={Colors.primary} size={17} />}
            <Text style={styles.secondaryButtonText}>Save draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving !== 'idle'}
            style={styles.actionButton}
            onPress={confirmSubmit}
          >
            {saving === 'submit' ? <ActivityIndicator color="#fff" /> : <Send color="#fff" size={17} />}
            <Text style={styles.actionButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function ArtifactLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null;
  return (
    <TouchableOpacity style={styles.artifactLink} onPress={() => Linking.openURL(url)}>
      <ExternalLink color={Colors.primary} size={15} />
      <Text style={styles.artifactText}>{label}</Text>
    </TouchableOpacity>
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
    padding: 16,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  flex: { flex: 1 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  scoreBox: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, marginTop: 14, padding: 13 },
  scoreValue: { color: Colors.primary, fontSize: 23, fontWeight: '800' },
  scoreLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  itemTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  artifactLink: { alignItems: 'center', flexDirection: 'row', gap: 7, paddingVertical: 7 },
  artifactText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  repositoryButton: {
    alignItems: 'center',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
  },
  repositoryText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  emptyText: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    padding: 13,
  },
  criterionCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  criterionName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  criterionDescription: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  maxScore: { color: Colors.textSecondary, fontSize: 14, fontWeight: '800' },
  scoreInput: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentInput: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  generalInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  disabledInput: { backgroundColor: Colors.gray100, color: Colors.textSecondary },
  errorText: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    padding: 11,
  },
  lockedText: {
    backgroundColor: Colors.blue50,
    borderRadius: Radius.md,
    color: Colors.blue700,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 16,
    padding: 12,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryButtonText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
});
