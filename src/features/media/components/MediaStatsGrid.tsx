import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '../../../theme/colors';

export function MediaStatsGrid({ items }: { items: Array<{ label: string; value: number | string }> }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View style={styles.stat} key={item.label}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: '30%',
    padding: 12,
  },
  value: { color: Colors.textPrimary, fontSize: 19, fontWeight: '800' },
  label: { color: Colors.textSecondary, fontSize: 11, marginTop: 3 },
});
