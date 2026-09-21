import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTreatment } from '../hooks/useTreatment';

export default function ParametersStatus() {
  const navigation = useNavigation();
  const { data, isPending, isError } = useTreatment();

  // Connectivity problems are already reported by ConnectionStatus; showing
  // a second error card here would just repeat it.
  if (isPending || isError) return null;

  const open = () =>
    navigation.navigate('Settings', { screen: 'Treatment', initial: false });

  if (!data.isSet) {
    return (
      <TouchableOpacity style={styles.warning} onPress={open}>
        <Text style={styles.warningTitle}>Treatment parameters not set</Text>
        <Text style={styles.warningText}>
          Delivery is disabled until they are. Tap to set them up.
        </Text>
      </TouchableOpacity>
    );
  }

  const p = data.parameters;

  return (
    <TouchableOpacity style={styles.card} onPress={open}>
      <View style={styles.row}>
        <Text style={styles.title}>Treatment parameters</Text>
        <Text style={styles.version}>v{p.version}</Text>
      </View>
      <Text style={styles.detail}>
        Max bolus {p.maxBolusUnits} U · Max daily {p.maxDailyDoseUnits} U
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  warning: {
    backgroundColor: '#fff4e5',
    borderWidth: 1,
    borderColor: '#f0c27a',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  warningTitle: { fontSize: 15, fontWeight: '700', color: '#8a5300' },
  warningText: { fontSize: 13, color: '#6b4200' },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '600', color: '#111' },
  version: { fontSize: 13, color: '#1b5fbf', fontWeight: '600' },
  detail: { fontSize: 13, color: '#555' },
});
