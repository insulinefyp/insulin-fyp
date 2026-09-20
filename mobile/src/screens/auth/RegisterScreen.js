import { useCallback, useLayoutEffect, useState } from 'react';
import {
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
import {
  validateAccount,
  validateAbout,
  validateDiabetes,
  validateEmergency,
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

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const [errors, setErrors] = useState({});

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
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setErrors({});
    setStep((s) => s - 1);
  }, [step, navigation]);

  const handleNext = useCallback(() => {
    const stepErrors = STEPS[step].validate(data);

    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }

    if (isLast) {
      // Stage 1.4 submits the whole object to POST /api/auth/register here.
      return;
    }

    setErrors({});
    setStep((s) => s + 1);
  }, [step, data, isLast]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Step ${step + 1} of ${STEPS.length}`,
      headerBackVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} hitSlop={12}>
          <Text style={styles.headerBack}>Back</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, step, handleBack]);

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
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLast ? 'Create account' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  progressWrap: { paddingHorizontal: 24, paddingTop: 8 },
  scroll: { padding: 24, paddingBottom: 40 },
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
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerBack: { color: '#1b5fbf', fontSize: 16 },
});
