import { ScrollView, StyleSheet, Text } from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';
import GlucoseReadingCard from '../components/GlucoseReadingCard';
import ParametersStatus from '../components/ParametersStatus';
import DeviceStatus from '../components/DeviceStatus';

export default function DashboardScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <ConnectionStatus />
      <GlucoseReadingCard compact onPress={() => navigation.navigate('Glucose')} />
      <DeviceStatus />
      <ParametersStatus />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
});
