import { StyleSheet, Text, View } from 'react-native';
import FormField from '../../../components/FormField';
import SegmentedControl from '../../../components/SegmentedControl';

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

export default function StepEmergency({ data, errors, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Emergency contact</Text>
      <Text style={styles.sub}>
        Someone to reach if a severe glucose event is detected.
      </Text>

      <FormField
        label="Contact name"
        value={data.emergencyName}
        onChangeText={(v) => onChange('emergencyName', v)}
        error={errors.emergencyName}
        placeholder="Full name"
        autoCapitalize="words"
      />

      <FormField
        label="Phone number"
        value={data.emergencyPhone}
        onChangeText={(v) => onChange('emergencyPhone', v)}
        error={errors.emergencyPhone}
        placeholder="+92 300 0000000"
        keyboardType="phone-pad"
      />

      <SegmentedControl
        label="Relationship"
        options={RELATIONSHIP_OPTIONS}
        value={data.emergencyRelationship}
        onChange={(v) => onChange('emergencyRelationship', v)}
        error={errors.emergencyRelationship}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  sub: { fontSize: 14, color: '#666', marginTop: -12 },
});
