import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarClock, CheckCircle2, ChevronRight, Presentation, QrCode, TicketCheck } from 'lucide-react-native';
import { eventsApi } from '../features/events/api/eventsApi';
import { participantsApi } from '../features/participants/api/participantsApi';
import { timelinesApi } from '../features/timelines/api/timelinesApi';
import { workshopsApi } from '../features/workshops/api/workshopsApi';
import type { Event, Participant, TimelineEvent, Workshop } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage, formatDateRange } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

export function EventDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [eventResponse, timelineResponse, workshopResponse] = await Promise.all([
        eventsApi.getById(eventId),
        timelinesApi.list({ eventId, limit: 5 }),
        workshopsApi.list({ eventId, limit: 5 }),
      ]);
      setEvent(eventResponse.data);
      setTimeline(timelineResponse.data);
      setWorkshops(workshopResponse.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const loadParticipant = useCallback(async () => {
    try {
      const response = await participantsApi.getMine(eventId);
      setParticipant(response.data);
    } catch {
      setParticipant(null);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => {
    loadParticipant();
  }, [loadParticipant]));

  if (loading) return <LoadingState label="Loading event..." />;
  if (error) return <ErrorState message={error} onRetry={loadDetail} />;
  if (!event) return <EmptyState title="Event not found" />;

  const canCheckIn = participant?.team?.status === 'CONFIRMED';

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.hero}>
        <StatusBadge value={event.status} />
        <Text style={styles.title}>{event.title}</Text>
        {!!event.theme && <Text style={styles.theme}>{event.theme}</Text>}
        {!!event.description && <Text style={styles.description}>{event.description}</Text>}
      </View>

      <InfoCard label="Event dates" value={formatDateRange(event.startDate, event.endDate)} />
      <InfoCard label="Registration" value={formatDateRange(event.registrationStart, event.registrationEnd)} />

      <View style={styles.grid}>
        <Stat label="Max teams" value={String(event.maxTeams ?? 'TBA')} />
        <Stat label="Team size" value={`${event.minTeamMembers ?? '?'}-${event.maxTeamMembers ?? '?'}`} />
      </View>

      {participant && (
        <View style={[styles.checkInCard, canCheckIn && participant.checkInStatus === 'CHECKED_IN' && styles.checkInCardDone]}>
          <CheckCircle2 color={canCheckIn && participant.checkInStatus === 'CHECKED_IN' ? Colors.greenDark : Colors.textMuted} size={25} />
          <View style={styles.checkInTextWrap}>
            <Text style={[styles.checkInTitle, canCheckIn && participant.checkInStatus === 'CHECKED_IN' && styles.checkInTitleDone]}>
              {!canCheckIn ? 'Check-in unavailable' : participant.checkInStatus === 'CHECKED_IN' ? 'Checked in' : 'Not checked in yet'}
            </Text>
            <Text style={styles.checkInSub}>
              {!canCheckIn
                ? 'Your team must be confirmed before you can check in.'
                : participant.checkInStatus === 'CHECKED_IN'
                ? 'Your attendance for this event has been confirmed.'
                : 'Scan the coordinator QR code when check-in opens.'}
            </Text>
          </View>
        </View>
      )}

      <SectionAction
        icon={<TicketCheck color={Colors.primary} size={19} />}
        title="Participant registration"
        subtitle="Register yourself for this event"
        onPress={() => navigation.navigate('EventRegistration', { eventId })}
      />

      {canCheckIn && participant?.checkInStatus !== 'CHECKED_IN' && (
        <SectionAction
          icon={<QrCode color={Colors.primary} size={19} />}
          title="Check in with QR"
          subtitle="Scan the QR code displayed by the coordinator"
          onPress={() => navigation.navigate('QrCheckIn', { eventId, eventTitle: event.title })}
        />
      )}

      <SectionAction
        icon={<CalendarClock color={Colors.primary} size={19} />}
        title="Timeline"
        subtitle={`${timeline.length} upcoming or recent items`}
        onPress={() => navigation.navigate('Timeline', { eventId, eventTitle: event.title })}
      />

      <SectionAction
        icon={<Presentation color={Colors.primary} size={19} />}
        title="Workshops"
        subtitle={`${workshops.length} workshops linked to this event`}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Workshops' })}
      />
    </ScrollView>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionAction({ icon, title, subtitle, onPress }: { icon: ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sectionAction} onPress={onPress} activeOpacity={0.8}>
      {icon}
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight color={Colors.textMuted} size={18} />
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
    padding: 18,
    ...Shadow.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 23, fontWeight: '800', marginTop: 14 },
  theme: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginTop: 5 },
  description: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 12 },
  infoCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  infoLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 5 },
  grid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  stat: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  statValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  checkInCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    marginTop: 12,
    padding: 14,
  },
  checkInCardDone: { backgroundColor: '#F0FDF4', borderColor: Colors.greenBorder },
  checkInTextWrap: { flex: 1 },
  checkInTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  checkInTitleDone: { color: Colors.greenDark },
  checkInSub: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 2 },
  sectionAction: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    padding: 14,
  },
  sectionText: { flex: 1 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
});
