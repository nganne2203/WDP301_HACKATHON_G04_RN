import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { MediaStatus, MediaType } from '../../../core/api/types';
import { Colors, Radius } from '../../../theme/colors';

type FilterValue = 'ALL' | MediaType | MediaStatus;

export function MediaTypeFilter({
  options,
  selected,
  onSelect,
}: {
  options: FilterValue[];
  selected: FilterValue;
  onSelect: (value: FilterValue) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => onSelect(option)}
          style={[styles.chip, selected === option && styles.chipOn]}
        >
          <Text style={[styles.text, selected === option && styles.textOn]}>{option.replaceAll('_', ' ')}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 12 },
  chip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  text: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800' },
  textOn: { color: '#fff' },
});
