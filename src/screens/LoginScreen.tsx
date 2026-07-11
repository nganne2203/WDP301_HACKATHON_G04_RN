import { useState } from 'react';
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
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../core/session/AuthContext';
import { errorMessage } from '../core/utils/format';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  function validate() {
    let ok = true;
    setFormError('');
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Please enter your email');
      ok = false;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid email');
      ok = false;
    }

    if (!password) {
      setPasswordError('Please enter your password');
      ok = false;
    }

    return ok;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Image source={require('../../assets/brand/Logo1.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Welcome to SEAL</Text>
          <Text style={styles.subtitle}>Hackathon lifecycle management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardSub}>Use your approved SEAL account to continue.</Text>

          {!!formError && <Text style={styles.formError}>{formError}</Text>}

          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputRow, !!emailError && styles.inputErr]}>
            <Mail color={Colors.textSecondary} size={16} style={styles.icon} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setEmailError('');
                setFormError('');
              }}
              placeholder="you@university.edu"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              value={email}
            />
          </View>
          {!!emailError && <Text style={styles.errText}>{emailError}</Text>}

          <View style={styles.gap14} />
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputRow, !!passwordError && styles.inputErr]}>
            <Lock color={Colors.textSecondary} size={16} style={styles.icon} />
            <TextInput
              onChangeText={(value) => {
                setPassword(value);
                setPasswordError('');
                setFormError('');
              }}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
            />
            <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
              {showPassword
                ? <EyeOff color={Colors.textSecondary} size={18} />
                : <Eye color={Colors.textSecondary} size={18} />}
            </TouchableOpacity>
          </View>
          {!!passwordError && <Text style={styles.errText}>{passwordError}</Text>}

          <View style={styles.gap20} />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isLoading}
            onPress={handleLogin}
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign in</Text>}
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Need an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { backgroundColor: Colors.background, flexGrow: 1, paddingHorizontal: 20 },
  gap14: { height: 14 },
  gap20: { height: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 24,
    height: 96,
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    width: 96,
    ...Shadow.lg,
  },
  logoImage: { height: 96, transform: [{ scale: 1.45 }], width: 96 },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    ...Shadow.md,
  },
  cardTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20, marginTop: 4 },
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  forgotLink: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
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
  icon: { marginRight: 8 },
  input: { color: Colors.textPrimary, flex: 1, fontSize: 15 },
  errText: { color: Colors.red, fontSize: 12, marginTop: 4 },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 50,
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { color: Colors.textSecondary, fontSize: 14 },
  link: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
