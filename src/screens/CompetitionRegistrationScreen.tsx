import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalendarCheck, GraduationCap } from 'lucide-react-native';
import { competitionsApi } from '../features/competitions/api/competitionsApi';
import { participantsApi } from '../features/participants/api/participantsApi';
import { isRegistrationOpen } from '../features/teams/model/teamHelpers';
import type { Competition, Participant } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, formatDateRange } from '../core/utils/format';
import { EmptyState, ErrorState, LoadingState } from '../shared/ui/ScreenState';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CompetitionRegistration'>;

export function CompetitionRegistrationScreen({ navigation, route }: Props) {
  const { competitionId } = route.params;
  const { user } = useAuth();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [chapterName, setChapterName] = useState('');
  const [isGraduated, setIsGraduated] = useState(false);
  const [consentMediaUse, setConsentMediaUse] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const loadCompetition = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await competitionsApi.getById(competitionId);
      setCompetition(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    loadCompetition();
  }, [loadCompetition]);

  async function handleRegister() {
    setSubmitting(true);
    setFormError('');
    try {
      const response = await participantsApi.register({
        competitionId,
        chapterName: chapterName.trim() || null,
        isGraduated,
        consentMediaUse,
      });
      setParticipant(response.data);
    } catch (submitError) {
      setFormError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading registration..." />;
  if (error) return <ErrorState message={error} onRetry={loadCompetition} />;
  if (!competition) return <EmptyState title="Competition not found" />;

  const registrationOpen = isRegistrationOpen(competition);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.hero}>
        <StatusBadge value={competition.status} />
        <Text style={styles.title}>{competition.title}</Text>
        <Text style={styles.sub}>{formatDateRange(competition.registrationStart, competition.registrationEnd)}</Text>
        {!!competition.description && <Text style={styles.description}>{competition.description}</Text>}
      </View>

      {participant ? (
        <View style={styles.successCard}>
          <CalendarCheck color={Colors.greenDark} size={28} />
          <Text style={styles.successTitle}>Registration submitted</Text>
          <Text style={styles.successText}>
            Your participant status is {participant.status}. Check-in status is {participant.checkInStatus.replaceAll('_', ' ')}.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('TeamHome', { competitionId })}>
            <Text style={styles.secondaryText}>Continue to team setup</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          {!registrationOpen && (
            <Text style={styles.warning}>Registration is not open for this competition.</Text>
          )}
          {!!formError && <Text style={styles.error}>{formError}</Text>}

          <Text style={styles.label}>Chapter name</Text>
          <TextInput
            onChangeText={setChapterName}
            placeholder="Optional"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={chapterName}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Graduated student</Text>
              <Text style={styles.switchSub}>Used for eligibility review.</Text>
            </View>
            <Switch onValueChange={setIsGraduated} value={isGraduated} />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Media consent</Text>
              <Text style={styles.switchSub}>Allow competition media usage for this registration.</Text>
            </View>
            <Switch onValueChange={setConsentMediaUse} value={consentMediaUse} />
          </View>

          <View style={styles.identity}>
            <GraduationCap color={Colors.primary} size={18} />
            <Text style={styles.identityText}>
              Registering as {user?.fullName || user?.email}
            </Text>
          </View>

          <TouchableOpacity
            disabled={!registrationOpen || submitting}
            onPress={handleRegister}
            style={[styles.primaryButton, (!registrationOpen || submitting) && styles.disabled]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Register for competition</Text>}
          </TouchableOpacity>
        </View>
      )}
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
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 14 },
  sub: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 8 },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
    ...Shadow.sm,
  },
  label: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    height: 48,
    paddingHorizontal: 12,
  },
  switchRow: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  switchText: { flex: 1, paddingRight: 12 },
  switchTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  switchSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  identity: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 14 },
  identityText: { color: Colors.textSecondary, flex: 1, fontSize: 13 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    marginTop: 16,
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
  successCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.greenBorder,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
    ...Shadow.sm,
  },
  successTitle: { color: Colors.greenDark, fontSize: 18, fontWeight: '800', marginTop: 10 },
  successText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  secondaryButton: {
    borderColor: Colors.greenBorder,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  secondaryText: { color: Colors.greenDark, fontSize: 13, fontWeight: '800' },
});
