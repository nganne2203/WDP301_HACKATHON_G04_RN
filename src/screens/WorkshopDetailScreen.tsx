import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ExternalLink, MessageCircle, UserRound } from 'lucide-react-native';
import { workshopsApi } from '../features/workshops/api/workshopsApi';
import type { Workshop } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkshopDetail'>;

export function WorkshopDetailScreen({ route }: Props) {
  const { workshopId } = route.params;
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

      <View style={styles.card}>
        <View style={styles.rowCenter}>
          <MessageCircle color={Colors.primary} size={18} />
          <Text style={styles.cardLabel}>Questionnaire</Text>
        </View>
        {workshop.questionnaire?.length ? (
          workshop.questionnaire.map((question) => (
            <Text key={question} style={styles.question}>{question}</Text>
          ))
        ) : (
          <Text style={styles.cardSub}>No questionnaire published.</Text>
        )}
      </View>
    </ScrollView>
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
    padding: 18,
    ...Shadow.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 23, fontWeight: '800', marginTop: 14 },
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
  question: {
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
});
