import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SegmentedControl({
  label,
  options,
  value,
  onChange,
  error,
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onChange(opt.value)}
            >
              <Text
                style={[styles.optionText, selected && styles.optionTextSelected]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#444' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  option: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  optionSelected: { borderColor: '#1b5fbf', backgroundColor: '#eaf1fb' },
  optionText: { fontSize: 14, color: '#444' },
  optionTextSelected: { color: '#1b5fbf', fontWeight: '600' },
  error: { fontSize: 12, color: '#b3261e' },
});
