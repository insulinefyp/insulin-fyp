import { ScrollView, StyleSheet, Text } from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';
import GlucoseReadingCard from '../components/GlucoseReadingCard';
import ParametersStatus from '../components/ParametersStatus';
import DeviceStatus from '../components/DeviceStatus';
import TemperatureCard from '../components/TemperatureCard';
import TemperatureAlertBanner from '../components/TemperatureAlertBanner';

export default function DashboardScreen({ navigation }) {
  const openTemperature = () =>
    navigation.navigate('Settings', { screen: 'Temperature', initial: false });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {/* Above everything else: a critical temperature must not be
          scrollable past. */}
      <TemperatureAlertBanner onPress={openTemperature} />

      <ConnectionStatus />
      <GlucoseReadingCard compact onPress={() => navigation.navigate('Glucose')} />
      <TemperatureCard onPress={openTemperature} />
      <DeviceStatus />
      <ParametersStatus />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
});
