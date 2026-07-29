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
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  function validate() {
    setEmailError('');
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return false;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    return true;
  }

  function handleResetSubmit() {
    if (!validate()) return;
    setIsLoading(true);
    // Simulate API call to send email reset link
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { top: insets.top + 16 }]}
        >
          <ArrowLeft color={Colors.textPrimary} size={22} />
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Image source={require('../../assets/brand/Logo1.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Welcome to SEAL</Text>
          <Text style={styles.subtitle}>Hackathon lifecycle management</Text>
        </View>

        <View style={styles.card}>
          {isSent ? (
            <View style={styles.sentWrap}>
              <CheckCircle2 color={Colors.green || '#10B981'} size={48} style={styles.sentIcon} />
              <Text style={styles.cardTitle}>Reset Link Sent</Text>
              <Text style={styles.sentText}>
                We have sent a password reset link to <Text style={styles.emailHighlight}>{email.trim()}</Text>.
                Please check your email and follow the instructions to reset your password.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Login')}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.cardTitle}>Reset Password</Text>
              <Text style={styles.cardSub}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputRow, !!emailError && styles.inputErr]}>
                <Mail color={Colors.textSecondary} size={16} style={styles.icon} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={(value) => {
                    setEmail(value);
                    setEmailError('');
                  }}
                  placeholder="you@university.edu"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  value={email}
                />
              </View>
              {!!emailError && <Text style={styles.errText}>{emailError}</Text>}

              <View style={styles.gap24} />
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={handleResetSubmit}
                style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Login')}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { backgroundColor: Colors.background, flexGrow: 1, paddingHorizontal: 20 },
  backBtn: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    left: 20,
    position: 'absolute',
    width: 40,
    zIndex: 10,
    ...Shadow.sm,
  },
  gap24: { height: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 28, marginTop: 48 },
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
  cardTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20, marginTop: 6, textAlign: 'center', lineHeight: 18 },
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
  icon: { marginRight: 8 },
  input: { color: Colors.textPrimary, flex: 1, fontSize: 15 },
  errText: { color: Colors.red, fontSize: 12, marginTop: 4 },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 50,
    justifyContent: 'center',
    width: '100%',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cancelBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  sentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  sentIcon: {
    marginBottom: 16,
  },
  sentText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  emailHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
