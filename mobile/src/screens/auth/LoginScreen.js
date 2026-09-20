import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  async function handleSubmit() {
    setBusy(true);
    setError(null);

    try {
      await signIn({ email: email.trim(), password });
      // No navigation call: signIn sets the user, which swaps the whole
      // navigator over to the tabs.
    } catch (err) {
      setError(
        err.code === 'NETWORK' || err.code === 'TIMEOUT'
          ? 'Cannot reach the server. Check your connection.'
          : err.message
      );
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Sign in</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!busy}
            placeholder="you@example.com"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!busy}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.replace('Register')}
          disabled={busy}
        >
          <Text style={styles.linkText}>No account? Create one</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, gap: 18 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: '#b3261e', fontSize: 13, lineHeight: 18 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#444' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111',
  },
  button: {
    backgroundColor: '#1b5fbf',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#b8c9e3' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#1b5fbf', fontSize: 14, fontWeight: '500' },
});
