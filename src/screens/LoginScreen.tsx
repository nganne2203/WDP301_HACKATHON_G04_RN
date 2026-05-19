import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
  TouchableWithoutFeedback, Pressable,
} from 'react-native';
import { Trophy, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  function validate() {
    let ok = true;
    setEmailError(''); setPasswordError('');
    if (!email.trim()) { setEmailError('Please enter your email'); ok = false; }
    else if (!email.includes('@')) { setEmailError('Please enter a valid email'); ok = false; }
    if (!password) { setPasswordError('Please enter your password'); ok = false; }
    else if (password.length < 8) { setPasswordError('Password must be at least 8 characters'); ok = false; }
    return ok;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    navigation.replace('Main');
  }

  function handleForgotSubmit() {
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
  }

  function closeForgot() {
    setForgotVisible(false);
    setForgotEmail('');
    setForgotSent(false);
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="always"
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoBox}><Trophy color="#fff" size={36} /></View>
          <Text style={s.title}>Welcome to SEAL</Text>
          <Text style={s.subtitle}>Hackathon Lifecycle Management Platform</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign in</Text>
          <Text style={s.cardSub}>Enter your credentials to access your account</Text>
          <View style={s.gap20} />

          <Text style={s.label}>Email</Text>
          <View style={[s.inputRow, !!emailError && s.inputErr]}>
            <Mail color={Colors.textSecondary} size={16} style={s.icon} />
            <TextInput
              style={s.input} placeholder="you@university.edu"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address" autoCapitalize="none"
              value={email} onChangeText={t => { setEmail(t); setEmailError(''); }}
            />
          </View>
          {!!emailError && <Text style={s.errText}>{emailError}</Text>}

          <View style={s.gap14} />

          <View style={s.labelRow}>
            <Text style={s.label}>Password</Text>
            <TouchableOpacity onPress={() => setForgotVisible(true)}>
              <Text style={s.link}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.inputRow, !!passwordError && s.inputErr]}>
            <Lock color={Colors.textSecondary} size={16} style={s.icon} />
            <TextInput
              style={[s.input, s.flex]} placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              value={password} onChangeText={t => { setPassword(t); setPasswordError(''); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff color={Colors.textSecondary} size={18} style={s.icon} /> : <Eye color={Colors.textSecondary} size={18} style={s.icon} />}
            </TouchableOpacity>
          </View>
          {!!passwordError && <Text style={s.errText}>{passwordError}</Text>}

          <View style={s.gap20} />

          <TouchableOpacity style={[s.primaryBtn, isLoading && s.btnDisabled]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Sign in</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerLabel}>Demo Accounts</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Demo box */}
          <View style={s.demoBox}>
            <Text style={s.demoTitle}>Quick login (Participant)</Text>
            <Text style={s.demoEmail}>participant@university.edu</Text>
            <Text style={s.demoHint}>Password: any 8+ characters</Text>
            <TouchableOpacity style={[s.outlineBtn, { marginTop: 10 }]}
              onPress={() => { setEmail('participant@university.edu'); setPassword('password123'); }}>
              <Text style={s.outlineBtnText}>Fill Credentials</Text>
            </TouchableOpacity>
          </View>

          <View style={s.signupRow}>
            <Text style={s.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footer}>By continuing, you agree to SEAL's Terms of Service and Privacy Policy</Text>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={forgotVisible} transparent animationType="fade" onRequestClose={closeForgot}>
        <TouchableWithoutFeedback onPress={closeForgot}>
          <View style={s.overlay}>
            <Pressable onPress={() => {}} style={s.modalCard}>
              <Text style={s.modalTitle}>Reset Password</Text>
            {forgotSent ? (
              <>
                <View style={s.successBox}>
                  <Text style={s.successText}>
                    Reset link sent to <Text style={{ fontWeight: '700' }}>{forgotEmail}</Text>. Check your inbox.
                  </Text>
                </View>
                <TouchableOpacity style={s.primaryBtn} onPress={closeForgot}>
                  <Text style={s.primaryBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.cardSub}>Enter your email and we'll send you a reset link.</Text>
                <View style={s.gap14} />
                <Text style={s.label}>Email address</Text>
                <View style={s.inputRow}>
                  <Mail color={Colors.textSecondary} size={16} style={s.icon} />
                  <TextInput
                    style={[s.input, s.flex]} placeholder="you@university.edu"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address" autoCapitalize="none"
                    value={forgotEmail} onChangeText={setForgotEmail}
                    onSubmitEditing={handleForgotSubmit}
                  />
                </View>
                <View style={s.gap14} />
                <View style={s.modalBtnRow}>
                  <TouchableOpacity style={[s.outlineBtn, s.flex]} onPress={closeForgot}>
                    <Text style={s.outlineBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={{ width: 10 }} />
                  <TouchableOpacity style={[s.primaryBtn, s.flex]} onPress={handleForgotSubmit}>
                    <Text style={s.primaryBtnText}>Send Link</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  gap14: { height: 14 },
  gap20: { height: 20 },

  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...Shadow.lg },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: 24, ...Shadow.md },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },

  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 6 },
  link: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface, paddingHorizontal: 12, height: 48 },
  inputErr: { borderColor: Colors.red },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  errText: { fontSize: 12, color: Colors.red, marginTop: 4 },

  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { fontSize: 12, color: Colors.textSecondary, marginHorizontal: 10 },

  demoBox: { backgroundColor: Colors.gray50, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 20 },
  demoTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  demoEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  demoHint: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  outlineBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },

  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { fontSize: 14, color: Colors.textSecondary },

  footer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 20 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 24, width: '100%', ...Shadow.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  modalBtnRow: { flexDirection: 'row' },

  successBox: { backgroundColor: Colors.greenLight, borderWidth: 1, borderColor: Colors.greenBorder, borderRadius: Radius.md, padding: 14, marginBottom: 16 },
  successText: { fontSize: 13, color: Colors.greenDark, lineHeight: 19 },
});
