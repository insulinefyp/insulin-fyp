import { StyleSheet, Text, View } from 'react-native';
import FormField from '../../../components/FormField';
import SegmentedControl from '../../../components/SegmentedControl';

const TYPE_OPTIONS = [
  { value: 'type1', label: 'Type 1' },
  { value: 'type2_insulin_dependent', label: 'Type 2 (insulin-dependent)' },
];

export default function StepDiabetes({ data, errors, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Diabetes</Text>
      <Text style={styles.sub}>
        This prototype supports insulin-dependent diabetes only.
      </Text>

      <SegmentedControl
        label="Diabetes type"
        options={TYPE_OPTIONS}
        value={data.diabetesType}
        onChange={(v) => onChange('diabetesType', v)}
        error={errors.diabetesType}
      />

      <FormField
        label="Year of diagnosis"
        value={data.diagnosisYear}
        onChangeText={(v) => onChange('diagnosisYear', v.replace(/\D/g, ''))}
        error={errors.diagnosisYear}
        placeholder="2015"
        keyboardType="number-pad"
        maxLength={4}
      />

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Insulin dosing parameters are set separately and are not part of
          registration.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  sub: { fontSize: 14, color: '#666', marginTop: -12 },
  notice: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  noticeText: { fontSize: 12, color: '#666', lineHeight: 18 },
});
