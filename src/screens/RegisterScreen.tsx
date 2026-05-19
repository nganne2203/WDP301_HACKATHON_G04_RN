import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { User, Mail, Id, GraduationCap, Lock, Eye, EyeOff, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type StudentType = 'fpt' | 'external';
interface Errors { name?: string; email?: string; studentId?: string; universityName?: string; password?: string; confirmPassword?: string; }

export function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentType, setStudentType] = useState<StudentType>('fpt');
  const [studentId, setStudentId] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function validate() {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Full name must be at least 2 characters';
    if (!email.includes('@')) e.email = 'Please enter a valid email';
    if (!studentId.trim()) e.studentId = 'Please enter your student ID';
    if (studentType === 'external' && !universityName.trim()) e.universityName = 'Please enter your university name';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) e.password = 'Must contain at least one uppercase letter';
    else if (!/[0-9]/.test(password)) e.password = 'Must contain at least one number';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    navigation.replace('Login');
  }

  const clr = (key: keyof Errors) => setErrors(e => ({ ...e, [key]: undefined }));

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back to Sign in</Text>
        </TouchableOpacity>

        <View style={s.logoWrap}>
          <View style={s.logoBox}><Trophy color="#fff" size={32} /></View>
          <Text style={s.title}>Đăng ký SEAL</Text>
          <Text style={s.subtitle}>Tạo tài khoản để tham gia Hackathon</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Tạo tài khoản</Text>
          <Text style={s.cardSub}>Điền thông tin để đăng ký tham gia Hackathon</Text>
          <View style={{ height: 20 }} />

          {/* Name */}
          <Field label="Họ và tên" error={errors.name}>
            <Row icon={<User color={Colors.textSecondary} size={16} />} error={!!errors.name}>
              <TextInput style={s.input} placeholder="Nguyễn Văn A" placeholderTextColor={Colors.textMuted}
                value={name} onChangeText={t => { setName(t); clr('name'); }} />
            </Row>
          </Field>

          {/* Email */}
          <Field label="Email" error={errors.email}>
            <Row icon={<Mail color={Colors.textSecondary} size={16} />} error={!!errors.email}>
              <TextInput style={s.input} placeholder="email@example.com" placeholderTextColor={Colors.textMuted}
                keyboardType="email-address" autoCapitalize="none"
                value={email} onChangeText={t => { setEmail(t); clr('email'); }} />
            </Row>
          </Field>

          {/* Student type */}
          <Text style={s.label}>Loại sinh viên</Text>
          <View style={s.radioGroup}>
            {(['fpt', 'external'] as StudentType[]).map(type => (
              <TouchableOpacity key={type} style={[s.radioOption, studentType === type && s.radioSelected]}
                onPress={() => setStudentType(type)} activeOpacity={0.75}>
                <View style={[s.radioCircle, studentType === type && s.radioCircleOn]}>
                  {studentType === type && <View style={s.radioDot} />}
                </View>
                <Text style={[s.radioLabel, studentType === type && s.radioLabelOn]}>
                  {type === 'fpt' ? 'Sinh viên FPT' : 'Sinh viên ngoài trường'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Student ID */}
          <Field label={studentType === 'fpt' ? 'Mã số sinh viên FPT' : 'Mã số sinh viên'} error={errors.studentId}>
            <Row icon={<Id color={Colors.textSecondary} size={16} />} error={!!errors.studentId}>
              <TextInput style={s.input}
                placeholder={studentType === 'fpt' ? 'SE123456' : 'Nhập mã số sinh viên'}
                placeholderTextColor={Colors.textMuted} autoCapitalize="characters"
                value={studentId} onChangeText={t => { setStudentId(t); clr('studentId'); }} />
            </Row>
          </Field>

          {/* University (external only) */}
          {studentType === 'external' && (
            <Field label="Tên trường" error={errors.universityName}>
              <Row icon={<GraduationCap color={Colors.textSecondary} size={16} />} error={!!errors.universityName}>
                <TextInput style={s.input} placeholder="Đại học Bách Khoa, UIT, ..."
                  placeholderTextColor={Colors.textMuted}
                  value={universityName} onChangeText={t => { setUniversityName(t); clr('universityName'); }} />
              </Row>
            </Field>
          )}

          {/* Password */}
          <Field label="Mật khẩu" error={errors.password}>
            <Row icon={<Lock color={Colors.textSecondary} size={16} />} error={!!errors.password}>
              <TextInput style={[s.input, s.flex]} placeholder="Tạo mật khẩu mạnh"
                placeholderTextColor={Colors.textMuted} secureTextEntry={!showPw}
                value={password} onChangeText={t => { setPassword(t); clr('password'); }} />
              <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff color={Colors.textSecondary} size={18} style={s.eyeIcon} /> : <Eye color={Colors.textSecondary} size={18} style={s.eyeIcon} />}
              </TouchableOpacity>
            </Row>
          </Field>

          {/* Confirm password */}
          <Field label="Xác nhận mật khẩu" error={errors.confirmPassword}>
            <Row icon={<Lock color={Colors.textSecondary} size={16} />} error={!!errors.confirmPassword}>
              <TextInput style={[s.input, s.flex]} placeholder="Nhập lại mật khẩu"
                placeholderTextColor={Colors.textMuted} secureTextEntry={!showCpw}
                value={confirmPassword} onChangeText={t => { setConfirmPassword(t); clr('confirmPassword'); }} />
              <TouchableOpacity onPress={() => setShowCpw(v => !v)}>
                {showCpw ? <EyeOff color={Colors.textSecondary} size={18} style={s.eyeIcon} /> : <Eye color={Colors.textSecondary} size={18} style={s.eyeIcon} />}
              </TouchableOpacity>
            </Row>
          </Field>

          {/* Notice */}
          <View style={s.noticeBox}>
            <Text style={s.noticeText}>
              <Text style={{ fontWeight: '700' }}>Lưu ý: </Text>
              Tài khoản của bạn cần được Ban tổ chức phê duyệt trước khi có thể tham gia Hackathon.
            </Text>
          </View>

          <View style={{ height: 8 }} />

          <TouchableOpacity style={[s.primaryBtn, isLoading && s.btnDisabled]} onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Đăng ký</Text>}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
          <View style={s.signupRow}>
            <Text style={s.mutedText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.link}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footer}>
          Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của SEAL
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fs.label}>{label}</Text>
      {children}
      {!!error && <Text style={fs.err}>{error}</Text>}
    </View>
  );
}
function Row({ icon, error, children }: { icon: React.ReactNode; error?: boolean; children: React.ReactNode }) {
  return (
    <View style={[fs.row, error && fs.rowErr]}>
      <View style={{ marginRight: 8 }}>{icon}</View>
      {children}
    </View>
  );
}
const fs = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface, paddingHorizontal: 12, height: 48 },
  rowErr: { borderColor: Colors.red },
  icon: { fontSize: 16, marginRight: 8 },
  err: { fontSize: 12, color: Colors.red, marginTop: 4 },
});

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...Shadow.lg },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: 24, ...Shadow.md },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  eyeIcon: { fontSize: 18, padding: 4 },
  radioGroup: { gap: 8, marginBottom: 14 },
  radioOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md },
  radioSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioCircleOn: { borderColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  radioLabel: { fontSize: 14, color: Colors.textPrimary },
  radioLabelOn: { color: Colors.primary, fontWeight: '500' },
  noticeBox: { backgroundColor: Colors.blue50, borderWidth: 1, borderColor: Colors.blue100, borderRadius: Radius.md, padding: 12, marginBottom: 16 },
  noticeText: { fontSize: 13, color: Colors.blue700, lineHeight: 19 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  mutedText: { fontSize: 14, color: Colors.textSecondary },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  footer: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 20 },
});
