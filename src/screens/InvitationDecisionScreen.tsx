import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react-native';
import { teamsApi } from '../features/teams/api/teamsApi';
import type { InvitationDecisionResult } from '../core/api/types';
import { errorMessage } from '../core/utils/format';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

export function InvitationDecisionScreen() {
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState<'accept' | 'decline' | null>(null);
  const [result, setResult] = useState<InvitationDecisionResult | null>(null);
  const [error, setError] = useState('');

  async function submit(decision: 'accept' | 'decline') {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setError('Paste the invitation token from your email');
      return;
    }

    setSubmitting(decision);
    setError('');
    setResult(null);
    try {
      const response = decision === 'accept'
        ? await teamsApi.acceptInvitation(cleanToken)
        : await teamsApi.declineInvitation(cleanToken);
      setResult(response.data);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <MailCheck color={Colors.primary} size={32} />
          <Text style={styles.title}>Join team invitation</Text>
          <Text style={styles.sub}>Paste the secure token from your invitation email to accept or decline.</Text>
        </View>

        <View style={styles.card}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Text style={styles.label}>Invitation token</Text>
          <TextInput
            autoCapitalize="none"
            multiline
            onChangeText={(value) => {
              setToken(value);
              setError('');
              setResult(null);
            }}
            placeholder="Paste token here"
            placeholderTextColor={Colors.textMuted}
            style={styles.tokenInput}
            value={token}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              disabled={Boolean(submitting)}
              onPress={() => submit('decline')}
              style={[styles.outlineButton, submitting && styles.disabled]}
            >
              {submitting === 'decline' ? <ActivityIndicator color={Colors.red} /> : <XCircle color={Colors.red} size={17} />}
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={Boolean(submitting)}
              onPress={() => submit('accept')}
              style={[styles.primaryButton, submitting && styles.disabled]}
            >
              {submitting === 'accept' ? <ActivityIndicator color="#fff" /> : <CheckCircle2 color="#fff" size={17} />}
              <Text style={styles.primaryText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!!result && (
          <View style={styles.resultCard}>
            <StatusBadge value={result.status} />
            <Text style={styles.resultTitle}>{result.team?.name || 'Invitation updated'}</Text>
            <Text style={styles.resultSub}>
              Invitation for {result.invitation.invitedEmail} is now {result.invitation.status}.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  hero: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 18,
    ...Shadow.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800', marginTop: 12 },
  sub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
    ...Shadow.sm,
  },
  label: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  tokenInput: {
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 110,
    padding: 12,
    textAlignVertical: 'top',
  },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  outlineButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    height: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    height: 48,
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  declineText: { color: Colors.red, fontSize: 14, fontWeight: '800' },
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
  resultCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.greenBorder,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  resultTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800', marginTop: 10 },
  resultSub: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
});
