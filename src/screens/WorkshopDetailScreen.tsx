import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExternalLink, MessageCircle, Send, ThumbsUp, Trophy, UserRound } from 'lucide-react-native';
import { workshopsApi } from '../features/workshops/api/workshopsApi';
import type { Workshop, WorkshopQuestion } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkshopDetail'>;

export function WorkshopDetailScreen({ route }: Props) {
  const { workshopId } = route.params;
  const { hasPermission } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkshop = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workshopsApi.getById(workshopId);
      setWorkshop(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    loadWorkshop();
  }, [loadWorkshop]);

  if (loading) return <LoadingState label="Loading workshop..." />;
  if (error) return <ErrorState message={error} onRetry={loadWorkshop} />;
  if (!workshop) return <EmptyState title="Workshop not found" />;

  const meetLink = workshop.googleMeet?.meetLink || workshop.meetLink;
  const presenter = workshop.presenter?.fullName || workshop.speakerInfo?.name || 'Presenter TBA';

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.hero}>
        <StatusBadge value={workshop.status} />
        <View style={styles.competitionRow}>
          <Trophy color={Colors.primary} size={15} />
          <Text style={styles.competition} numberOfLines={2}>
            {workshop.competition?.title || 'Competition unavailable'}
          </Text>
        </View>
        <Text style={styles.title}>{workshop.title}</Text>
        {!!workshop.description && <Text style={styles.description}>{workshop.description}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Schedule</Text>
        <Text style={styles.cardValue}>{formatDateTime(workshop.startTime)}</Text>
        <Text style={styles.cardSub}>Ends {formatDateTime(workshop.endTime)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.rowCenter}>
          <UserRound color={Colors.primary} size={18} />
          <Text style={styles.cardLabel}>Presenter</Text>
        </View>
        <Text style={styles.cardValue}>{presenter}</Text>
        {!!workshop.speakerInfo?.title && <Text style={styles.cardSub}>{workshop.speakerInfo.title}</Text>}
        {!!workshop.speakerInfo?.bio && <Text style={styles.bio}>{workshop.speakerInfo.bio}</Text>}
        {!!workshop.speakerInfo?.email && <Text style={styles.cardSub}>{workshop.speakerInfo.email}</Text>}
      </View>

      {!!meetLink && (
        <TouchableOpacity style={styles.meetButton} onPress={() => Linking.openURL(meetLink)}>
          <ExternalLink color="#fff" size={18} />
          <Text style={styles.meetText}>Open meeting link</Text>
        </TouchableOpacity>
      )}

      <WorkshopQuestionnaireSection questionnaire={workshop.questionnaire || []} />

      <WorkshopQuestionsSection
        canCreate={hasPermission('WORKSHOP_QUESTION_CREATE')}
        canVote={hasPermission('WORKSHOP_QUESTION_VOTE')}
        workshop={workshop}
      />
    </ScrollView>
  );
}

function WorkshopQuestionnaireSection({ questionnaire }: { questionnaire: string[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowCenter}>
        <MessageCircle color={Colors.primary} size={18} />
        <Text style={styles.cardLabel}>Workshop Questionnaire</Text>
      </View>
      {questionnaire.length ? (
        questionnaire.map((question, index) => (
          <Text key={`${question}-${index}`} style={styles.guidingQuestion}>{question}</Text>
        ))
      ) : (
        <Text style={styles.cardSub}>No questionnaire has been prepared for this workshop.</Text>
      )}
    </View>
  );
}

function WorkshopQuestionsSection({ workshop, canCreate, canVote }: { workshop: Workshop; canCreate: boolean; canVote: boolean }) {
  const [questions, setQuestions] = useState<WorkshopQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workshopsApi.listQuestions(workshop.id, { page: 1, limit: 50 });
      setQuestions(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [workshop.id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const canSubmitNow = canSubmitQuestionForWorkshop(workshop);
  const trimmedContent = content.trim();
  const submitDisabled = submitting || trimmedContent.length < 2 || !canCreate || !canSubmitNow;
  const helperText = getQuestionFormHelper({ canCreate, canSubmitNow });

  const handleSubmit = useCallback(async () => {
    if (submitDisabled) return;

    setSubmitting(true);
    setError('');
    try {
      await workshopsApi.createQuestion(workshop.id, { content: trimmedContent });
      setContent('');
      await loadQuestions();
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }, [loadQuestions, submitDisabled, trimmedContent, workshop.id]);

  const handleVote = useCallback(async (questionId: string) => {
    if (!canVote || votingId) return;

    setVotingId(questionId);
    setError('');
    try {
      await workshopsApi.voteQuestion(questionId);
      await loadQuestions();
    } catch (voteError) {
      setError(errorMessage(voteError));
    } finally {
      setVotingId(null);
    }
  }, [canVote, loadQuestions, votingId]);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.rowCenter}>
          <MessageCircle color={Colors.primary} size={18} />
          <Text style={styles.cardLabel}>Questions for Speaker</Text>
        </View>
        <TouchableOpacity disabled={loading} onPress={loadQuestions} style={[styles.refreshButton, loading && styles.disabledButton]}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <QuestionForm
        content={content}
        disabled={submitDisabled}
        helperText={helperText}
        onChangeContent={setContent}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadQuestions} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.cardSub}>Loading participant questions...</Text>
        </View>
      ) : questions.length ? (
        questions.map((question) => (
          <QuestionItem
            key={question.id}
            canVote={canVote}
            onVote={handleVote}
            question={question}
            voting={votingId === question.id}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>No participant questions have been submitted yet.</Text>
      )}
    </View>
  );
}

function QuestionForm({
  content,
  disabled,
  helperText,
  onChangeContent,
  onSubmit,
  submitting,
}: {
  content: string;
  disabled: boolean;
  helperText?: string;
  onChangeContent: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <View style={styles.questionForm}>
      <TextInput
        editable={!submitting && !helperText}
        maxLength={1000}
        multiline
        onChangeText={onChangeContent}
        placeholder="Ask the speaker a question"
        placeholderTextColor={Colors.textMuted}
        style={[styles.questionInput, (!!helperText || submitting) && styles.disabledInput]}
        value={content}
      />
      {!!helperText && <Text style={styles.formHelper}>{helperText}</Text>}
      <TouchableOpacity disabled={disabled} onPress={onSubmit} style={[styles.submitButton, disabled && styles.disabledButton]}>
        <Send color="#fff" size={16} />
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit question'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuestionItem({
  question,
  canVote,
  voting,
  onVote,
}: {
  question: WorkshopQuestion;
  canVote: boolean;
  voting: boolean;
  onVote: (questionId: string) => void;
}) {
  const authorName = question.author?.fullName || question.author?.email || 'Anonymous participant';

  return (
    <View style={styles.participantQuestion}>
      <Text style={styles.questionContent}>{question.content}</Text>
      <View style={styles.questionMetaRow}>
        <Text style={styles.questionMeta}>{authorName}</Text>
        <Text style={styles.questionMeta}>{formatDateTime(question.createdAt)}</Text>
      </View>
      <TouchableOpacity
        disabled={!canVote || voting}
        onPress={() => onVote(question.id)}
        style={[styles.voteButton, (!canVote || voting) && styles.disabledVoteButton]}
      >
        <ThumbsUp color={canVote ? Colors.primary : Colors.textMuted} size={15} />
        <Text style={[styles.voteText, !canVote && styles.mutedVoteText]}>
          {voting ? 'Voting...' : `${question.voteCount} votes`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function canSubmitQuestionForWorkshop(workshop: Workshop) {
  const now = new Date();
  const endTime = new Date(workshop.endTime);
  return ['SCHEDULED', 'LIVE'].includes(workshop.status) && !Number.isNaN(endTime.getTime()) && now <= endTime;
}

function getQuestionFormHelper({ canCreate, canSubmitNow }: { canCreate: boolean; canSubmitNow: boolean }) {
  if (!canCreate) return 'You do not have permission to submit workshop questions.';
  if (!canSubmitNow) return 'Questions can be submitted before or during the workshop.';
  return undefined;
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  hero: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 18,
    ...Shadow.sm,
  },
  competitionRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 14 },
  competition: { color: Colors.primary, flex: 1, fontSize: 13, fontWeight: '800' },
  title: { color: Colors.textPrimary, fontSize: 23, fontWeight: '800', marginTop: 8 },
  description: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  rowCenter: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  cardValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 6 },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  bio: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  meetButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    padding: 14,
  },
  meetText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  guidingQuestion: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    padding: 10,
  },
  refreshButton: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  refreshText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  questionForm: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    marginTop: 12,
    paddingBottom: 12,
  },
  questionInput: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 86,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  disabledInput: { backgroundColor: Colors.gray100, color: Colors.textSecondary },
  formHelper: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  submitButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  inlineLoading: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  inlineError: {
    backgroundColor: Colors.redLight,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  errorText: { color: Colors.red, fontSize: 13, lineHeight: 19 },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderColor: '#FECACA',
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  retryText: { color: Colors.red, fontSize: 12, fontWeight: '800' },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  participantQuestion: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  questionContent: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  questionMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  questionMeta: { color: Colors.textSecondary, fontSize: 12 },
  voteButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  disabledVoteButton: { backgroundColor: Colors.gray100 },
  voteText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  mutedVoteText: { color: Colors.textMuted },
});
