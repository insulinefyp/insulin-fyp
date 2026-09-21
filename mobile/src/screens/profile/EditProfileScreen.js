import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FormField from '../../components/FormField';
import SegmentedControl from '../../components/SegmentedControl';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { hasErrors, validateProfileEdit } from '../../utils/validation';

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

// Server field paths mapped back onto this form's field names.
const SERVER_FIELD_MAP = {
  fullName: 'fullName',
  weightKg: 'weightKg',
  heightCm: 'heightCm',
  'emergencyContact.name': 'emergencyName',
  'emergencyContact.phone': 'emergencyPhone',
  'emergencyContact.relationship': 'emergencyRelationship',
};

function toForm(user, profile) {
  const c = profile.emergencyContact || {};
  return {
    fullName: user.fullName,
    weightKg: String(profile.weightKg),
    heightCm: String(profile.heightCm),
    emergencyName: c.name || '',
    emergencyPhone: c.phone || '',
    emergencyRelationship: c.relationship || '',
  };
}

// Only what differs from the loaded profile is sent. The server would ignore
// an unchanged weight anyway, but the client should not depend on that.
function buildChanges(form, user, profile) {
  const changes = {};
  const c = profile.emergencyContact || {};

  if (form.fullName.trim() !== user.fullName) {
    changes.fullName = form.fullName.trim();
  }

  const weight = Number(form.weightKg);
  if (weight !== profile.weightKg) changes.weightKg = weight;

  const height = Number(form.heightCm);
  if (height !== profile.heightCm) changes.heightCm = height;

  const contact = {
    name: form.emergencyName.trim(),
    phone: form.emergencyPhone.trim(),
    relationship: form.emergencyRelationship,
  };
  if (
    contact.name !== c.name ||
    contact.phone !== c.phone ||
    contact.relationship !== c.relationship
  ) {
    changes.emergencyContact = contact;
  }

  return changes;
}

export default function EditProfileScreen({ navigation }) {
  const { data } = useProfile();
  const mutation = useUpdateProfile();

  const [form, setForm] = useState(() =>
    data ? toForm(data.user, data.profile) : null
  );
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  if (!data || !form) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const { user, profile } = data;
  const changes = buildChanges(form, user, profile);
  const hasChanges = Object.keys(changes).length > 0;
  const busy = mutation.isPending;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function submit(payload) {
    setSubmitError(null);

    mutation.mutate(payload, {
      onSuccess: () => navigation.goBack(),
      onError: (err) => {
        if (err.fields) {
          const mapped = {};
          Object.entries(err.fields).forEach(([path, message]) => {
            if (SERVER_FIELD_MAP[path]) mapped[SERVER_FIELD_MAP[path]] = message;
          });
          if (Object.keys(mapped).length > 0) {
            setErrors(mapped);
            return;
          }
        }
        setSubmitError(
          err.code === 'NETWORK' || err.code === 'TIMEOUT'
            ? 'Cannot reach the server. Your changes were not saved.'
            : err.message
        );
      },
    });
  }

  function handleSave() {
    const formErrors = validateProfileEdit(form);
    if (hasErrors(formErrors)) {
      setErrors(formErrors);
      return;
    }

    if (changes.weightKg !== undefined) {
      Alert.alert(
        'Confirm weight change',
        `${profile.weightKg} kg → ${changes.weightKg} kg\n\n` +
          'Weight is used in dose calculations. This change will be recorded.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => submit(changes) },
        ]
      );
      return;
    }

    submit(changes);
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
        {submitError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Personal</Text>
        <FormField
          label="Full name"
          value={form.fullName}
          onChangeText={(v) => handleChange('fullName', v)}
          error={errors.fullName}
          autoCapitalize="words"
          editable={!busy}
        />

        <Text style={styles.sectionTitle}>Measurements</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Weight (kg)"
              value={form.weightKg}
              onChangeText={(v) => handleChange('weightKg', v.replace(/[^\d.]/g, ''))}
              error={errors.weightKg}
              keyboardType="decimal-pad"
              editable={!busy}
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Height (cm)"
              value={form.heightCm}
              onChangeText={(v) => handleChange('heightCm', v.replace(/\D/g, ''))}
              error={errors.heightCm}
              keyboardType="number-pad"
              editable={!busy}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Emergency contact</Text>
        <FormField
          label="Contact name"
          value={form.emergencyName}
          onChangeText={(v) => handleChange('emergencyName', v)}
          error={errors.emergencyName}
          autoCapitalize="words"
          editable={!busy}
        />
        <FormField
          label="Phone number"
          value={form.emergencyPhone}
          onChangeText={(v) => handleChange('emergencyPhone', v)}
          error={errors.emergencyPhone}
          keyboardType="phone-pad"
          editable={!busy}
        />
        <SegmentedControl
          label="Relationship"
          options={RELATIONSHIP_OPTIONS}
          value={form.emergencyRelationship}
          onChange={(v) => handleChange('emergencyRelationship', v)}
          error={errors.emergencyRelationship}
        />

        <Text style={styles.lockedNote}>
          Date of birth, sex, diabetes type and diagnosis year cannot be changed
          here.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!hasChanges || busy) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {hasChanges ? 'Save changes' : 'No changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 14, paddingBottom: 32 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginTop: 6 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  lockedNote: { fontSize: 12, color: '#999', marginTop: 6 },
  errorBox: { backgroundColor: '#fdecea', borderRadius: 8, padding: 12 },
  errorText: { color: '#b3261e', fontSize: 13, lineHeight: 18 },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#1b5fbf',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#b8c9e3' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
