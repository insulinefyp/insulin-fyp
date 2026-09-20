import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ProgressBar from '../../components/ProgressBar';
import StepAccount from './register/StepAccount';
import StepAbout from './register/StepAbout';
import StepDiabetes from './register/StepDiabetes';
import StepEmergency from './register/StepEmergency';
import StepReview from './register/StepReview';
import { useAuth } from '../../context/AuthContext';
import {
  validateAccount,
  validateAbout,
  validateDiabetes,
  validateEmergency,
  buildDateOfBirth,
  hasErrors,
} from '../../utils/validation';

const INITIAL_DATA = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  sex: '',
  weightKg: '',
  heightCm: '',
  diabetesType: '',
  diagnosisYear: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
};

const STEPS = [
  { key: 'account', title: 'Account', validate: validateAccount },
  { key: 'about', title: 'About you', validate: validateAbout },
  { key: 'diabetes', title: 'Diabetes', validate: validateDiabetes },
  { key: 'emergency', title: 'Emergency contact', validate: validateEmergency },
  { key: 'review', title: 'Review', validate: () => ({}) },
];

// The wizard holds flat state because that suits a form. The API takes a
// nested profile because that mirrors the data model. This lives here, not
// in api.js, because it is about this form rather than about the network.
function toApiPayload(data) {
  return {
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    profile: {
      dateOfBirth: buildDateOfBirth(data),
      sex: data.sex,
      weightKg: Number(data.weightKg),
      heightCm: Number(data.heightCm),
      diabetesType: data.diabetesType,
      diagnosisYear: Number(data.diagnosisYear),
      emergencyContact: {
        name: data.emergencyName.trim(),
        phone: data.emergencyPhone.trim(),
        relationship: data.emergencyRelationship,
      },
    },
  };
}

// Maps a server field path back onto the wizard field and its step, so a
// rejected submit lands the user on the right screen with the right error.
const SERVER_FIELD_MAP = {
  fullName: { field: 'fullName', step: 0 },
  email: { field: 'email', step: 0 },
  password: { field: 'password', step: 0 },
  'profile.dateOfBirth': { field: 'dobDay', step: 1 },
  'profile.sex': { field: 'sex', step: 1 },
  'profile.weightKg': { field: 'weightKg', step: 1 },
  'profile.heightCm': { field: 'heightCm', step: 1 },
  'profile.diabetesType': { field: 'diabetesType', step: 2 },
  'profile.diagnosisYear': { field: 'diagnosisYear', step: 2 },
  'profile.emergencyContact.name': { field: 'emergencyName', step: 3 },
  'profile.emergencyContact.phone': { field: 'emergencyPhone', step: 3 },
  'profile.emergencyContact.relationship': {
    field: 'emergencyRelationship',
    step: 3,
  },
};

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isLast = step === STEPS.length - 1;

  const handleChange = useCallback((field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const goToStep = useCallback((index) => {
    setErrors({});
    setStep(index);
  }, []);

  const handleBack = useCallback(() => {
    if (busy) return;
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setErrors({});
    setSubmitError(null);
    setStep((s) => s - 1);
  }, [step, navigation, busy]);

  const handleSubmit = useCallback(async () => {
    setBusy(true);
    setSubmitError(null);

    try {
      await signUp(toApiPayload(data));
      // signUp sets the user, which swaps the navigator to the tabs.
    } catch (err) {
      if (err.fields) {
        const mapped = {};
        let earliestStep = null;

        Object.entries(err.fields).forEach(([path, message]) => {
          const target = SERVER_FIELD_MAP[path];
          if (!target) return;
          mapped[target.field] = message;
          if (earliestStep === null || target.step < earliestStep) {
            earliestStep = target.step;
          }
        });

        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          setStep(earliestStep);
          setSubmitError('Please correct the highlighted fields.');
          setBusy(false);
          return;
        }
      }

      setSubmitError(
        err.code === 'NETWORK' || err.code === 'TIMEOUT'
          ? 'Cannot reach the server. Check your connection.'
          : err.message
      );
      setBusy(false);
    }
  }, [data, signUp]);

  const handleNext = useCallback(() => {
    const stepErrors = STEPS[step].validate(data);

    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }

    if (isLast) {
      handleSubmit();
      return;
    }

    setErrors({});
    setStep((s) => s + 1);
  }, [step, data, isLast, handleSubmit]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Step ${step + 1} of ${STEPS.length}`,
      headerBackVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} hitSlop={12} disabled={busy}>
          <Text style={[styles.headerBack, busy && styles.headerBackDisabled]}>
            Back
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, step, handleBack, busy]);

  function renderStep() {
    const props = { data, errors, onChange: handleChange };

    switch (STEPS[step].key) {
      case 'account':
        return <StepAccount {...props} />;
      case 'about':
        return <StepAbout {...props} />;
      case 'diabetes':
        return <StepDiabetes {...props} />;
      case 'emergency':
        return <StepEmergency {...props} />;
      case 'review':
        return <StepReview data={data} onGoToStep={goToStep} />;
      default:
        return null;
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.progressWrap}>
        <ProgressBar current={step} total={STEPS.length} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {submitError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLast ? 'Create account' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  progressWrap: { paddingHorizontal: 24, paddingTop: 8 },
  scroll: { padding: 24, paddingBottom: 40, gap: 16 },
  errorBox: { backgroundColor: '#fdecea', borderRadius: 8, padding: 12 },
  errorText: { color: '#b3261e', fontSize: 13, lineHeight: 18 },
  footer: {
    padding: 24,
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
  headerBack: { color: '#1b5fbf', fontSize: 16 },
  headerBackDisabled: { color: '#bbb' },
});
