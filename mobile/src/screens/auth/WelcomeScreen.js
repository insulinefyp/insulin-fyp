import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Insulin Delivery</Text>
          <Text style={styles.subtitle}>Research Prototype</Text>
          <Text style={styles.disclaimer}>
            Academic research prototype. Not for clinical use.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryText}>Create account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 17, color: '#666', marginTop: 6 },
  disclaimer: { fontSize: 12, color: '#999', marginTop: 20, lineHeight: 18 },
  actions: { gap: 12, paddingBottom: 16 },
  primaryButton: {
    backgroundColor: '#1b5fbf',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#111', fontSize: 16, fontWeight: '600' },
});
