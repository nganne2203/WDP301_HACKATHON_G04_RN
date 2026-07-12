import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Eye, EyeOff, GitBranch, GraduationCap, IdCard, Lock, Mail, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage } from '../core/utils/format';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type StudentType = 'FPT' | 'EXTERNAL';

interface Errors {
  fullName?: string;
  email?: string;
  githubUsername?: string;
  studentId?: string;
  schoolName?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [studentType, setStudentType] = useState<StudentType>('FPT');
  const [studentId, setStudentId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function validate() {
    const next: Errors = {};
    const githubUsernamePattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
    if (fullName.trim().length < 2) next.fullName = 'Full name must be at least 2 characters';
    if (!email.includes('@')) next.email = 'Please enter a valid email';
    if (!githubUsername.trim()) {
      next.githubUsername = 'Please enter your GitHub username';
    } else if (githubUsername.trim().length > 39 || !githubUsernamePattern.test(githubUsername.trim())) {
      next.githubUsername = 'GitHub username can only contain letters, numbers, and hyphens';
    }
    if (!studentId.trim()) next.studentId = 'Please enter your student ID';
    if (studentType === 'EXTERNAL' && !schoolName.trim()) next.schoolName = 'Please enter your school name';
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsLoading(true);
    setFormError('');
    setSuccess('');

    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        githubUsername: githubUsername.trim(),
        studentType,
        studentId: studentId.trim(),
        schoolName: studentType === 'EXTERNAL' ? schoolName.trim() : undefined,
      });
      setSuccess('Registration submitted. Your account must be approved before sign in.');
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function clear(key: keyof Errors) {
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
    setSuccess('');
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Back to sign in</Text>
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <View style={styles.logoBox}><Image source={require('../../assets/brand/Logo1.png')} style={styles.logoImage} /></View>
          <Text style={styles.title}>Create SEAL Account</Text>
          <Text style={styles.subtitle}>Register for hackathon participation</Text>
        </View>

        <View style={styles.card}>
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
          {!!success && <Text style={styles.successText}>{success}</Text>}

          <Field label="Full name" error={errors.fullName}>
            <InputRow icon={<User color={Colors.textSecondary} size={16} />} error={!!errors.fullName}>
              <TextInput
                onChangeText={(value) => {
                  setFullName(value);
                  clear('fullName');
                }}
                placeholder="Nguyen Van A"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={fullName}
              />
            </InputRow>
          </Field>

          <Field label="Email" error={errors.email}>
            <InputRow icon={<Mail color={Colors.textSecondary} size={16} />} error={!!errors.email}>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(value) => {
                  setEmail(value);
                  clear('email');
                }}
                placeholder="email@example.com"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={email}
              />
            </InputRow>
          </Field>

          <Field label="GitHub Username" error={errors.githubUsername}>
            <InputRow icon={<GitBranch color={Colors.textSecondary} size={16} />} error={!!errors.githubUsername}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  setGithubUsername(value);
                  clear('githubUsername');
                }}
                placeholder="github-user"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={githubUsername}
              />
            </InputRow>
          </Field>

          <Text style={styles.label}>Student type</Text>
          <View style={styles.segment}>
            {(['FPT', 'EXTERNAL'] as StudentType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setStudentType(type)}
                style={[styles.segmentOption, studentType === type && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, studentType === type && styles.segmentTextOn]}>
                  {type === 'FPT' ? 'FPT' : 'External'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Student ID" error={errors.studentId}>
            <InputRow icon={<IdCard color={Colors.textSecondary} size={16} />} error={!!errors.studentId}>
              <TextInput
                autoCapitalize="characters"
                onChangeText={(value) => {
                  setStudentId(value);
                  clear('studentId');
                }}
                placeholder="SE123456"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={studentId}
              />
            </InputRow>
          </Field>

          {studentType === 'EXTERNAL' && (
            <Field label="School name" error={errors.schoolName}>
              <InputRow icon={<GraduationCap color={Colors.textSecondary} size={16} />} error={!!errors.schoolName}>
                <TextInput
                  onChangeText={(value) => {
                    setSchoolName(value);
                    clear('schoolName');
                  }}
                  placeholder="University name"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  value={schoolName}
                />
              </InputRow>
            </Field>
          )}

          <Field label="Password" error={errors.password}>
            <InputRow icon={<Lock color={Colors.textSecondary} size={16} />} error={!!errors.password}>
              <TextInput
                onChangeText={(value) => {
                  setPassword(value);
                  clear('password');
                }}
                placeholder="At least 8 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
              />
              <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff color={Colors.textSecondary} size={18} /> : <Eye color={Colors.textSecondary} size={18} />}
              </TouchableOpacity>
            </InputRow>
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword}>
            <InputRow icon={<Lock color={Colors.textSecondary} size={16} />} error={!!errors.confirmPassword}>
              <TextInput
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  clear('confirmPassword');
                }}
                placeholder="Repeat password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showConfirm}
                style={styles.input}
                value={confirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm((value) => !value)}>
                {showConfirm ? <EyeOff color={Colors.textSecondary} size={18} /> : <Eye color={Colors.textSecondary} size={18} />}
              </TouchableOpacity>
            </InputRow>
          </Field>

          <TouchableOpacity
            disabled={isLoading || Boolean(success)}
            onPress={handleRegister}
            style={[styles.primaryBtn, (isLoading || Boolean(success)) && styles.btnDisabled]}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Register</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!error && <Text style={styles.errText}>{error}</Text>}
    </View>
  );
}

function InputRow({ icon, error, children }: { icon: ReactNode; error?: boolean; children: ReactNode }) {
  return (
    <View style={[styles.inputRow, error && styles.inputErr]}>
      <View style={styles.inputIcon}>{icon}</View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { backgroundColor: Colors.background, flexGrow: 1, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 24,
    height: 96,
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    width: 96,
    ...Shadow.lg,
  },
  logoImage: { height: 96, transform: [{ scale: 1.45 }], width: 96 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    ...Shadow.md,
  },
  field: { marginBottom: 14 },
  label: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 12,
  },
  inputErr: { borderColor: Colors.red },
  inputIcon: { marginRight: 8 },
  input: { color: Colors.textPrimary, flex: 1, fontSize: 15 },
  errText: { color: Colors.red, fontSize: 12, marginTop: 4 },
  formError: {
    backgroundColor: Colors.redLight,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    padding: 12,
  },
  successText: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenBorder,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.greenDark,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    padding: 12,
  },
  segment: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 4,
  },
  segmentOption: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    flex: 1,
    paddingVertical: 10,
  },
  segmentOn: { backgroundColor: Colors.surface, ...Shadow.sm },
  segmentText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },
  segmentTextOn: { color: Colors.primary },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
