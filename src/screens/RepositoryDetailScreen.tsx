import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AlertTriangle, BrainCircuit, ChevronRight, ExternalLink, FileText, GitBranch } from 'lucide-react-native';
import { repositoriesApi } from '../features/repositories/api/repositoriesApi';
import type {
  Repository,
  RepositoryAiReview,
  RepositoryCommit,
  RepositoryCommitDiff,
  RepositoryImpactDecision,
  RepositoryStaticAnalysisResult,
} from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RepositoryDetail'>;
type TabKey = 'commits' | 'diffs' | 'analysis' | 'impact' | 'ai';

export function RepositoryDetailScreen({ navigation, route }: Props) {
  const { repositoryId } = route.params;
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<RepositoryCommit[]>([]);
  const [diffs, setDiffs] = useState<RepositoryCommitDiff[]>([]);
  const [analysis, setAnalysis] = useState<RepositoryStaticAnalysisResult[]>([]);
  const [impact, setImpact] = useState<RepositoryImpactDecision[]>([]);
  const [aiReviews, setAiReviews] = useState<RepositoryAiReview[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('commits');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');

  const tabs = useMemo(() => [
    { key: 'commits' as const, label: `Commits ${commits.length}` },
    { key: 'diffs' as const, label: `Diffs ${diffs.length}` },
    { key: 'analysis' as const, label: `Analysis ${analysis.length}` },
    { key: 'impact' as const, label: `Impact ${impact.length}` },
    { key: 'ai' as const, label: `AI ${aiReviews.length}` },
  ], [aiReviews.length, analysis.length, commits.length, diffs.length, impact.length]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setAiError('');
    try {
      const repositoryResponse = await repositoriesApi.getById(repositoryId);
      setRepository(repositoryResponse.data);

      const [commitResult, diffResult, analysisResult, impactResult, reviewResult] = await Promise.allSettled([
        repositoriesApi.listCommits(repositoryId),
        repositoriesApi.listCommitDiffs(repositoryId),
        repositoriesApi.listStaticAnalysis(repositoryId),
        repositoriesApi.listImpactDecisions(repositoryId),
        repositoriesApi.listAiReviews(repositoryId),
      ]);

      if (commitResult.status === 'fulfilled') setCommits(commitResult.value.data);
      if (diffResult.status === 'fulfilled') setDiffs(diffResult.value.data);
      if (analysisResult.status === 'fulfilled') setAnalysis(analysisResult.value.data);
      if (impactResult.status === 'fulfilled') setImpact(impactResult.value.data);
      if (reviewResult.status === 'fulfilled') {
        setAiReviews(reviewResult.value.data.aiReviews);
      } else {
        setAiError(errorMessage(reviewResult.reason));
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [repositoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState label="Loading repository evidence..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!repository) return <EmptyState title="Repository not found" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.cardTop}>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.title}>{repository.repositoryFullName}</Text>
            <Text style={styles.subtitle}>{repository.team?.name || 'Team repository'}</Text>
          </View>
          <StatusBadge value={repository.status} />
        </View>
        <View style={styles.metaRow}>
          <Meta label="Access" value={repository.accessState} />
          <Meta label="Branch" value={repository.defaultBranch || 'main'} />
        </View>
        <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(repository.repositoryUrl)}>
          <ExternalLink color={Colors.primary} size={16} />
          <Text style={styles.linkText}>Open repository</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabOn]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextOn]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === 'commits' && (
        <Section empty="No commits captured yet">
          {commits.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.row}>
                <GitBranch color={Colors.primary} size={17} />
                <Text style={styles.itemTitle}>{shortSha(item.commitSha)}</Text>
                <Text style={styles.itemStat}>+{item.linesAdded} -{item.linesRemoved}</Text>
              </View>
              <Text style={styles.itemBody}>{item.message || 'No commit message'}</Text>
              <Text style={styles.itemSub}>{item.authorName || item.authorUsername || 'Unknown author'} - {formatDateTime(item.timestamp)}</Text>
              {!!item.commitUrl && (
                <TouchableOpacity style={styles.inlineLink} onPress={() => Linking.openURL(item.commitUrl || '')}>
                  <ExternalLink color={Colors.primary} size={14} />
                  <Text style={styles.inlineLinkText}>Open commit</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Section>
      )}

      {activeTab === 'diffs' && (
        <Section empty="No commit diffs available">
          {diffs.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.row}>
                <FileText color={Colors.primary} size={17} />
                <Text style={styles.itemTitle}>{shortSha(item.headCommitSha || item.id)}</Text>
                <StatusBadge value={item.status} />
              </View>
              <Text style={styles.itemBody}>{item.cleanDiffSummary || item.patchSummary || 'Diff summary is not available.'}</Text>
              <View style={styles.metaRow}>
                <Meta label="Files" value={`${item.includedFiles}/${item.totalFiles}`} />
                <Meta label="Excluded" value={String(item.excludedFiles)} />
              </View>
              {item.files.slice(0, 4).map((file) => (
                <Text key={`${item.id}-${file.filePath}`} style={styles.fileLine}>
                  {file.status}: {file.filePath}
                </Text>
              ))}
            </View>
          ))}
        </Section>
      )}

      {activeTab === 'analysis' && (
        <Section empty="No static analysis results yet">
          {analysis.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.row}>
                <AlertTriangle color={item.errorCount > 0 ? Colors.red : Colors.primary} size={17} />
                <Text style={styles.itemTitle}>{item.source || 'Static analysis'}</Text>
                <StatusBadge value={item.status} />
              </View>
              <View style={styles.metaRow}>
                <Meta label="Errors" value={String(item.errorCount)} />
                <Meta label="Warnings" value={String(item.warningCount)} />
              </View>
              <Text style={styles.itemSub}>{shortSha(item.commitSha)} - {formatDateTime(item.createdAt)}</Text>
            </View>
          ))}
        </Section>
      )}

      {activeTab === 'impact' && (
        <Section empty="No impact decisions yet">
          {impact.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.row}>
                <AlertTriangle color={item.needsHumanReview ? Colors.red : Colors.primary} size={17} />
                <Text style={styles.itemTitle}>{item.impactLevel}</Text>
                <StatusBadge value={item.decision} />
              </View>
              <View style={styles.metaRow}>
                <Meta label="Score" value={String(item.impactScore)} />
                <Meta label="Commit" value={shortSha(item.commitSha)} />
              </View>
              {item.reasons.map((reason) => (
                <Text key={`${item.id}-${reason}`} style={styles.fileLine}>{reason}</Text>
              ))}
            </View>
          ))}
        </Section>
      )}

      {activeTab === 'ai' && (
        <Section empty={aiError || 'No AI reviews yet'}>
          {aiReviews.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('AiReviewDetail', { reviewId: item.id })}
              activeOpacity={0.86}
            >
              <View style={styles.row}>
                <BrainCircuit color={Colors.primary} size={18} />
                <Text style={styles.itemTitle}>{item.reviewKind.replaceAll('_', ' ')}</Text>
                <StatusBadge value={item.status} />
              </View>
              <Text style={styles.itemBody}>{item.summary || item.overallSummary || 'No summary available.'}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.inlineLinkText}>Technical findings</Text>
                <ChevronRight color={Colors.textMuted} size={18} />
              </View>
            </TouchableOpacity>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ children, empty }: { children: React.ReactNode; empty: string }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children;
  if (Array.isArray(list) && list.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>{empty}</Text>
      </View>
    );
  }
  return <>{children}</>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function shortSha(value?: string | null) {
  if (!value) return 'n/a';
  return value.length > 10 ? value.slice(0, 10) : value;
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
  heroTitleWrap: { flex: 1 },
  title: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  meta: { backgroundColor: Colors.gray50, borderRadius: Radius.md, flex: 1, padding: 10 },
  metaLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  metaValue: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 4 },
  linkButton: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 13 },
  linkText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  tabRow: { gap: 8, paddingVertical: 14 },
  tab: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  tabOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800' },
  tabTextOn: { color: '#fff' },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
    ...Shadow.sm,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  itemTitle: { color: Colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '800' },
  itemStat: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800' },
  itemBody: { color: Colors.textPrimary, fontSize: 13, lineHeight: 19, marginTop: 10 },
  itemSub: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 7 },
  inlineLink: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 10 },
  inlineLinkText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  fileLine: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  cardAction: {
    alignItems: 'center',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 13,
    paddingTop: 12,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
