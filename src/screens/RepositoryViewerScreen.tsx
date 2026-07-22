import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, ExternalLink, GitBranch } from 'lucide-react-native';
import { repositoriesApi } from '../features/repositories/api/repositoriesApi';
import type { Repository } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RepositoryViewer'>;

export function RepositoryViewerScreen({ navigation, route }: Props) {
  const { competitionId, teamId, eventTitle, teamName } = route.params;
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await repositoriesApi.list({ competitionId, teamId, limit: 50 });
      setRepositories(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [competitionId, teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState label="Loading repositories..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadData()} />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={repositories}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData('refresh')} />}
      ListHeaderComponent={(
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <GitBranch color={Colors.primary} size={24} />
          </View>
          <Text style={styles.title}>Repositories</Text>
          <Text style={styles.subtitle}>{teamName || 'Your team'} - {eventTitle || 'Selected competition'}</Text>
        </View>
      )}
      ListEmptyComponent={(
        <EmptyState
          title="No repository linked"
          message="Repository linking is managed by competition staff or GitHub setup permissions."
        />
      )}
      renderItem={({ item }) => (
        <RepositoryCard
          repository={item}
          onOpen={() => navigation.navigate('RepositoryDetail', { repositoryId: item.id })}
        />
      )}
    />
  );
}

function RepositoryCard({ onOpen, repository }: { onOpen: () => void; repository: Repository }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.86}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.repoName}>{repository.repositoryFullName}</Text>
          <Text style={styles.repoSub}>{repository.round?.name || repository.defaultBranch || 'Repository'}</Text>
        </View>
        <StatusBadge value={repository.status} />
      </View>

      <View style={styles.metaRow}>
        <Meta label="Access" value={repository.accessState} />
        <Meta label="Branch" value={repository.defaultBranch || 'main'} />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.urlButton}
          onPress={() => Linking.openURL(repository.repositoryUrl)}
        >
          <ExternalLink color={Colors.primary} size={16} />
          <Text style={styles.urlText}>Open URL</Text>
        </TouchableOpacity>
        <View style={styles.detailButton}>
          <Text style={styles.detailText}>Evidence</Text>
          <ChevronRight color={Colors.textMuted} size={18} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
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
  repoName: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  repoSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 13 },
  meta: { backgroundColor: Colors.gray50, borderRadius: Radius.md, flex: 1, padding: 10 },
  metaLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  metaValue: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 4 },
  actionRow: {
    alignItems: 'center',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 13,
  },
  urlButton: { alignItems: 'center', flexDirection: 'row', gap: 7, paddingVertical: 4 },
  urlText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  detailButton: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  detailText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '800' },
});
