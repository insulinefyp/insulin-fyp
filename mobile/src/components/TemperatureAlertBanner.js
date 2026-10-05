import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDevice } from '../hooks/useDevice';
import { isCritical } from '../utils/temperatureDisplay';

// Critical only. A warning is informational and the coloured card carries it;
// a critical reading means the insulin may be compromised, so it goes above
// everything else where it cannot be scrolled past.
export default function TemperatureAlertBanner({ onPress }) {
  const { data } = useDevice();

  if (!data || data.status !== 'online') return null;

  const temp = data.device?.temperature;
  if (!temp || !temp.available || !isCritical(temp.status)) return null;

  const tooHot = temp.status === 'critical_hot';

  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <Text style={styles.title}>
          {tooHot ? 'Cartridge too hot' : 'Cartridge too cold'}
        </Text>
        {temp.simulated ? <Text style={styles.sim}>SIMULATED</Text> : null}
      </View>
      <Text style={styles.body}>
        {temp.celsius.toFixed(1)} °C.{' '}
        {tooHot
          ? 'Above 37 °C. Insulin may be degraded — check the cartridge before use.'
          : 'Below 2 °C. Freezing destroys insulin — do not use this cartridge.'}
      </Text>
      <Text style={styles.link}>View temperature history</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#b3261e',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sim: {
    fontSize: 9,
    fontWeight: '700',
    color: '#b3261e',
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    letterSpacing: 0.5,
  },
  body: { fontSize: 13, color: '#fff', lineHeight: 19 },
  link: { fontSize: 13, color: '#fff', fontWeight: '600', marginTop: 2 },
});
