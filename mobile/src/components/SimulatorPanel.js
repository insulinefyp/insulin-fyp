import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SegmentedControl from './SegmentedControl';
import { useSetSimulator, useSimulator } from '../hooks/useGlucose';

export default function SimulatorPanel() {
  const sim = useSimulator();
  const setSim = useSetSimulator();

  // Hidden when controls are disabled on the server (the route does not
  // exist) or unreachable. It is a testing tool, not part of the product.
  if (sim.isPending || sim.isError) return null;

  const { scenario, paused, availableScenarios } = sim.data;
  const busy = setSim.isPending;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Simulator controls</Text>
      <Text style={styles.note}>For testing and demonstration only.</Text>

      <SegmentedControl
        label="Scenario"
        options={availableScenarios.map((s) => ({ value: s.key, label: s.label }))}
        value={scenario}
        onChange={(v) => {
          if (!busy && v !== scenario) setSim.mutate({ scenario: v });
        }}
      />

      <TouchableOpacity
        style={[styles.toggle, paused && styles.toggleActive]}
        onPress={() => setSim.mutate({ paused: !paused })}
        disabled={busy}
      >
        <Text style={[styles.toggleText, paused && styles.toggleTextActive]}>
          {paused ? 'Resume readings' : 'Pause readings (simulate sensor gap)'}
        </Text>
      </TouchableOpacity>

      {setSim.isError ? (
        <Text style={styles.error}>{setSim.error.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: '600', color: '#111' },
  note: { fontSize: 12, color: '#888', marginTop: -6 },
  toggle: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  toggleActive: { borderColor: '#b3261e', backgroundColor: '#fdecea' },
  toggleText: { fontSize: 14, color: '#333' },
  toggleTextActive: { color: '#b3261e', fontWeight: '600' },
  error: { fontSize: 12, color: '#b3261e' },
});
