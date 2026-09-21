import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import config from '../config';

function NavRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.navRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#444" />
      <Text style={styles.navText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  function confirmSignOut() {
    Alert.alert('Sign out', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          // Cached data belongs to this user. Without clearing it, the next
          // person to sign in on this device would briefly see it.
          queryClient.clear();
          await signOut();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <NavRow
        icon="person-outline"
        label="Patient profile"
        onPress={() => navigation.navigate('Profile')}
      />
      <NavRow
        icon="medkit-outline"
        label="Treatment parameters"
        onPress={() => navigation.navigate('Treatment')}
      />

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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
  },
  navText: { flex: 1, fontSize: 15, color: '#111' },
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
