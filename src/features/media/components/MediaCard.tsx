import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ReactNode } from 'react';
import { FileText, ImageIcon, Video } from 'lucide-react-native';
import type { MediaItem } from '../../../core/api/types';
import { formatDateTime } from '../../../core/utils/format';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../../../theme/colors';
import { formatFileSize, getMediaTitle } from '../models/mediaHelpers';

export function MediaCard({
  media,
  onPress,
  rightAction,
}: {
  media: MediaItem;
  onPress: () => void;
  rightAction?: ReactNode;
}) {
  const Icon = media.mediaType === 'IMAGE' ? ImageIcon : media.mediaType === 'VIDEO' ? Video : FileText;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.iconBox}>
        <Icon color={Colors.primary} size={28} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={2}>{getMediaTitle(media)}</Text>
          <StatusBadge value={media.status} />
        </View>
        {!!media.description && <Text style={styles.description} numberOfLines={2}>{media.description}</Text>}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{media.mediaType}</Text>
          <Text style={styles.meta}>{formatFileSize(media.fileSize)}</Text>
          <Text style={styles.meta}>{formatDateTime(media.uploadedAt)}</Text>
        </View>
        {!!media.rejectReason && <Text style={styles.reject} numberOfLines={2}>{media.rejectReason}</Text>}
        {!!media.uploadedBy?.email && <Text style={styles.uploader} numberOfLines={1}>{media.uploadedBy.fullName || media.uploadedBy.email}</Text>}
        {!!media.tags.length && (
          <View style={styles.tags}>
            {media.tags.slice(0, 4).map((tag) => (
              <View style={styles.tag} key={`${media.id}-${tag}`}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {rightAction}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 14,
    ...Shadow.sm,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  body: { flex: 1 },
  topRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  title: { color: Colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '800' },
  description: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  meta: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  reject: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    padding: 8,
  },
  uploader: { color: Colors.textSecondary, fontSize: 12, marginTop: 7 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  tag: { backgroundColor: Colors.gray100, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { color: Colors.textSecondary, fontSize: 10, fontWeight: '800' },
});
