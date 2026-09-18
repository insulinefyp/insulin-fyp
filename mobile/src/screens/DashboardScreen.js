
import { StyleSheet, Text, View } from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <ConnectionStatus />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
});
