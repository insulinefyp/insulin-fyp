import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import TemperatureCard from '../../components/TemperatureCard';
import {
  useTemperatureExcursions,
  useTemperatureHistory,
} from '../../hooks/useTemperature';
import { formatDateTime } from '../../utils/format';
import {
  TEMP_STYLE,
  formatCelsius,
  formatDuration,
} from '../../utils/temperatureDisplay';

function ExcursionItem({ item }) {
  const visual = TEMP_STYLE[item.status] || TEMP_STYLE.unavailable;

  return (
    <View style={[styles.excursion, { borderLeftColor: visual.color }]}>
      <View style={styles.excursionHeader}>
        <Text style={[styles.excursionLabel, { color: visual.color }]}>
          {visual.label}
        </Text>
        {item.simulated ? <Text style={styles.simTag}>SIMULATED</Text> : null}
        {item.ongoing ? <Text style={styles.ongoingTag}>ONGOING</Text> : null}
      </View>

      {/* Duration leads: insulin degradation depends on cumulative exposure,
          so how long it lasted matters more than any single reading. */}
      <Text style={styles.excursionDuration}>
        {formatDuration(item.durationSeconds)} · peak{' '}
        {formatCelsius(item.peakCelsius)} °C
      </Text>

      <Text style={styles.excursionTime}>
        {formatDateTime(item.startedAt)}
        {item.endedAt ? ` → ${formatDateTime(item.endedAt)}` : ''}
      </Text>
    </View>
  );
}

export default function TemperatureScreen() {
  const [includeSimulated, setIncludeSimulated] = useState(false);

  const history = useTemperatureHistory(6);
  const excursions = useTemperatureExcursions(includeSimulated);

  const refreshing = history.isRefetching || excursions.isRefetching;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            history.refetch();
            excursions.refetch();
          }}
        />
      }
    >
      <TemperatureCard />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last 6 hours</Text>

        {history.isPending ? (
          <ActivityIndicator />
        ) : history.isError ? (
          <Text style={styles.muted}>Cannot reach the server.</Text>
        ) : history.data.count === 0 ? (
          <Text style={styles.muted}>No readings recorded yet.</Text>
        ) : (
          <>
            <View style={styles.statsRow}>
              <Stat label="Lowest" value={`${formatCelsius(history.data.min)} °C`} />
              <Stat label="Highest" value={`${formatCelsius(history.data.max)} °C`} />
              <Stat label="Readings" value={history.data.count} />
            </View>
            <Text style={styles.note}>
              Readings are recorded when the temperature changes, not on every
              check.
            </Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Excursions</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Show simulated</Text>
            <Switch value={includeSimulated} onValueChange={setIncludeSimulated} />
          </View>
        </View>

        <Text style={styles.note}>
          Periods outside 2–30 °C, with how long each lasted.
        </Text>

        {excursions.isPending ? (
          <ActivityIndicator />
        ) : excursions.isError ? (
          <Text style={styles.muted}>Cannot reach the server.</Text>
        ) : excursions.data.excursions.length === 0 ? (
          <Text style={styles.muted}>
            {includeSimulated
              ? 'No excursions recorded.'
              : 'No real excursions recorded.'}
          </Text>
        ) : (
          excursions.data.excursions.map((e) => <ExcursionItem key={e.id} item={e} />)
        )}
      </View>

      <Text style={styles.disclaimer}>
        Thresholds are applied to individual readings. Actual insulin
        degradation depends on how long exposure lasts, which is why each
        excursion records its duration.
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  section: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchLabel: { fontSize: 12, color: '#777' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: '#888' },
  note: { fontSize: 11, color: '#999', lineHeight: 16 },
  muted: { fontSize: 13, color: '#888' },
  excursion: {
    borderLeftWidth: 3,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  excursionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  excursionLabel: { fontSize: 13, fontWeight: '700' },
  simTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  ongoingTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#b3261e',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  excursionDuration: { fontSize: 14, color: '#111', fontWeight: '500' },
  excursionTime: { fontSize: 11, color: '#888' },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
    paddingHorizontal: 4,
  },
});
