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
import { useTreatment, useTreatmentLimits } from '../../hooks/useTreatment';
import { FIELD_GROUPS, formatValue } from '../../utils/treatmentForm';
import { formatDateTime } from '../../utils/format';

export default function TreatmentScreen({ navigation }) {
  const treatment = useTreatment();
  const limits = useTreatmentLimits();

  const isSet = treatment.data?.isSet;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isSet ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('EditTreatment')}
            hitSlop={12}
          >
            <Text style={styles.headerAction}>Change</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, isSet]);

  if (treatment.isPending || limits.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (treatment.isError || limits.isError) {
    const err = treatment.error || limits.error;
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {err.code === 'NETWORK' || err.code === 'TIMEOUT'
            ? 'Cannot reach the server.'
            : err.message}
        </Text>
        <TouchableOpacity
          style={styles.retry}
          onPress={() => {
            treatment.refetch();
            limits.refetch();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { fields } = limits.data;

  if (!isSet) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Not set</Text>
          <Text style={styles.warningText}>
            Delivery, scheduling and advice are disabled until treatment
            parameters exist. The system has nothing to check a delivery
            against without them.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primary}
          onPress={() => navigation.navigate('EditTreatment')}
        >
          <Text style={styles.primaryText}>Set up parameters</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const p = treatment.data.parameters;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={treatment.isRefetching}
          onRefresh={treatment.refetch}
        />
      }
    >
      <View style={styles.versionCard}>
        <Text style={styles.versionTitle}>Version {p.version}</Text>
        <Text style={styles.versionMeta}>Set {formatDateTime(p.createdAt)}</Text>
        {p.changeNote ? <Text style={styles.note}>"{p.changeNote}"</Text> : null}
      </View>

      {FIELD_GROUPS.map((group) => (
        <View key={group.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{group.title}</Text>
          {group.keys.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{fields[key].label}</Text>
              <Text style={styles.rowValue}>{formatValue(p[key], fields[key])}</Text>
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate('TreatmentHistory')}
      >
        <Text style={styles.linkText}>View version history</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerAction: { color: '#1b5fbf', fontSize: 16, fontWeight: '500' },
  warning: {
    backgroundColor: '#fff4e5',
    borderWidth: 1,
    borderColor: '#f0c27a',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  warningTitle: { fontSize: 15, fontWeight: '700', color: '#8a5300' },
  warningText: { fontSize: 13, color: '#6b4200', lineHeight: 19 },
  primary: {
    backgroundColor: '#1b5fbf',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  versionCard: {
    backgroundColor: '#f5f8fd',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  versionTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  versionMeta: { fontSize: 12, color: '#666' },
  note: { fontSize: 13, color: '#444', fontStyle: 'italic', marginTop: 2 },
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
  rowValue: { fontSize: 13, color: '#111', fontWeight: '500' },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: '#1b5fbf', fontSize: 14, fontWeight: '500' },
  errorText: { color: '#b3261e', fontSize: 14, textAlign: 'center' },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  retryText: { fontSize: 14, fontWeight: '500' },
});
