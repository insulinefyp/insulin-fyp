import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useProfileChanges } from '../../hooks/useProfile';
import { FIELD_LABELS, formatDateTime } from '../../utils/format';

function ChangeItem({ item }) {
  const meta = FIELD_LABELS[item.field] || { label: item.field, unit: '' };
  const unit = meta.unit ? ` ${meta.unit}` : '';

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.field}>{meta.label}</Text>
        <Text style={styles.date}>{formatDateTime(item.changedAt)}</Text>
      </View>
      <Text style={styles.values}>
        {item.previousValue}
        {unit}  →  {item.newValue}
        {unit}
      </Text>
    </View>
  );
}

export default function ProfileHistoryScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } =
    useProfileChanges();

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

  return (
    <FlatList
      data={data.changes}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <ChangeItem item={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListHeaderComponent={
        <Text style={styles.intro}>
          Changes to values used in dose calculations. This record cannot be
          edited or deleted.
        </Text>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No changes recorded yet.</Text>
      }
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
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  field: { fontSize: 14, fontWeight: '600', color: '#111' },
  date: { fontSize: 12, color: '#888' },
  values: { fontSize: 15, color: '#111' },
  empty: { fontSize: 13, color: '#999', textAlign: 'center', paddingTop: 24 },
  errorText: { color: '#b3261e', fontSize: 14, textAlign: 'center' },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  retryText: { fontSize: 14, fontWeight: '500' },
});
