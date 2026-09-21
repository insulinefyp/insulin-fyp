import { useEffect, useState } from 'react';
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
import {
  useCreateTreatment,
  useTreatment,
  useTreatmentLimits,
} from '../../hooks/useTreatment';
import {
  FIELD_GROUPS,
  FIELD_HELP,
  checkParameters,
  formToValues,
  rangeHint,
  valuesToForm,
} from '../../utils/treatmentForm';
import { hasErrors } from '../../utils/validation';

export default function EditTreatmentScreen({ navigation }) {
  const treatment = useTreatment();
  const limits = useTreatmentLimits();
  const mutation = useCreateTreatment();

  const [form, setForm] = useState(null);
  const [changeNote, setChangeNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const ready = Boolean(treatment.data && limits.data);

  useEffect(() => {
    if (ready && form === null) {
      setForm(
        valuesToForm(treatment.data.parameters, Object.keys(limits.data.fields))
      );
    }
  }, [ready, form, treatment.data, limits.data]);

  if (!ready || !form) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const { fields, raiseSensitive } = limits.data;
  const keys = Object.keys(fields);
  const current = treatment.data.parameters;
  const values = formToValues(form, keys);
  const hasChanges = current ? keys.some((k) => values[k] !== current[k]) : true;
  const busy = mutation.isPending;

  function handleChange(key, text) {
    setForm((prev) => ({ ...prev, [key]: text.replace(/[^\d.,]/g, '') }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
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
          Object.entries(err.fields).forEach(([key, message]) => {
            if (fields[key]) mapped[key] = message;
          });
          if (Object.keys(mapped).length > 0) {
            setErrors(mapped);
            setSubmitError('Please correct the highlighted values.');
            return;
          }
        }
        setSubmitError(
          err.code === 'NETWORK' || err.code === 'TIMEOUT'
            ? 'Cannot reach the server. Nothing was saved.'
            : err.message
        );
      },
    });
  }

  function handleSave() {
    const clientErrors = checkParameters(values, fields);
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      setSubmitError('Please correct the highlighted values.');
      return;
    }

    const payload = { ...values };
    if (changeNote.trim()) payload.changeNote = changeNote.trim();

    // First setup: the patient is defining what every future delivery is
    // checked against, so the two limits are stated back before saving.
    if (!current) {
      Alert.alert(
        'Confirm safety limits',
        `Max bolus: ${values.maxBolusUnits} ${fields.maxBolusUnits.unit}\n` +
          `Max daily dose: ${values.maxDailyDoseUnits} ${fields.maxDailyDoseUnits.unit}\n\n` +
          'Every delivery will be checked against these limits.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => submit(payload) },
        ]
      );
      return;
    }

    // Raising a limit widens what the delivery path accepts. Lowering one
    // only makes the system stricter, so it needs no confirmation.
    const raised = raiseSensitive.filter((k) => values[k] > current[k]);
    if (raised.length > 0) {
      const lines = raised
        .map((k) => `${fields[k].label}: ${current[k]} → ${values[k]} ${fields[k].unit}`)
        .join('\n');

      Alert.alert(
        'Raise safety limit?',
        `${lines}\n\nThis widens what the delivery system will accept.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Raise limit', style: 'destructive', onPress: () => submit(payload) },
        ]
      );
      return;
    }

    submit(payload);
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
        <Text style={styles.notice}>
          Research prototype with a simulated patient. These values configure
          the simulation and its safety checks, not real treatment.
        </Text>

        {submitError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        {FIELD_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.keys.map((key) => {
              const def = fields[key];
              return (
                <View key={key} style={styles.fieldWrap}>
                  <FormField
                    label={`${def.label} (${def.unit})`}
                    value={form[key]}
                    onChangeText={(t) => handleChange(key, t)}
                    error={errors[key]}
                    hint={rangeHint(def)}
                    keyboardType={def.decimals > 0 ? 'decimal-pad' : 'number-pad'}
                    editable={!busy}
                  />
                  <Text style={styles.help}>{FIELD_HELP[key]}</Text>
                </View>
              );
            })}
          </View>
        ))}

        <FormField
          label="Reason for change (optional)"
          value={changeNote}
          onChangeText={setChangeNote}
          placeholder={current ? 'e.g. adjusted after review' : 'e.g. initial setup'}
          maxLength={200}
          editable={!busy}
        />
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
              {!hasChanges
                ? 'No changes'
                : current
                ? `Save as version ${current.version + 1}`
                : 'Save parameters'}
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
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  notice: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    lineHeight: 18,
  },
  group: { gap: 12 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  fieldWrap: { gap: 4 },
  help: { fontSize: 11, color: '#999', lineHeight: 16 },
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
