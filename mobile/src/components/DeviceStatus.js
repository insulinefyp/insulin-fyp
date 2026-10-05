import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDevice } from '../hooks/useDevice';
import { useNow } from '../hooks/useNow';
import { formatAge } from '../utils/glucoseDisplay';

const COLORS = {
  online: '#1b7f3b',
  offline: '#b3261e',
  unknown: '#6b6b6b',
};

// The backend's age at response time, plus time elapsed on this device since.
// Without this, a backend that stops responding would leave the card showing
// a frozen age that looks current.
function liveAge(data, dataUpdatedAt, now) {
  if (data?.dataAgeSeconds === null || data?.dataAgeSeconds === undefined) {
    return null;
  }
  const sinceFetch = Math.max(0, Math.floor((now - dataUpdatedAt) / 1000));
  return data.dataAgeSeconds + sinceFetch;
}

export default function DeviceStatus() {
  const { data, dataUpdatedAt, isPending, isError } = useDevice();
  const now = useNow(1000);

  if (isPending) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" />
        <Text style={styles.muted}>Checking device…</Text>
      </View>
    );
  }

  // Connectivity to the backend is already reported by ConnectionStatus;
  // a second error card here would just repeat it.
  if (!data) return null;

  // Polling turned off in backend config: the card has nothing to say.
  if (data.status === 'disabled') return null;

  const ageSeconds = liveAge(data, dataUpdatedAt, now);
  const device = data.device;

  if (data.status === 'never_reached') {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Delivery device</Text>
          <View style={[styles.dot, { backgroundColor: COLORS.unknown }]} />
        </View>
        <Text style={styles.state}>Not reached</Text>
        <Text style={styles.detail}>
          The device has not responded since the server started.
        </Text>
        <Text style={styles.address}>{data.address}</Text>
        {data.lastError ? (
          <Text style={styles.errorText}>{data.lastError}</Text>
        ) : null}
      </View>
    );
  }

  const online = data.status === 'online';
  const color = online ? COLORS.online : COLORS.offline;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Delivery device</Text>
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>

      <Text style={[styles.state, { color }]}>
        {online ? 'Connected' : 'Not responding'}
      </Text>

      <Text style={styles.detail}>
        {device?.deviceId}
        {device?.firmwareVersion ? ` · firmware ${device.firmwareVersion}` : ''}
      </Text>

      <Text style={styles.detail}>
        Last reading {formatAge(ageSeconds)}
        {device?.wifi?.rssi !== null && device?.wifi?.rssi !== undefined
          ? ` · signal ${device.wifi.rssi} dBm`
          : ''}
      </Text>

      {!online ? (
        <Text style={styles.hold}>
          {data.consecutiveFailures} failed checks. Delivery is on hold until
          the device responds. Showing its last known state.
        </Text>
      ) : null}

      {isError ? (
        <Text style={styles.errorText}>
          Cannot reach the server. Showing the last status received.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  center: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 13, fontWeight: '600', color: '#555' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  state: { fontSize: 16, fontWeight: '700', color: '#6b6b6b' },
  detail: { fontSize: 12, color: '#666' },
  address: { fontSize: 11, color: '#999' },
  hold: { fontSize: 12, color: '#444', lineHeight: 17, marginTop: 4 },
  errorText: { fontSize: 12, color: '#b3261e', marginTop: 2 },
});
