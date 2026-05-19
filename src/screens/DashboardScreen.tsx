import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors, Radius, Shadow } from '../theme/colors';
import { registrationSteps, timeline, uploadMeta, myTeam, SubmissionKey } from '../data/mockData';
import { TabParamList } from '../navigation/AppNavigator';

type Nav = BottomTabNavigationProp<TabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [uploadType, setUploadType] = useState<SubmissionKey | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState<Record<SubmissionKey, boolean>>({ demo: false, report: false, slides: false });
  const [submittedValues, setSubmittedValues] = useState<Record<SubmissionKey, string>>({ demo: '', report: '', slides: '' });

  const doneCount = 1 + Object.values(submitted).filter(Boolean).length;
  const progress = Math.round((doneCount / 4) * 100);

  function handleSubmitUpload() {
    if (!uploadType || !inputValue.trim()) return;
    setSubmitted(p => ({ ...p, [uploadType]: true }));
    setSubmittedValues(p => ({ ...p, [uploadType]: inputValue.trim() }));
    setUploadType(null);
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Dashboard</Text>
          <Text style={s.headerSub}>Track your hackathon journey</Text>
        </View>
        <View style={s.avatar}><Text style={s.avatarText}>AC</Text></View>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Deadline alert */}
        <View style={s.alert}>
          <Text style={s.alertIcon}>⏰</Text>
          <View style={s.flex}>
            <Text style={s.alertTitle}>Upcoming Deadline</Text>
            <Text style={s.alertBody}>Final submission: May 28, 2026 at 11:59 PM</Text>
          </View>
        </View>

        {/* Registration Status */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Registration Status</Text>
          <View style={{ height: 12 }} />
          {registrationSteps.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={[s.stepDot, step.done && s.stepDotDone]}>
                {step.done && <Text style={s.checkMark}>✓</Text>}
              </View>
              <View style={s.flex}>
                <Text style={s.stepLabel}>{step.label}</Text>
                <Text style={s.stepDetail}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* My Team */}
        <View style={s.card}>
          <Text style={s.cardTitle}>My Team</Text>
          <View style={{ height: 12 }} />
          <View style={s.teamRow}>
            <Text style={s.teamName}>{myTeam.name}</Text>
            <View style={s.badge}><Text style={s.badgeText}>Team Leader</Text></View>
          </View>
          <Text style={s.teamTrack}>{myTeam.track}</Text>
          <View style={{ height: 10 }} />
          <View style={s.infoRow}><Text style={s.infoIcon}>👥</Text><Text style={s.infoText}>{myTeam.memberCount} Members</Text></View>
          <View style={s.infoRow}><Text style={s.infoIcon}>🐙</Text><Text style={s.infoLink} numberOfLines={1}>{myTeam.repo}</Text></View>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={s.outlineBtn} onPress={() => navigation.navigate('Team')} activeOpacity={0.75}>
            <Text style={s.outlineBtnText}>Manage Team</Text>
          </TouchableOpacity>
        </View>

        {/* Event Timeline */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Event Timeline</Text>
          <View style={{ height: 12 }} />
          {timeline.map((item, i) => (
            <View key={i} style={s.tlRow}>
              <View style={s.tlLeft}>
                {item.status === 'completed'
                  ? <View style={[s.tlDot, s.tlDotDone]}><Text style={s.checkSmall}>✓</Text></View>
                  : item.status === 'active'
                  ? <View style={[s.tlDot, s.tlDotActive]} />
                  : <View style={[s.tlDot, s.tlDotPending]} />}
                {i < timeline.length - 1 && (
                  <View style={[s.tlLine, item.status === 'completed' ? s.tlLineDone : s.tlLinePending]} />
                )}
              </View>
              <View style={[s.flex, { paddingBottom: 16 }]}>
                <View style={s.tlTitleRow}>
                  <Text style={[s.tlTitle, item.status === 'active' && s.tlTitleActive]}>{item.title}</Text>
                  {item.status === 'active' && <View style={s.pill}><Text style={s.pillText}>In Progress</Text></View>}
                </View>
                <Text style={s.tlDate}>📅 {item.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Submission Status */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Submission Status</Text>
          <View style={{ height: 10 }} />
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Progress</Text>
            <Text style={s.progressValue}>{progress}%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <View style={{ height: 14 }} />

          <SubItem label="Repository Link" done value="github.com/seal-2026/code-wizards" isLink />
          <SubItem label="Demo URL" done={submitted.demo} value={submittedValues.demo} isLink
            onUpload={() => { setUploadType('demo'); setInputValue(''); }} uploadLabel="Upload Demo Link" />
          <SubItem label="Project Report" done={submitted.report} value={submittedValues.report}
            onUpload={() => { setUploadType('report'); setInputValue(''); }} uploadLabel="Upload Report" />
          <SubItem label="Presentation Slides" done={submitted.slides} value={submittedValues.slides}
            onUpload={() => { setUploadType('slides'); setInputValue(''); }} uploadLabel="Upload Slides" />
        </View>
      </ScrollView>

      {/* Upload Bottom Sheet */}
      <Modal visible={!!uploadType} transparent animationType="slide" onRequestClose={() => setUploadType(null)}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setUploadType(null)}>
            <TouchableOpacity activeOpacity={1} style={s.sheet}>
              <View style={s.sheetHandle} />
              {uploadType && (
                <>
                  <Text style={s.sheetTitle}>{uploadMeta[uploadType].label}</Text>
                  <Text style={s.sheetSub}>
                    {uploadMeta[uploadType].isUrl ? 'Enter the URL for your live demo.' : 'Enter the filename or paste a link.'}
                  </Text>
                  <View style={{ height: 16 }} />
                  <Text style={s.inputLabel}>{uploadMeta[uploadType].isUrl ? 'URL' : 'File name / link'}</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={s.textInput}
                      placeholder={uploadMeta[uploadType].placeholder}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType={uploadMeta[uploadType].isUrl ? 'url' : 'default'}
                      autoCapitalize="none" autoFocus
                      value={inputValue} onChangeText={setInputValue}
                    />
                  </View>
                  <View style={{ height: 16 }} />
                  <View style={s.sheetBtnRow}>
                    <TouchableOpacity style={[s.outlineBtn, s.flex]} onPress={() => setUploadType(null)}>
                      <Text style={s.outlineBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <View style={{ width: 10 }} />
                    <TouchableOpacity
                      style={[s.primaryBtn, s.flex, !inputValue.trim() && s.btnDisabled]}
                      onPress={handleSubmitUpload} disabled={!inputValue.trim()}>
                      <Text style={s.primaryBtnText}>⬆ Submit</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SubItem({ label, done, value, isLink, onUpload, uploadLabel }:
  { label: string; done: boolean; value?: string; isLink?: boolean; onUpload?: () => void; uploadLabel?: string }) {
  return (
    <View style={ss.row}>
      <View style={ss.top}>
        <Text style={ss.label}>{label}</Text>
        <Text style={{ fontSize: 18 }}>{done ? '✅' : '⭕'}</Text>
      </View>
      {done && value
        ? <Text style={[ss.value, isLink && ss.link]} numberOfLines={1}>{value}</Text>
        : onUpload && (
          <TouchableOpacity onPress={onUpload} activeOpacity={0.75}>
            <Text style={ss.uploadText}>⬆ {uploadLabel}</Text>
          </TouchableOpacity>
        )}
    </View>
  );
}
const ss = StyleSheet.create({
  row: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  value: { fontSize: 13, color: Colors.textSecondary },
  link: { color: Colors.primary },
  uploadText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
});

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.blue100, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  scroll: { padding: 16, gap: 14 },

  alert: { flexDirection: 'row', backgroundColor: Colors.blue50, borderWidth: 1, borderColor: Colors.blue100, borderRadius: Radius.lg, padding: 14 },
  alertIcon: { fontSize: 18, marginRight: 10 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: Colors.blue700 },
  alertBody: { fontSize: 13, color: Colors.blue700, marginTop: 2 },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 16, ...Shadow.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1 },
  stepDotDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  stepDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  teamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  badge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  teamTrack: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoIcon: { fontSize: 14, marginRight: 8 },
  infoText: { fontSize: 14, color: Colors.textPrimary },
  infoLink: { fontSize: 13, color: Colors.primary, flex: 1 },
  outlineBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  tlRow: { flexDirection: 'row' },
  tlLeft: { alignItems: 'center', width: 28, marginRight: 12 },
  tlDot: { width: 20, height: 20, borderRadius: 10 },
  tlDotDone: { backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' },
  tlDotActive: { borderWidth: 3, borderColor: Colors.primary, backgroundColor: Colors.blue100 },
  tlDotPending: { borderWidth: 2, borderColor: Colors.gray300, backgroundColor: Colors.surface },
  checkSmall: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tlLine: { width: 2, flex: 1, marginTop: 2, marginBottom: 2, minHeight: 16 },
  tlLineDone: { backgroundColor: Colors.green },
  tlLinePending: { backgroundColor: Colors.gray200 },
  tlTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tlTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  tlTitleActive: { color: Colors.primary, fontWeight: '600' },
  tlDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pill: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 10, color: '#fff', fontWeight: '600' },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  progressValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  progressTrack: { height: 6, backgroundColor: Colors.gray200, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },

  inputLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 6 },
  inputWrap: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface, paddingHorizontal: 14, height: 48, justifyContent: 'center' },
  textInput: { fontSize: 15, color: Colors.textPrimary },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 48, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, ...Shadow.lg },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sheetSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  sheetBtnRow: { flexDirection: 'row' },
});
