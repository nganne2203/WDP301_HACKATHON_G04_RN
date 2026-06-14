import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MailPlus, RefreshCw, Trash2 } from 'lucide-react-native';
import { teamsApi } from '../features/teams/api/teamsApi';
import {
  createMemberRow,
  isEmail,
  normalizeMemberRows,
  type MemberInviteRow,
} from '../features/teams/model/teamHelpers';
import type { Team, TeamInvitation } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateTime } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'InviteMembers'>;

export function InviteMembersScreen({ route }: Props) {
  const { teamId } = route.params;
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [rows, setRows] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [replacementEmails, setReplacementEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await teamsApi.getById(teamId);
      setTeam(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  function updateRow(id: string, patch: Partial<MemberInviteRow>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
    setFormError('');
    setMessage('');
  }

  async function handleInvite() {
    const invalidEmail = rows.some((row) => row.email.trim() && !isEmail(row.email));
    if (invalidEmail) {
      setFormError('Please enter valid invitation emails');
      return;
    }

    const members = normalizeMemberRows(rows, user?.email);
    if (!members.length) {
      setFormError('Enter at least one member email');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setMessage('');
    try {
      const response = await teamsApi.inviteMembers(teamId, { members });
      setMessage(`${response.data.total} invitation(s) sent`);
      setRows([createMemberRow()]);
      await loadTeam();
    } catch (inviteError) {
      setFormError(errorMessage(inviteError));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelInvitation(invitationId: string) {
    setSubmitting(true);
    setFormError('');
    try {
      await teamsApi.cancelInvitation(teamId, invitationId);
      await loadTeam();
    } catch (cancelError) {
      setFormError(errorMessage(cancelError));
    } finally {
      setSubmitting(false);
    }
  }

  async function replaceInvitation(invitation: TeamInvitation) {
    const email = replacementEmails[invitation.id]?.trim().toLowerCase();
    if (!email || !isEmail(email)) {
      setFormError('Enter a valid replacement email');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await teamsApi.replaceInvitation(teamId, invitation.id, { email });
      setReplacementEmails((current) => ({ ...current, [invitation.id]: '' }));
      await loadTeam();
    } catch (replaceError) {
      setFormError(errorMessage(replaceError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading invitations..." />;
  if (error) return <ErrorState message={error} onRetry={loadTeam} />;
  if (!team) return <EmptyState title="Team not found" />;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={team.invitations}
      keyExtractor={(item) => item.id}
      style={styles.container}
      ListHeaderComponent={(
        <>
          <View style={styles.teamCard}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamSub}>{team.projectName || team.event?.title || 'Team invitations'}</Text>
            <StatusBadge value={team.status} />
          </View>

          <View style={styles.card}>
            {!!formError && <Text style={styles.error}>{formError}</Text>}
            {!!message && <Text style={styles.success}>{message}</Text>}
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.sectionTitle}>Send more invitations</Text>
                <Text style={styles.sectionSub}>Invitees join by accepting their email token.</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => setRows((current) => [...current, createMemberRow()])}>
                <MailPlus color={Colors.primary} size={17} />
              </TouchableOpacity>
            </View>

            {rows.map((row, index) => (
              <View key={row.id} style={styles.memberBox}>
                <Text style={styles.memberTitle}>Invite {index + 1}</Text>
                <TextInput
                  onChangeText={(value) => updateRow(row.id, { fullName: value })}
                  placeholder="Full name"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  value={row.fullName}
                />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={(value) => updateRow(row.id, { email: value })}
                  placeholder="member@example.com"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.input, styles.inputSpacing]}
                  value={row.email}
                />
              </View>
            ))}

            <TouchableOpacity disabled={submitting} onPress={handleInvite} style={[styles.primaryButton, submitting && styles.disabled]}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send invitations</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.listTitle}>Invitation history</Text>
        </>
      )}
      ListEmptyComponent={<EmptyState title="No invitations yet" message="Sent invitations will appear here." />}
      renderItem={({ item }) => (
        <View style={styles.invitationCard}>
          <View style={styles.cardTop}>
            <View style={styles.flex}>
              <Text style={styles.inviteEmail}>{item.invitedEmail}</Text>
              <Text style={styles.inviteSub}>Expires {formatDateTime(item.expiresAt)}</Text>
            </View>
            <StatusBadge value={item.status} />
          </View>

          {item.status === 'PENDING' && (
            <TouchableOpacity disabled={submitting} style={styles.outlineButton} onPress={() => cancelInvitation(item.id)}>
              <Trash2 color={Colors.red} size={16} />
              <Text style={styles.cancelText}>Cancel invite</Text>
            </TouchableOpacity>
          )}

          {item.status === 'DECLINED' && (
            <View style={styles.replaceBox}>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(value) => setReplacementEmails((current) => ({ ...current, [item.id]: value }))}
                placeholder="replacement@example.com"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={replacementEmails[item.id] || ''}
              />
              <TouchableOpacity disabled={submitting} style={styles.outlineButton} onPress={() => replaceInvitation(item)}>
                <RefreshCw color={Colors.primary} size={16} />
                <Text style={styles.outlineText}>Replace</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  teamCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    ...Shadow.sm,
  },
  teamName: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  teamSub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 10 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    ...Shadow.sm,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
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
  memberBox: { borderColor: Colors.border, borderRadius: Radius.md, borderWidth: 1, marginTop: 12, padding: 12 },
  memberTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 10 },
  input: {
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    height: 44,
    paddingHorizontal: 12,
  },
  inputSpacing: { marginTop: 10 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  listTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 10 },
  invitationCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 10,
    padding: 13,
  },
  flex: { flex: 1 },
  inviteEmail: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  inviteSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  outlineButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 12,
    padding: 11,
  },
  outlineText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  cancelText: { color: Colors.red, fontSize: 13, fontWeight: '800' },
  replaceBox: { marginTop: 12 },
  error: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    padding: 10,
  },
  success: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    color: Colors.greenDark,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    padding: 10,
  },
});
