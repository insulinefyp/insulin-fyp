import { StyleSheet, Text, View } from 'react-native';
import FormField from '../../../components/FormField';
import SegmentedControl from '../../../components/SegmentedControl';
import { buildDateOfBirth, calculateAge } from '../../../utils/validation';

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

export default function StepAbout({ data, errors, onChange }) {
  const iso = buildDateOfBirth(data);
  const age = calculateAge(iso);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>About you</Text>
      <Text style={styles.sub}>
        Weight is used in dose calculations, so please enter it accurately.
      </Text>

      <View style={styles.dobGroup}>
        <Text style={styles.label}>Date of birth</Text>
        <View style={styles.dobRow}>
          <View style={styles.dobPart}>
            <FormField
              label="Day"
              value={data.dobDay}
              onChangeText={(v) => onChange('dobDay', v.replace(/\D/g, ''))}
              placeholder="01"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={styles.dobPart}>
            <FormField
              label="Month"
              value={data.dobMonth}
              onChangeText={(v) => onChange('dobMonth', v.replace(/\D/g, ''))}
              placeholder="01"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={styles.dobPartWide}>
            <FormField
              label="Year"
              value={data.dobYear}
              onChangeText={(v) => onChange('dobYear', v.replace(/\D/g, ''))}
              placeholder="2001"
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>
        {errors.dobDay ? (
          <Text style={styles.error}>{errors.dobDay}</Text>
        ) : age !== null ? (
          <Text style={styles.hint}>Age {age}</Text>
        ) : null}
      </View>

      <SegmentedControl
        label="Sex"
        options={SEX_OPTIONS}
        value={data.sex}
        onChange={(v) => onChange('sex', v)}
        error={errors.sex}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <FormField
            label="Weight (kg)"
            value={data.weightKg}
            onChangeText={(v) => onChange('weightKg', v.replace(/[^\d.]/g, ''))}
            error={errors.weightKg}
            placeholder="70"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.half}>
          <FormField
            label="Height (cm)"
            value={data.heightCm}
            onChangeText={(v) => onChange('heightCm', v.replace(/\D/g, ''))}
            error={errors.heightCm}
            placeholder="170"
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  sub: { fontSize: 14, color: '#666', marginTop: -12 },
  label: { fontSize: 13, fontWeight: '600', color: '#444' },
  dobGroup: { gap: 6 },
  dobRow: { flexDirection: 'row', gap: 10 },
  dobPart: { flex: 1 },
  dobPartWide: { flex: 1.5 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  error: { fontSize: 12, color: '#b3261e' },
  hint: { fontSize: 12, color: '#888' },
});
