import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormField from '../../../components/FormField';
import { suggestEmailFix } from '../../../utils/validation';

export default function StepAccount({ data, errors, onChange }) {
  const emailSuggestion = suggestEmailFix(data.email);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Account details</Text>
      <Text style={styles.sub}>
        These are the credentials you will sign in with.
      </Text>

      <FormField
        label="Full name"
        value={data.fullName}
        onChangeText={(v) => onChange('fullName', v)}
        error={errors.fullName}
        placeholder="Hadi Zahir"
        autoCapitalize="words"
      />

      <View>
        <FormField
          label="Email"
          value={data.email}
          onChangeText={(v) => onChange('email', v)}
          error={errors.email}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        {emailSuggestion && !errors.email ? (
          <TouchableOpacity
            style={styles.suggestion}
            onPress={() => onChange('email', emailSuggestion)}
          >
            <Text style={styles.suggestionText}>
              Did you mean {emailSuggestion}?
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FormField
        label="Password"
        value={data.password}
        onChangeText={(v) => onChange('password', v)}
        error={errors.password}
        hint="At least 8 characters"
        secureTextEntry
        placeholder="••••••••"
      />

      <FormField
        label="Confirm password"
        value={data.confirmPassword}
        onChangeText={(v) => onChange('confirmPassword', v)}
        error={errors.confirmPassword}
        secureTextEntry
        placeholder="••••••••"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  sub: { fontSize: 14, color: '#666', marginTop: -12 },
  suggestion: { paddingTop: 4 },
  suggestionText: { fontSize: 12, color: '#1b5fbf' },
});
