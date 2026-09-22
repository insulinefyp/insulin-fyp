import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrentGlucose } from '../hooks/useGlucose';
import { useTreatment } from '../hooks/useTreatment';
import { useNow } from '../hooks/useNow';
import {
  RANGE_STYLE,
  STALE_STYLE,
  classifyRange,
  formatAge,
  liveAgeSeconds,
  liveStatus,
} from '../utils/glucoseDisplay';

function Wrapper({ onPress, style, children }) {
  if (onPress) {
    return (
      <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={style}>{children}</View>;
}

export default function GlucoseReadingCard({ compact = false, onPress }) {
  const { data, dataUpdatedAt, isPending, isError, refetch } = useCurrentGlucose();
  const treatment = useTreatment();
  const now = useNow(1000);

  if (isPending) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" />
        <Text style={styles.muted}>Loading glucose…</Text>
      </View>
    );
  }

  // Failed before any reading ever arrived.
  if (!data) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Glucose unavailable</Text>
        <Text style={styles.muted}>Cannot reach the server.</Text>
        <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ageSeconds = liveAgeSeconds(data, dataUpdatedAt, now);
  const status = liveStatus(data, ageSeconds);

  if (status === 'no_data') {
    return (
      <Wrapper style={styles.card} onPress={onPress}>
        <Text style={styles.title}>No glucose data yet</Text>
        <Text style={styles.muted}>
          The first reading arrives within {data.intervalSeconds} seconds.
        </Text>
      </Wrapper>
    );
  }

  const value = data.reading.valueMgdl;
  const range = classifyRange(value, treatment.data?.parameters);
  const visual = status === 'fresh' ? RANGE_STYLE[range] : STALE_STYLE;

  return (
    <Wrapper
      style={[styles.card, { backgroundColor: visual.bg, borderColor: visual.bg }]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>Glucose</Text>
        <View style={[styles.badge, { borderColor: visual.color }]}>
          <Text style={[styles.badgeText, { color: visual.color }]}>
            {visual.label}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text
          style={[
            compact ? styles.valueCompact : styles.value,
            { color: visual.color },
          ]}
        >
          {value}
        </Text>
        <Text style={styles.unit}>{data.unit}</Text>
      </View>

      <Text style={styles.age}>Updated {formatAge(ageSeconds)}</Text>

      {status === 'stale' ? (
        <Text style={styles.hold}>
          No recent reading. Glucose-dependent actions are on hold until data
          resumes.
        </Text>
      ) : null}

      {isError ? (
        <Text style={styles.offline}>
          Cannot reach the server. Showing the last reading received.
        </Text>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  center: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#555' },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  value: { fontSize: 64, fontWeight: '700', letterSpacing: -1 },
  valueCompact: { fontSize: 40, fontWeight: '700' },
  unit: { fontSize: 16, color: '#666' },
  age: { fontSize: 13, color: '#666' },
  hold: { fontSize: 12, color: '#444', lineHeight: 17, marginTop: 4 },
  offline: { fontSize: 12, color: '#b3261e', marginTop: 2 },
  title: { fontSize: 15, fontWeight: '600', color: '#111' },
  muted: { fontSize: 13, color: '#777' },
  retry: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
    marginTop: 6,
  },
  retryText: { fontSize: 13, fontWeight: '500' },
});
