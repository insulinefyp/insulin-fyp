import { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useProfile } from '../../hooks/useProfile';
import {
  DIABETES_LABELS,
  RELATIONSHIP_LABELS,
  SEX_LABELS,
  formatDateOnly,
} from '../../utils/format';

function Row({ label, value, locked }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>
        {label}
        {locked ? <Text style={styles.locked}>  fixed</Text> : null}
      </Text>
      <Text style={styles.rowValue}>{value ?? '—'}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { data, isPending, isError, error, refetch, isRefetching } = useProfile();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        data ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            hitSlop={12}
          >
            <Text style={styles.headerAction}>Edit</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, data]);

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error.code === 'NETWORK' || error.code === 'TIMEOUT'
            ? 'Cannot reach the server.'
            : error.message}
        </Text>
        <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, profile } = data;
  const contact = profile.emergencyContact || {};

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <Section title="Personal">
        <Row label="Name" value={user.fullName} />
        <Row label="Email" value={user.email} locked />
        <Row
          label="Date of birth"
          value={`${formatDateOnly(profile.dateOfBirth)}  (age ${profile.age})`}
          locked
        />
        <Row label="Sex" value={SEX_LABELS[profile.sex]} locked />
      </Section>

      <Section title="Measurements">
        <Row label="Weight" value={`${profile.weightKg} kg`} />
        <Row label="Height" value={`${profile.heightCm} cm`} />
        <Text style={styles.note}>
          Weight is used in dose calculations. Changes are recorded.
        </Text>
      </Section>

      <Section title="Diabetes">
        <Row label="Type" value={DIABETES_LABELS[profile.diabetesType]} locked />
        <Row label="Diagnosed" value={profile.diagnosisYear} locked />
      </Section>

      <Section title="Emergency contact">
        <Row label="Name" value={contact.name} />
        <Row label="Phone" value={contact.phone} />
        <Row label="Relationship" value={RELATIONSHIP_LABELS[contact.relationship]} />
      </Section>

      <TouchableOpacity
        style={styles.historyLink}
        onPress={() => navigation.navigate('ProfileHistory')}
      >
        <Text style={styles.historyText}>View change history</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  section: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  rowLabel: { fontSize: 13, color: '#777' },
  locked: { fontSize: 11, color: '#aaa' },
  rowValue: { fontSize: 13, color: '#111', flexShrink: 1, textAlign: 'right' },
  note: { fontSize: 11, color: '#999', marginTop: 2 },
  headerAction: { color: '#1b5fbf', fontSize: 16, fontWeight: '500' },
  errorText: { color: '#b3261e', fontSize: 14, textAlign: 'center' },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  retryText: { fontSize: 14, fontWeight: '500' },
  historyLink: { alignItems: 'center', paddingVertical: 12 },
  historyText: { color: '#1b5fbf', fontSize: 14, fontWeight: '500' },
});
