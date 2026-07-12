import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClipboardCheck, FileText, GitBranch, MailPlus, MessageCircle, Plus, QrCode, TicketCheck, UsersRound } from 'lucide-react-native';
import { eventsApi } from '../features/events/api/eventsApi';
import { teamsApi } from '../features/teams/api/teamsApi';
import { participantsApi } from '../features/participants/api/participantsApi';
import { canManageInvitations, getTeamMemberCount, isRegistrationOpen } from '../features/teams/model/teamHelpers';
import type { Event, Team } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateRange, initials } from '../core/utils/format';
import { filterVisibleEvents } from '../core/utils/eventVisibility';
import { Header } from '../shared/ui/Header';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function TeamHomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { user, hasPermission } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamError, setTeamError] = useState('');

  const selectedEvent = useMemo(() => {
    return events.find((event) => event.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const loadEvents = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await eventsApi.list({ page: 1, limit: 50 });
      const list = await filterVisibleEvents(response.data, user, participantsApi.getMine);
      setEvents(list);
      setSelectedEventId((current) => {
        if (current && list.some((event) => event.id === current)) return current;
        return list.find(isRegistrationOpen)?.id || list[0]?.id || '';
      });
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const loadTeam = useCallback(async (eventId: string) => {
    if (!eventId) {
      setTeam(null);
      return;
    }
    setTeamLoading(true);
    setTeamError('');
    try {
      const response = await teamsApi.getMyTeam(eventId);
      setTeam(response.data);
    } catch (loadError) {
      setTeam(null);
      setTeamError(errorMessage(loadError));
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadTeam(selectedEventId);
  }, [loadTeam, selectedEventId]);

  function refreshAll() {
    loadEvents('refresh');
    if (selectedEventId) loadTeam(selectedEventId);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Team" subtitle="Registration and team management" user={user} />
        <LoadingState label="Loading team workspace..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Team" subtitle="Registration and team management" user={user} />
        <ErrorState message={error} onRetry={() => loadEvents()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Team" subtitle="Registration and team management" user={user} />
      <FlatList
        contentContainerStyle={styles.content}
        data={team?.participants || []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing || teamLoading} onRefresh={refreshAll} />}
        ListHeaderComponent={(
          <>
            <Text style={styles.sectionLabel}>Event</Text>
            <FlatList
              horizontal
              data={events}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventChips}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedEventId(item.id)}
                  style={[styles.eventChip, selectedEventId === item.id && styles.eventChipOn]}
                >
                  <Text style={[styles.eventChipText, selectedEventId === item.id && styles.eventChipTextOn]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {selectedEvent ? (
              <View style={styles.eventCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
                  <StatusBadge value={selectedEvent.status} />
                </View>
                <Text style={styles.eventSub}>Registration: {formatDateRange(selectedEvent.registrationStart, selectedEvent.registrationEnd)}</Text>
                <View style={styles.actionGrid}>
                  <ActionButton
                    icon={<TicketCheck color={Colors.primary} size={18} />}
                    label="Register"
                    onPress={() => navigation.navigate('EventRegistration', { eventId: selectedEvent.id })}
                  />
                  <ActionButton
                    icon={<Plus color={Colors.primary} size={18} />}
                    label="Create team"
                    onPress={() => navigation.navigate('CreateTeam', { eventId: selectedEvent.id })}
                  />
                  <ActionButton
                    icon={<MailPlus color={Colors.primary} size={18} />}
                    label="Join invite"
                    onPress={() => navigation.navigate('InvitationDecision')}
                  />
                  <ActionButton
                    icon={<ClipboardCheck color={Colors.primary} size={18} />}
                    label="Attendance"
                    onPress={() => navigation.navigate('AttendanceHistory', { eventId: selectedEvent.id })}
                  />
                  <ActionButton
                    icon={<QrCode color={Colors.primary} size={18} />}
                    label="Scan QR"
                    onPress={() => navigation.navigate('QrCheckIn', { eventId: selectedEvent.id, eventTitle: selectedEvent.title })}
                  />
                </View>
                {hasPermission('PARTICIPANT_APPROVE') && (
                  <TouchableOpacity style={styles.checkInButton} onPress={() => navigation.navigate('CheckIn', { eventId: selectedEvent.id })}>
                    <ClipboardCheck color="#fff" size={17} />
                    <Text style={styles.checkInText}>Open coordinator check-in</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <EmptyState title="No events available" message="Events you can view will appear here." />
            )}

            <View style={styles.teamHeader}>
              <Text style={styles.sectionLabel}>My team</Text>
              {teamLoading && <ActivityIndicator color={Colors.primary} />}
            </View>

            {!teamLoading && !team && (
              <View style={styles.emptyCard}>
                <UsersRound color={Colors.textMuted} size={30} />
                <Text style={styles.emptyTitle}>No team for this event</Text>
                <Text style={styles.emptySub}>
                  {teamError || 'Create a team or accept an invitation to join one.'}
                </Text>
              </View>
            )}

            {!!team && (
              <>
                <TeamSummary
                  canInvite={canManageInvitations(team, user?.id, selectedEvent)}
                  onInvite={() => navigation.navigate('InviteMembers', { teamId: team.id, eventId: team.eventId })}
                  team={team}
                />
                <View style={styles.teamTools}>
                  <ActionButton
                    icon={<FileText color={Colors.primary} size={18} />}
                    label="Submissions"
                    onPress={() => navigation.navigate('Submissions', {
                      eventId: team.eventId,
                      teamId: team.id,
                      eventTitle: selectedEvent?.title,
                      teamName: team.name,
                    })}
                  />
                  <ActionButton
                    icon={<GitBranch color={Colors.primary} size={18} />}
                    label="Repositories"
                    onPress={() => navigation.navigate('RepositoryViewer', {
                      eventId: team.eventId,
                      teamId: team.id,
                      eventTitle: selectedEvent?.title,
                      teamName: team.name,
                    })}
                  />
                  <ActionButton
                    icon={<MessageCircle color={Colors.primary} size={18} />}
                    label="Team chat"
                    onPress={() => navigation.navigate('TeamChat', {
                      teamId: team.id,
                      teamName: team.name,
                    })}
                  />
                </View>
              </>
            )}

            {!!team && <Text style={styles.sectionLabel}>Confirmed members</Text>}
          </>
        )}
        ListEmptyComponent={team ? <EmptyState title="No confirmed members" /> : null}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(item.user?.fullName, item.user?.email)}</Text>
            </View>
            <View style={styles.memberBody}>
              <Text style={styles.memberName}>{item.user?.fullName || item.user?.email || 'Member'}</Text>
              <Text style={styles.memberSub}>{item.user?.email || 'No email'}</Text>
            </View>
            <StatusBadge value={item.teamRole} />
          </View>
        )}
      />
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      {icon}
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function TeamSummary({ canInvite, onInvite, team }: { canInvite: boolean; onInvite: () => void; team: Team }) {
  return (
    <View style={styles.teamCard}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.eventSub}>{team.projectName || team.event?.title || 'Project name not set'}</Text>
        </View>
        <StatusBadge value={team.status} />
      </View>
      {!!team.rejectionReason && <Text style={styles.rejection}>{team.rejectionReason}</Text>}
      <View style={styles.statRow}>
        <Stat label="Members" value={String(getTeamMemberCount(team))} />
        <Stat label="Invites" value={String(team.invitations.filter((invite) => invite.status === 'PENDING').length)} />
        <Stat label="Required" value={String(team.event?.minTeamMembers || 3)} />
      </View>
      <View style={styles.mentorSection}>
        <Text style={styles.mentorLabel}>Assigned mentors</Text>
        {team.assignedMentors && team.assignedMentors.length > 0 ? (
          <View style={styles.mentorChips}>
            {team.assignedMentors.map((mentor) => (
              <View key={mentor.id} style={styles.mentorChip}>
                <Text style={styles.mentorChipText}>{mentor.fullName || mentor.email}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.mentorEmpty}>No mentors assigned yet.</Text>
        )}
      </View>
      {canInvite && (
        <TouchableOpacity style={styles.outlineButton} onPress={onInvite}>
          <MailPlus color={Colors.primary} size={17} />
          <Text style={styles.outlineText}>Manage invitations</Text>
        </TouchableOpacity>
      )}
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

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  sectionLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 10 },
  eventChips: { gap: 8, paddingBottom: 12 },
  eventChip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: 220,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  eventChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  eventChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  eventChipTextOn: { color: '#fff' },
  eventCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  eventTitle: { color: Colors.textPrimary, flex: 1, fontSize: 17, fontWeight: '800' },
  eventSub: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  actionButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  actionText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800' },
  checkInButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
  },
  checkInText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  teamHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 8 },
  emptySub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  teamCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    ...Shadow.sm,
  },
  mentorSection: { marginTop: 14 },
  mentorLabel: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  mentorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mentorChip: {
    backgroundColor: Colors.blue100,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mentorChipText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  mentorEmpty: { color: Colors.textMuted, fontSize: 12 },
  flex: { flex: 1 },
  teamName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  rejection: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    padding: 10,
  },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { backgroundColor: Colors.gray50, borderRadius: Radius.md, flex: 1, padding: 11 },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  teamTools: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  outlineButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    padding: 12,
  },
  outlineText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  memberRow: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.blue100,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 11,
    width: 40,
  },
  avatarText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  memberBody: { flex: 1 },
  memberName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  memberSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
});
