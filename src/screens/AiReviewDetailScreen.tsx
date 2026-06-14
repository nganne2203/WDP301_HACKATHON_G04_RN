import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AlertTriangle, BrainCircuit, ClipboardList, HelpCircle, TestTube2 } from 'lucide-react-native';
import { aiReviewsApi } from '../features/aiReviews/api/aiReviewsApi';
import type { AiReviewCriterion, AiReviewDetail, TechnicalFinding, TechnicalFindingSeverity } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AiReviewDetail'>;

export function AiReviewDetailScreen({ route }: Props) {
  const { reviewId } = route.params;
  const [review, setReview] = useState<AiReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stackSummary = useMemo(() => {
    const stack = review?.normalizedOutput?.techStackDetected;
    if (!stack || typeof stack !== 'object') return [];
    return Object.entries(stack as Record<string, unknown>)
      .map(([key, value]) => ({ key, value: Array.isArray(value) ? value.join(', ') : String(value || '') }))
      .filter((item) => item.value);
  }, [review]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await aiReviewsApi.getById(reviewId);
      setReview(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState label="Loading AI review..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!review) return <EmptyState title="AI review not found" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.cardTop}>
          <View style={styles.heroIcon}>
            <BrainCircuit color={Colors.primary} size={24} />
          </View>
          <StatusBadge value={review.status} />
        </View>
        <Text style={styles.title}>{review.reviewKind.replaceAll('_', ' ')}</Text>
        <Text style={styles.subtitle}>{review.modelName || 'AI review'} - {formatDateTime(review.completedAt || review.requestedAt)}</Text>
        <Text style={styles.summary}>{review.summary || review.overallSummary || 'No summary available.'}</Text>
        {review.needsHumanReview && (
          <View style={styles.reviewFlag}>
            <AlertTriangle color={Colors.red} size={16} />
            <Text style={styles.reviewFlagText}>Needs human review</Text>
          </View>
        )}
      </View>

      {!!stackSummary.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected stack</Text>
          {stackSummary.map((item) => (
            <Text key={item.key} style={styles.stackLine}>{labelize(item.key)}: {item.value}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical findings</Text>
        {review.technicalFindings.length ? review.technicalFindings.map((item) => (
          <FindingCard finding={item} key={item.id || item.title} />
        )) : <Text style={styles.emptyLine}>No technical findings were returned.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review criteria</Text>
        {review.reviewCriteria.length ? review.reviewCriteria.map((item) => (
          <CriterionCard criterion={item} key={item.id || item.name || item.criterionName} />
        )) : <Text style={styles.emptyLine}>No rubric-aware comments were returned.</Text>}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <TestTube2 color={Colors.primary} size={17} />
          <Text style={styles.sectionTitleInline}>Suggested tests</Text>
        </View>
        {review.suggestedTestCases.length ? review.suggestedTestCases.map((item) => (
          <View key={item.id || item.title} style={styles.simpleCard}>
            <Text style={styles.simpleTitle}>{item.title}</Text>
            {!!item.purpose && <Text style={styles.simpleBody}>{item.purpose}</Text>}
            {!!item.expectedObservation && <Text style={styles.simpleSub}>Expected: {item.expectedObservation}</Text>}
          </View>
        )) : <Text style={styles.emptyLine}>No suggested tests were returned.</Text>}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <HelpCircle color={Colors.primary} size={17} />
          <Text style={styles.sectionTitleInline}>Judge questions</Text>
        </View>
        {review.suggestedJudgeQuestions.length ? review.suggestedJudgeQuestions.map((item) => (
          <View key={item.id || item.question} style={styles.simpleCard}>
            <Text style={styles.simpleTitle}>{item.question}</Text>
            {!!item.priority && <Text style={styles.simpleSub}>Priority: {item.priority}</Text>}
          </View>
        )) : <Text style={styles.emptyLine}>No judge questions were returned.</Text>}
      </View>
    </ScrollView>
  );
}

function FindingCard({ finding }: { finding: TechnicalFinding }) {
  const tone = severityTone(finding.severity);

  return (
    <View style={styles.findingCard}>
      <View style={styles.cardTop}>
        <View style={styles.findingTitleWrap}>
          <Text style={styles.findingTitle}>{finding.title}</Text>
          {!!finding.type && <Text style={styles.findingType}>{finding.type.replaceAll('_', ' ')}</Text>}
        </View>
        <View style={[styles.severityBadge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.severityText, { color: tone.fg }]}>{finding.severity}</Text>
        </View>
      </View>
      {!!finding.comment && <Text style={styles.simpleBody}>{finding.comment}</Text>}
      {!!finding.recommendedAction && <Text style={styles.simpleSub}>Action: {finding.recommendedAction}</Text>}
      {finding.evidence?.map((item) => (
        <Text key={`${finding.title}-${item}`} style={styles.evidenceLine}>{item}</Text>
      ))}
    </View>
  );
}

function CriterionCard({ criterion }: { criterion: AiReviewCriterion }) {
  const title = criterion.criterionName || criterion.name || 'Criterion';
  const body = criterion.comment || criterion.feedback || '';

  return (
    <View style={styles.simpleCard}>
      <View style={styles.sectionHeadingRow}>
        <ClipboardList color={Colors.primary} size={17} />
        <Text style={styles.simpleTitle}>{title}</Text>
      </View>
      {!!criterion.qualitativeLevel && <Text style={styles.simpleSub}>Level: {criterion.qualitativeLevel.replaceAll('_', ' ')}</Text>}
      {!!body && <Text style={styles.simpleBody}>{body}</Text>}
      {criterion.risks?.map((risk) => (
        <Text key={`${title}-${risk}`} style={styles.evidenceLine}>{risk}</Text>
      ))}
    </View>
  );
}

function severityTone(severity: TechnicalFindingSeverity) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return { bg: Colors.redLight, fg: Colors.red };
  if (severity === 'MEDIUM') return { bg: '#FEF3C7', fg: '#92400E' };
  return { bg: Colors.greenLight, fg: Colors.greenDark };
}

function labelize(value: string) {
  return value.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase());
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
  heroIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800', marginTop: 14 },
  subtitle: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  summary: { color: Colors.textPrimary, fontSize: 14, lineHeight: 21, marginTop: 12 },
  reviewFlag: {
    alignItems: 'center',
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  reviewFlagText: { color: Colors.red, fontSize: 13, fontWeight: '800' },
  section: { marginTop: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  sectionHeadingRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  sectionTitleInline: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  stackLine: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
    padding: 12,
  },
  findingCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  findingTitleWrap: { flex: 1 },
  findingTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  findingType: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  severityBadge: { borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 4 },
  severityText: { fontSize: 10, fontWeight: '800' },
  simpleCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 10,
    padding: 14,
  },
  simpleTitle: { color: Colors.textPrimary, flex: 1, fontSize: 14, fontWeight: '800' },
  simpleBody: { color: Colors.textPrimary, fontSize: 13, lineHeight: 19, marginTop: 10 },
  simpleSub: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  evidenceLine: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.md,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    padding: 9,
  },
  emptyLine: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    padding: 13,
  },
});
