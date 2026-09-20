import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { buildDateOfBirth, calculateAge } from '../../../utils/validation';

const SEX_LABELS = { female: 'Female', male: 'Male', other: 'Other' };

const TYPE_LABELS = {
  type1: 'Type 1',
  type2_insulin_dependent: 'Type 2 (insulin-dependent)',
};

const RELATIONSHIP_LABELS = {
  parent: 'Parent',
  spouse: 'Spouse',
  sibling: 'Sibling',
  friend: 'Friend',
  other: 'Other',
};

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

function Section({ title, onEdit, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onEdit} hitSlop={10}>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

export default function StepReview({ data, onGoToStep }) {
  const iso = buildDateOfBirth(data);
  const age = calculateAge(iso);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Review</Text>
      <Text style={styles.sub}>
        Check these details before creating your account.
      </Text>

      <Section title="Account" onEdit={() => onGoToStep(0)}>
        <Row label="Name" value={data.fullName} />
        <Row label="Email" value={data.email} />
      </Section>

      <Section title="About you" onEdit={() => onGoToStep(1)}>
        <Row
          label="Date of birth"
          value={iso ? `${iso}  (age ${age})` : '—'}
        />
        <Row label="Sex" value={SEX_LABELS[data.sex]} />
        <Row label="Weight" value={data.weightKg ? `${data.weightKg} kg` : ''} />
        <Row label="Height" value={data.heightCm ? `${data.heightCm} cm` : ''} />
      </Section>

      <Section title="Diabetes" onEdit={() => onGoToStep(2)}>
        <Row label="Type" value={TYPE_LABELS[data.diabetesType]} />
        <Row label="Diagnosed" value={data.diagnosisYear} />
      </Section>

      <Section title="Emergency contact" onEdit={() => onGoToStep(3)}>
        <Row label="Name" value={data.emergencyName} />
        <Row label="Phone" value={data.emergencyPhone} />
        <Row
          label="Relationship"
          value={RELATIONSHIP_LABELS[data.emergencyRelationship]}
        />
      </Section>

      <Text style={styles.disclaimer}>
        Academic research prototype. Not for clinical use.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  sub: { fontSize: 14, color: '#666', marginTop: -10 },
  section: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  edit: { fontSize: 14, color: '#1b5fbf', fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  rowLabel: { fontSize: 13, color: '#777' },
  rowValue: { fontSize: 13, color: '#111', flexShrink: 1, textAlign: 'right' },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    paddingTop: 4,
  },
});
