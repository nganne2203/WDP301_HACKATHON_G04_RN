import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MailPlus, Plus, Trash2, UsersRound } from 'lucide-react-native';
import { eventsApi } from '../features/events/api/eventsApi';
import { teamsApi } from '../features/teams/api/teamsApi';
import {
  createMemberRow,
  isEmail,
  isRegistrationOpen,
  normalizeMemberRows,
  type MemberInviteRow,
} from '../features/teams/model/teamHelpers';
import type { Event } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateRange } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTeam'>;

export function CreateTeamScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [members, setMembers] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await eventsApi.getById(eventId);
      setEvent(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  function updateMember(id: string, patch: Partial<MemberInviteRow>) {
    setMembers((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
    setFormError('');
  }

  function removeMember(id: string) {
    setMembers((rows) => rows.length === 1 ? [createMemberRow()] : rows.filter((row) => row.id !== id));
  }

  async function handleCreate() {
    if (!teamName.trim()) {
      setFormError('Team name is required');
      return;
    }

    const invalidEmail = members.some((row) => row.email.trim() && !isEmail(row.email));
    if (invalidEmail) {
      setFormError('Please enter valid invitation emails');
      return;
    }

    let normalizedMembers;
    try {
      normalizedMembers = normalizeMemberRows(members, user?.email);
    } catch (memberError) {
      setFormError(memberError instanceof Error ? memberError.message : 'Please check invited member details');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const response = await teamsApi.create({
        eventId,
        name: teamName.trim(),
        projectName: projectName.trim() || null,
        chapterName: chapterName.trim() || null,
        invitedMembers: normalizedMembers,
      });
      navigation.replace('InviteMembers', { teamId: response.data.id, eventId });
    } catch (submitError) {
      setFormError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading event..." />;
  if (error) return <ErrorState message={error} onRetry={loadEvent} />;
  if (!event) return <EmptyState title="Event not found" />;

  const registrationOpen = isRegistrationOpen(event);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.eventCard}>
        <StatusBadge value={event.status} />
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventSub}>Registration: {formatDateRange(event.registrationStart, event.registrationEnd)}</Text>
      </View>

      <View style={styles.card}>
        {!registrationOpen && <Text style={styles.warning}>Team creation is only available while registration is open.</Text>}
        {!!formError && <Text style={styles.error}>{formError}</Text>}

        <Field label="Team name" value={teamName} onChangeText={setTeamName} placeholder="Code Wizards" />
        <Field label="Project name" value={projectName} onChangeText={setProjectName} placeholder="Optional" />
        <Field label="Chapter name" value={chapterName} onChangeText={setChapterName} placeholder="Optional" />

        <View style={styles.inviteHeader}>
          <View>
            <Text style={styles.sectionTitle}>Invite members</Text>
            <Text style={styles.sectionSub}>Members receive secure invitation emails.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setMembers((rows) => [...rows, createMemberRow()])}>
            <Plus color={Colors.primary} size={17} />
          </TouchableOpacity>
        </View>

        {members.map((member, index) => (
          <View key={member.id} style={styles.memberBox}>
            <View style={styles.memberTop}>
              <Text style={styles.memberTitle}>Member {index + 1}</Text>
              <TouchableOpacity onPress={() => removeMember(member.id)}>
                <Trash2 color={Colors.textMuted} size={17} />
              </TouchableOpacity>
            </View>
            <TextInput
              onChangeText={(value) => updateMember(member.id, { fullName: value })}
              placeholder="Full name"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              value={member.fullName}
            />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(value) => updateMember(member.id, { email: value })}
              placeholder="member@example.com"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.inputSpacing]}
              value={member.email}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(value) => updateMember(member.id, { githubUsername: value })}
              placeholder="github-user"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.inputSpacing]}
              value={member.githubUsername}
            />
          </View>
        ))}

        <TouchableOpacity
          disabled={!registrationOpen || submitting}
          onPress={handleCreate}
          style={[styles.primaryButton, (!registrationOpen || submitting) && styles.disabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <UsersRound color="#fff" size={18} />
              <Text style={styles.primaryText}>Create team</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  eventCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    ...Shadow.sm,
  },
  eventTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 12 },
  eventSub: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 6 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
    ...Shadow.sm,
  },
  field: { marginBottom: 14 },
  label: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    height: 46,
    paddingHorizontal: 12,
  },
  inputSpacing: { marginTop: 10 },
  inviteHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  sectionSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  addButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  memberBox: {
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  memberTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  memberTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  error: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    padding: 10,
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    padding: 10,
  },
});
