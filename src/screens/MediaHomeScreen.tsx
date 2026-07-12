import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Images, Upload } from 'lucide-react-native';
import { eventsApi } from '../features/events/api/eventsApi';
import { participantsApi } from '../features/participants/api/participantsApi';
import { MediaCard } from '../features/media/components/MediaCard';
import { MediaStatsGrid } from '../features/media/components/MediaStatsGrid';
import { MediaTypeFilter } from '../features/media/components/MediaTypeFilter';
import { mediaService } from '../features/media/services/mediaService';
import { canDeleteMedia, flattenGallery, MEDIA_STATUSES, MEDIA_TYPES } from '../features/media/models/mediaHelpers';
import type { Event, MediaItem, MediaStatus, MediaType } from '../core/api/types';
import { useAuth } from '../core/session/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage } from '../core/utils/format';
import { filterVisibleEvents } from '../core/utils/eventVisibility';
import { Header } from '../shared/ui/Header';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { Colors, Radius, Shadow } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type MediaTab = 'gallery' | 'history';
type TypeFilter = 'ALL' | MediaType;
type StatusFilter = 'ALL' | MediaStatus;

export function MediaHomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [activeTab, setActiveTab] = useState<MediaTab>('gallery');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  const [galleryStats, setGalleryStats] = useState({ totalUploads: 0, totalImages: 0, totalVideos: 0, totalDocuments: 0 });
  const [historyItems, setHistoryItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );
  const items = activeTab === 'gallery' ? galleryItems : historyItems;

  const loadEvents = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await eventsApi.list({ page: 1, limit: 50 });
      const visibleEvents = await filterVisibleEvents(response.data, user, participantsApi.getMine);
      setEvents(visibleEvents);
      if (visibleEvents.length === 0) {
        setGalleryItems([]);
        setGalleryStats({ totalUploads: 0, totalImages: 0, totalVideos: 0, totalDocuments: 0 });
        setHistoryItems([]);
      }
      setSelectedEventId((current) => {
        if (current && visibleEvents.some((event) => event.id === current)) return current;
        return visibleEvents[0]?.id || '';
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const loadMedia = useCallback(async () => {
    if (!selectedEvent?.id) return;
    setError('');
    try {
      const [galleryResponse, historyResponse] = await Promise.all([
        mediaService.getEventGallery(selectedEvent.id, {
          mediaType: typeFilter === 'ALL' ? undefined : typeFilter,
        }),
        mediaService.getMyHistory({
          eventId: selectedEvent.id,
          mediaType: typeFilter === 'ALL' ? undefined : typeFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page: 1,
          limit: 50,
        }),
      ]);
      setGalleryItems(flattenGallery(galleryResponse.data));
      setGalleryStats(galleryResponse.data.statistics);
      setHistoryItems(historyResponse.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [selectedEvent?.id, statusFilter, typeFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  function refreshAll() {
    loadEvents('refresh');
    loadMedia();
  }

  async function deleteOwn(media: MediaItem) {
    if (!canDeleteMedia(media, user?.id)) {
      Alert.alert('Cannot delete', 'Only your own pending uploads can be deleted.');
      return;
    }
    Alert.alert('Delete media?', 'This removes the file and metadata.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mediaService.deleteOwn(media.id);
            await loadMedia();
          } catch (deleteError) {
            Alert.alert('Delete failed', errorMessage(deleteError));
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Media" subtitle="Gallery and uploads" user={user} />
        <LoadingState label="Loading media..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Media" subtitle="Gallery and uploads" user={user} />
        <ErrorState message={error} onRetry={() => loadEvents()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Media" subtitle="Gallery and uploads" user={user} />
      <FlatList
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        ListHeaderComponent={(
          <>
            <Text style={styles.sectionLabel}>Event</Text>
            <FlatList
              horizontal
              data={events}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedEventId(item.id)}
                  style={[styles.chip, selectedEvent?.id === item.id && styles.chipOn]}
                >
                  <Text style={[styles.chipText, selectedEvent?.id === item.id && styles.chipTextOn]} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Images color={Colors.primary} size={24} />
              </View>
              <Text style={styles.title}>{selectedEvent?.title || 'Event media'}</Text>
              <Text style={styles.subtitle}>Approved gallery items and your upload history.</Text>
              <MediaStatsGrid
                items={[
                  { label: 'Total', value: galleryStats.totalUploads },
                  { label: 'Images', value: galleryStats.totalImages },
                  { label: 'Videos', value: galleryStats.totalVideos },
                  { label: 'Docs', value: galleryStats.totalDocuments },
                ]}
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => selectedEvent && navigation.navigate('MediaUpload', { eventId: selectedEvent.id })}
              >
                <Upload color="#fff" size={17} />
                <Text style={styles.primaryText}>Upload</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TabButton label={`Gallery ${galleryItems.length}`} active={activeTab === 'gallery'} onPress={() => setActiveTab('gallery')} />
              <TabButton label={`History ${historyItems.length}`} active={activeTab === 'history'} onPress={() => setActiveTab('history')} />
            </View>

            <Text style={styles.sectionLabel}>Type</Text>
            <MediaTypeFilter options={['ALL', ...MEDIA_TYPES]} selected={typeFilter} onSelect={(value) => setTypeFilter(value as TypeFilter)} />
            {activeTab === 'history' && (
              <>
                <Text style={styles.sectionLabel}>Status</Text>
                <MediaTypeFilter options={['ALL', ...MEDIA_STATUSES]} selected={statusFilter} onSelect={(value) => setStatusFilter(value as StatusFilter)} />
              </>
            )}
          </>
        )}
        ListEmptyComponent={(
          <EmptyState
            title={activeTab === 'gallery' ? 'No approved media' : 'No uploads yet'}
            message={activeTab === 'gallery' ? 'Approved media for this event will appear here.' : 'Upload media to track moderation status.'}
          />
        )}
        renderItem={({ item }) => (
          <MediaCard
            media={item}
            onPress={() => navigation.navigate('MediaDetail', { media: item })}
            rightAction={activeTab === 'history' && canDeleteMedia(item, user?.id) ? (
              <TouchableOpacity style={styles.deletePill} onPress={() => deleteOwn(item)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            ) : undefined}
          />
        )}
      />
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabOn]}>
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
    </TouchableOpacity>
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
    marginBottom: 14,
    padding: 16,
    gap: 12,
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
  title: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    padding: 12,
  },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
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
  deletePill: { backgroundColor: Colors.redLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  deleteText: { color: Colors.red, fontSize: 11, fontWeight: '800' },
});
