import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDevice } from '../hooks/useDevice';
import { useNow } from '../hooks/useNow';
import { formatAge } from '../utils/glucoseDisplay';
import {
  STALE_TEMP_STYLE,
  TEMP_STYLE,
  formatCelsius,
} from '../utils/temperatureDisplay';

export default function TemperatureCard({ onPress }) {
  const { data, dataUpdatedAt, isPending } = useDevice();
  const now = useNow(1000);

  if (isPending || !data) return null;
  if (data.status === 'disabled' || data.status === 'never_reached') return null;

  const temp = data.device?.temperature;
  if (!temp) return null;

  const deviceOffline = data.status !== 'online';

  const ageSeconds =
    data.dataAgeSeconds === null || data.dataAgeSeconds === undefined
      ? null
      : data.dataAgeSeconds + Math.max(0, Math.floor((now - dataUpdatedAt) / 1000));

  // A reading from an unreachable device describes the past. It is shown
  // greyed rather than hidden, but never styled as current.
  const visual = deviceOffline
    ? STALE_TEMP_STYLE
    : TEMP_STYLE[temp.status] || TEMP_STYLE.unavailable;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: visual.bg, borderColor: visual.bg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>Cartridge temperature</Text>
        <View style={styles.badgeRow}>
          {temp.simulated ? (
            <View style={styles.simBadge}>
              <Text style={styles.simText}>SIMULATED</Text>
            </View>
          ) : null}
          <View style={[styles.badge, { borderColor: visual.color }]}>
            <Text style={[styles.badgeText, { color: visual.color }]}>
              {visual.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: visual.color }]}>
          {temp.available ? formatCelsius(temp.celsius) : '—'}
        </Text>
        <Text style={styles.unit}>°C</Text>
      </View>

      <Text style={styles.detail}>{visual.detail}</Text>

      <Text style={styles.age}>
        {temp.chip ? `${temp.chip} · ` : ''}Updated {formatAge(ageSeconds)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#555' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  simBadge: {
    backgroundColor: '#444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  simText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: { fontSize: 40, fontWeight: '700' },
  unit: { fontSize: 15, color: '#666' },
  detail: { fontSize: 12, color: '#555', lineHeight: 17 },
  age: { fontSize: 12, color: '#777', marginTop: 2 },
});
