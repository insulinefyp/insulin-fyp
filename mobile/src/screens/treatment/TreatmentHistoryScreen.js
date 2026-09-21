import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTreatmentHistory, useTreatmentLimits } from '../../hooks/useTreatment';
import { diffVersions, formatValue } from '../../utils/treatmentForm';
import { formatDateTime } from '../../utils/format';

function VersionItem({ item, older, isActive, fields }) {
  const keys = Object.keys(fields);
  const diffs = older ? diffVersions(item, older, keys) : null;

  return (
    <View style={[styles.item, isActive && styles.itemActive]}>
      <View style={styles.itemHeader}>
        <Text style={styles.version}>
          Version {item.version}
          {isActive ? <Text style={styles.active}>  active</Text> : null}
        </Text>
        <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
      </View>

      {item.changeNote ? <Text style={styles.note}>"{item.changeNote}"</Text> : null}

      {diffs ? (
        diffs.map((d) => (
          <Text key={d.key} style={styles.diff}>
            {fields[d.key].label}: {formatValue(d.from, fields[d.key])} →{' '}
            {formatValue(d.to, fields[d.key])}
          </Text>
        ))
      ) : item.version === 1 ? (
        <Text style={styles.diff}>
          Initial parameters · max bolus{' '}
          {formatValue(item.maxBolusUnits, fields.maxBolusUnits)}, max daily{' '}
          {formatValue(item.maxDailyDoseUnits, fields.maxDailyDoseUnits)}
        </Text>
      ) : (
        <Text style={styles.muted}>Earlier version not shown</Text>
      )}
    </View>
  );
}

export default function TreatmentHistoryScreen() {
  const history = useTreatmentHistory();
  const limits = useTreatmentLimits();

  if (history.isPending || limits.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (history.isError || limits.isError) {
    const err = history.error || limits.error;
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {err.code === 'NETWORK' || err.code === 'TIMEOUT'
            ? 'Cannot reach the server.'
            : err.message}
        </Text>
        <TouchableOpacity style={styles.retry} onPress={() => history.refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const versions = history.data.versions;
  const { fields } = limits.data;

  return (
    <FlatList
      data={versions}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <VersionItem
          item={item}
          older={versions[index + 1]}
          isActive={index === 0}
          fields={fields}
        />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={history.isRefetching} onRefresh={history.refetch} />
      }
      ListHeaderComponent={
        <Text style={styles.intro}>
          Every change creates a new version. Earlier versions are kept
          unchanged so any past delivery can be traced to the limits in force
          at the time.
        </Text>
      }
      ListEmptyComponent={<Text style={styles.muted}>No versions yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  intro: { fontSize: 12, color: '#888', marginBottom: 4, lineHeight: 17 },
  item: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  itemActive: { borderColor: '#1b5fbf' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  version: { fontSize: 14, fontWeight: '700', color: '#111' },
  active: { fontSize: 11, color: '#1b5fbf', fontWeight: '600' },
  date: { fontSize: 12, color: '#888' },
  note: { fontSize: 13, color: '#444', fontStyle: 'italic' },
  diff: { fontSize: 13, color: '#111' },
  muted: { fontSize: 12, color: '#999' },
  errorText: { color: '#b3261e', fontSize: 14, textAlign: 'center' },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  retryText: { fontSize: 14, fontWeight: '500' },
});
