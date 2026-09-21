import { ScrollView, StyleSheet, Text } from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';
import ParametersStatus from '../components/ParametersStatus';

export default function DashboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <ConnectionStatus />
      <ParametersStatus />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
});
