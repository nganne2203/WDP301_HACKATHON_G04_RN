import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '../../theme/colors';

const toneMap: Record<string, { bg: string; fg: string }> = {
  DRAFT: { bg: Colors.gray100, fg: Colors.textSecondary },
  OPEN_REGISTRATION: { bg: Colors.blue100, fg: Colors.blue700 },
  ONGOING: { bg: Colors.greenLight, fg: Colors.greenDark },
  SCORING: { bg: '#FEF3C7', fg: '#92400E' },
  COMPLETED: { bg: Colors.greenLight, fg: Colors.greenDark },
  ARCHIVED: { bg: Colors.gray100, fg: Colors.textMuted },
  SCHEDULED: { bg: Colors.blue50, fg: Colors.blue700 },
  LIVE: { bg: Colors.greenLight, fg: Colors.greenDark },
  CANCELLED: { bg: Colors.redLight, fg: Colors.red },
  UNREAD: { bg: Colors.blue100, fg: Colors.blue700 },
  READ: { bg: Colors.gray100, fg: Colors.textMuted },
  ASSIGNED: { bg: Colors.blue100, fg: Colors.blue700 },
  READY: { bg: Colors.greenLight, fg: Colors.greenDark },
  NO_SUBMISSION: { bg: Colors.redLight, fg: Colors.red },
  SUBMITTED: { bg: Colors.greenLight, fg: Colors.greenDark },
  LOCKED: { bg: Colors.gray100, fg: Colors.textSecondary },
  FINALIST: { bg: Colors.greenLight, fg: Colors.greenDark },
};

export function StatusBadge({ value }: { value: string }) {
  const tone = toneMap[value] || { bg: Colors.gray100, fg: Colors.textSecondary };

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{value.replaceAll('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});
