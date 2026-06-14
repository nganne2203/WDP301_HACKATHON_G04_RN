import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExternalLink, FileText, Video } from 'lucide-react-native';
import { mediaService } from '../features/media/services/mediaService';
import { formatFileSize, getMediaTitle } from '../features/media/models/mediaHelpers';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { ErrorState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MediaDetail'>;

export function MediaDetailScreen({ route }: Props) {
  const { media } = route.params;
  const [signedUrl, setSignedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUrl = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await mediaService.getViewUrl(media.id);
      setSignedUrl(response.data.signedUrl);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [media.id]);

  useEffect(() => {
    loadUrl();
  }, [loadUrl]);

  if (error) return <ErrorState message={error} onRetry={loadUrl} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.topRow}>
          <View style={styles.flex}>
            <Text style={styles.title}>{getMediaTitle(media)}</Text>
            <Text style={styles.subtitle}>{media.originalFileName}</Text>
          </View>
          <StatusBadge value={media.status} />
        </View>

        <View style={styles.preview}>
          {loading && <ActivityIndicator color={Colors.primary} />}
          {!loading && signedUrl && media.mediaType === 'IMAGE' && (
            <Image source={{ uri: signedUrl }} style={styles.image} resizeMode="contain" />
          )}
          {!loading && signedUrl && media.mediaType !== 'IMAGE' && (
            <View style={styles.filePreview}>
              {media.mediaType === 'VIDEO' ? <Video color={Colors.primary} size={42} /> : <FileText color={Colors.primary} size={42} />}
              <Text style={styles.fileTitle}>{media.mediaType === 'VIDEO' ? 'Video preview opens externally' : 'Document opens externally'}</Text>
              <TouchableOpacity style={styles.openButton} onPress={() => Linking.openURL(signedUrl)}>
                <ExternalLink color="#fff" size={17} />
                <Text style={styles.openText}>Open signed URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Info label="Type" value={media.mediaType} />
      <Info label="Size" value={formatFileSize(media.fileSize)} />
      <Info label="Uploaded" value={formatDateTime(media.uploadedAt)} />
      {!!media.uploadedBy && <Info label="Uploader" value={media.uploadedBy.fullName || media.uploadedBy.email || media.uploadedBy.id} />}
      {!!media.description && <Info label="Description" value={media.description} />}
      {!!media.rejectReason && <Info label="Reject reason" value={media.rejectReason} danger />}
      {!!media.tags.length && <Info label="Tags" value={media.tags.join(', ')} />}
    </ScrollView>
  );
}

function Info({ danger, label, value }: { danger?: boolean; label: string; value: string }) {
  return (
    <View style={[styles.info, danger && styles.infoDanger]}>
      <Text style={[styles.infoLabel, danger && styles.infoLabelDanger]}>{label}</Text>
      <Text style={[styles.infoValue, danger && styles.infoValueDanger]}>{value}</Text>
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
    padding: 16,
    ...Shadow.sm,
  },
  topRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  flex: { flex: 1 },
  title: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  preview: {
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: Radius.md,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 260,
    overflow: 'hidden',
  },
  image: { height: 300, width: '100%' },
  filePreview: { alignItems: 'center', gap: 12, padding: 24 },
  fileTitle: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  openButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  openText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  info: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 10,
    padding: 13,
  },
  infoDanger: { backgroundColor: Colors.redLight, borderColor: Colors.redLight },
  infoLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  infoLabelDanger: { color: Colors.red },
  infoValue: { color: Colors.textPrimary, fontSize: 13, lineHeight: 19, marginTop: 5 },
  infoValueDanger: { color: Colors.red },
});
