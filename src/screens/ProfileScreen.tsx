import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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
import { Mail, Phone, ShieldCheck, UserRound } from 'lucide-react-native';
import { profileApi } from '../features/profile/api/profileApi';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage, initials } from '../core/utils/format';
import { Header } from '../shared/ui/Header';
import { StatusBadge } from '../shared/ui/StatusBadge';
import { Colors, Radius, Shadow } from '../theme/colors';

export function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setBio(user?.bio || '');
    setAvatarUrl(user?.avatarUrl || '');
  }, [user]);

  async function handleSave() {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await profileApi.updateMe({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      setUser(response.data);
      setMessage('Profile updated');
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Profile" subtitle="Account and contact details" user={user} onLogoutPress={logout} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user.fullName, user.email)}</Text>
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge value={user.status} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {!!message && <Text style={styles.success}>{message}</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}

          <Field label="Full name" icon={<UserRound color={Colors.textSecondary} size={16} />}>
            <TextInput
              onChangeText={(value) => {
                setFullName(value);
                setError('');
                setMessage('');
              }}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              value={fullName}
            />
          </Field>

          <Field label="Phone" icon={<Phone color={Colors.textSecondary} size={16} />}>
            <TextInput
              keyboardType="phone-pad"
              onChangeText={(value) => {
                setPhone(value);
                setError('');
                setMessage('');
              }}
              placeholder="+84..."
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              value={phone}
            />
          </Field>

          <Field label="Avatar URL" icon={<Mail color={Colors.textSecondary} size={16} />}>
            <TextInput
              autoCapitalize="none"
              keyboardType="url"
              onChangeText={(value) => {
                setAvatarUrl(value);
                setError('');
                setMessage('');
              }}
              placeholder="https://..."
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              value={avatarUrl}
            />
          </Field>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            multiline
            onChangeText={(value) => {
              setBio(value);
              setError('');
              setMessage('');
            }}
            placeholder="A short introduction"
            placeholderTextColor={Colors.textMuted}
            style={styles.bioInput}
            value={bio}
          />

          <TouchableOpacity disabled={saving} onPress={handleSave} style={[styles.primaryBtn, saving && styles.disabled]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save profile</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.roleHeader}>
            <ShieldCheck color={Colors.primary} size={18} />
            <Text style={styles.sectionTitle}>Access</Text>
          </View>
          <Text style={styles.meta}>Roles: {user.roles.map((role) => role.name).join(', ') || 'None'}</Text>
          <Text style={styles.meta}>Permissions: {user.permissions.length}</Text>
          {!!user.studentId && <Text style={styles.meta}>Student ID: {user.studentId}</Text>}
          {!!user.schoolName && <Text style={styles.meta}>School: {user.schoolName}</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <View style={styles.icon}>{icon}</View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  summary: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
    ...Shadow.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.blue100,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginRight: 14,
    width: 56,
  },
  avatarText: { color: Colors.primary, fontSize: 18, fontWeight: '800' },
  summaryText: { flex: 1 },
  name: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  email: { color: Colors.textSecondary, fontSize: 13, marginTop: 3 },
  badgeRow: { marginTop: 8 },
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
  inputRow: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { color: Colors.textPrimary, flex: 1, fontSize: 15 },
  bioInput: {
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 96,
    padding: 12,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    marginTop: 16,
  },
  disabled: { opacity: 0.65 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  success: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    color: Colors.greenDark,
    fontSize: 13,
    marginBottom: 12,
    padding: 10,
  },
  error: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 13,
    marginBottom: 12,
    padding: 10,
  },
  roleHeader: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 8 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  meta: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
