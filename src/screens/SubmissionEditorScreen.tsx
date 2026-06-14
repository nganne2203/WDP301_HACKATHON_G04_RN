import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Save, Send, Upload } from 'lucide-react-native';
import { repositoriesApi } from '../features/repositories/api/repositoriesApi';
import { roundsApi } from '../features/rounds/api/roundsApi';
import { submissionsApi } from '../features/submissions/api/submissionsApi';
import type { Repository, Round, Submission, UpdateSubmissionRequest } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmissionEditor'>;

type ActionMode = 'idle' | 'save' | 'submit';

export function SubmissionEditorScreen({ navigation, route }: Props) {
  const { eventId, teamId, roundId, submissionId } = route.params;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState(roundId || '');
  const [repositoryId, setRepositoryId] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<ActionMode>('idle');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const selectedRound = useMemo(
    () => rounds.find((item) => item.id === selectedRoundId) || null,
    [rounds, selectedRoundId]
  );

  const canEdit = !submission || submission.status === 'DRAFT';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [roundResponse, repositoryResponse] = await Promise.all([
        roundsApi.list({ eventId, limit: 50 }),
        repositoriesApi.list({ eventId, teamId, limit: 50 }),
      ]);
      const loadedRounds = roundResponse.data;
      setRounds(loadedRounds);
      setRepositories(repositoryResponse.data);

      if (submissionId) {
        const submissionResponse = await submissionsApi.getById(submissionId);
        const loaded = submissionResponse.data;
        setSubmission(loaded);
        setSelectedRoundId(loaded.roundId);
        setRepositoryId(loaded.repositoryId || null);
        setDemoUrl(loaded.demoUrl || '');
        setReportUrl(loaded.reportUrl || '');
        setPresentationUrl(loaded.presentationUrl || '');
      } else if (!roundId && loadedRounds[0]) {
        setSelectedRoundId(loadedRounds[0].id);
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [eventId, roundId, submissionId, teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveDraft() {
    if (!selectedRoundId) {
      setActionError('Choose a round before saving.');
      return null;
    }

    const payload: UpdateSubmissionRequest = {
      repositoryId,
      demoUrl: nullableUrl(demoUrl),
      reportUrl: nullableUrl(reportUrl),
      presentationUrl: nullableUrl(presentationUrl),
    };

    setSaving('save');
    setActionError('');
    try {
      const response = submission
        ? await submissionsApi.update(submission.id, payload)
        : await submissionsApi.create({
          eventId,
          teamId,
          roundId: selectedRoundId,
          ...payload,
          status: 'DRAFT',
        });
      setSubmission(response.data);
      Alert.alert('Draft saved', 'Your submission draft has been saved.');
      return response.data;
    } catch (saveError) {
      setActionError(errorMessage(saveError));
      return null;
    } finally {
      setSaving('idle');
    }
  }

  async function submit() {
    const hasArtifact = Boolean(repositoryId || nullableUrl(demoUrl) || nullableUrl(reportUrl) || nullableUrl(presentationUrl));
    if (!hasArtifact) {
      setActionError('Add at least one repository or artifact URL before submitting.');
      return;
    }

    setSaving('submit');
    setActionError('');
    try {
      const draft = await saveWithoutAlert();
      if (!draft) return;
      const response = await submissionsApi.submit(draft.id);
      setSubmission(response.data);
      Alert.alert('Submitted', 'Your round submission has been submitted.');
      navigation.goBack();
    } catch (submitError) {
      setActionError(errorMessage(submitError));
    } finally {
      setSaving('idle');
    }
  }

  async function saveWithoutAlert() {
    if (!selectedRoundId) {
      setActionError('Choose a round before submitting.');
      return null;
    }

    const payload: UpdateSubmissionRequest = {
      repositoryId,
      demoUrl: nullableUrl(demoUrl),
      reportUrl: nullableUrl(reportUrl),
      presentationUrl: nullableUrl(presentationUrl),
    };

    const response = submission
      ? await submissionsApi.update(submission.id, payload)
      : await submissionsApi.create({
        eventId,
        teamId,
        roundId: selectedRoundId,
        ...payload,
        status: 'DRAFT',
      });
    setSubmission(response.data);
    return response.data;
  }

  if (loading) return <LoadingState label="Loading submission..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!rounds.length) return <EmptyState title="No rounds available" message="Submissions open after rounds are configured." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.cardTop}>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.title}>{submission ? 'Submission draft' : 'New submission'}</Text>
            <Text style={styles.subtitle}>{selectedRound?.name || 'Choose a round'}</Text>
          </View>
          {submission ? <StatusBadge value={submission.status} /> : <StatusBadge value="DRAFT" />}
        </View>
        {!!selectedRound && (
          <Text style={styles.deadline}>Deadline: {formatDateTime(selectedRound.submissionDeadline || selectedRound.endTime)}</Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>Round</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {rounds.map((item) => (
          <TouchableOpacity
            disabled={!canEdit}
            key={item.id}
            onPress={() => setSelectedRoundId(item.id)}
            style={[styles.chip, selectedRoundId === item.id && styles.chipOn, !canEdit && styles.disabled]}
          >
            <Text style={[styles.chipText, selectedRoundId === item.id && styles.chipTextOn]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Repository</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <TouchableOpacity
          disabled={!canEdit}
          onPress={() => setRepositoryId(null)}
          style={[styles.chip, !repositoryId && styles.chipOn, !canEdit && styles.disabled]}
        >
          <Text style={[styles.chipText, !repositoryId && styles.chipTextOn]}>No repository</Text>
        </TouchableOpacity>
        {repositories.map((item) => (
          <TouchableOpacity
            disabled={!canEdit}
            key={item.id}
            onPress={() => setRepositoryId(item.id)}
            style={[styles.chip, repositoryId === item.id && styles.chipOn, !canEdit && styles.disabled]}
          >
            <Text style={[styles.chipText, repositoryId === item.id && styles.chipTextOn]}>{item.repositoryFullName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Artifacts</Text>
      <Input
        editable={canEdit}
        label="Demo URL"
        value={demoUrl}
        onChangeText={setDemoUrl}
        placeholder="https://..."
      />
      <Input
        editable={canEdit}
        label="Report URL"
        value={reportUrl}
        onChangeText={setReportUrl}
        placeholder="https://..."
      />
      <Input
        editable={canEdit}
        label="Presentation URL"
        value={presentationUrl}
        onChangeText={setPresentationUrl}
        placeholder="https://..."
      />

      {!canEdit && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Submitted submissions are locked on mobile.</Text>
        </View>
      )}

      {!!actionError && <Text style={styles.errorText}>{actionError}</Text>}

      {canEdit && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            disabled={saving !== 'idle'}
            onPress={saveDraft}
          >
            {saving === 'save' ? <ActivityIndicator color={Colors.primary} /> : <Save color={Colors.primary} size={17} />}
            <Text style={styles.secondaryActionText}>Save draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={saving !== 'idle'}
            onPress={submit}
          >
            {saving === 'submit' ? <ActivityIndicator color="#fff" /> : <Send color="#fff" size={17} />}
            <Text style={styles.actionText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Input({
  editable,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  editable: boolean;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        editable={editable}
        keyboardType="url"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
      />
    </View>
  );
}

function nullableUrl(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  hero: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  heroTitleWrap: { flex: 1 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  deadline: { color: Colors.textSecondary, fontSize: 12, marginTop: 12 },
  sectionLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 10, marginTop: 2 },
  chipRow: { gap: 8, paddingBottom: 14 },
  chip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: 260,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800' },
  chipTextOn: { color: '#fff' },
  disabled: { opacity: 0.7 },
  inputWrap: { marginBottom: 12 },
  inputLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  inputDisabled: { backgroundColor: Colors.gray100, color: Colors.textSecondary },
  notice: {
    backgroundColor: Colors.blue50,
    borderRadius: Radius.md,
    marginTop: 4,
    padding: 12,
  },
  noticeText: { color: Colors.blue700, fontSize: 13, fontWeight: '700' },
  errorText: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    padding: 11,
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
  secondaryAction: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryActionText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
});
