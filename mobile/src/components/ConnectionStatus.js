import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHealth } from '../hooks/useHealth';
import config from '../config';

const COLORS = {
  connected: '#1b7f3b',
  error: '#b3261e',
  pending: '#6b6b6b',
};

export default function ConnectionStatus() {
  const { data, isPending, isError, error, refetch, isFetching } = useHealth();

  if (isPending) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={COLORS.pending} />
        <Text style={styles.label}>Connecting to backend…</Text>
      </View>
    );
  }

  if (isError) {
    const message =
      error?.code === 'TIMEOUT'
        ? 'Backend did not respond in time'
        : error?.code === 'NETWORK'
        ? 'Cannot reach backend'
        : error?.message || 'Unknown error';

    return (
      <View style={styles.card}>
        <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: COLORS.error }]}>Offline</Text>
          <Text style={styles.detail}>{message}</Text>
          <Text style={styles.detail}>{config.apiBaseUrl}</Text>
        </View>
        <TouchableOpacity
          style={[styles.retry, isFetching && styles.disabled]}
          onPress={() => refetch()}
          disabled={isFetching}
        >
          <Text style={styles.retryText}>
            {isFetching ? 'Retrying…' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: COLORS.connected }]} />
      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: COLORS.connected }]}>
          Connected
        </Text>
        <Text style={styles.detail}>
          {data?.env ?? 'N/A'} · up {data?.uptimeSeconds ?? 0}s
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    width: '100%',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  textBlock: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.pending },
  detail: { fontSize: 12, color: COLORS.pending, marginTop: 2 },
  retry: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  disabled: {
    opacity: 0.6,
  },
  retryText: { fontSize: 13, fontWeight: '500' },
});
