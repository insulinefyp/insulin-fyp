import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import config from '../config';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Backend</Text>
        <Text style={styles.mono}>{config.apiBaseUrl}</Text>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={confirmSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  cardLabel: { fontSize: 12, color: '#888' },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  email: { fontSize: 13, color: '#666' },
  mono: { fontSize: 12, color: '#444' },
  signOut: {
    borderWidth: 1,
    borderColor: '#b3261e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { color: '#b3261e', fontSize: 15, fontWeight: '600' },
});
