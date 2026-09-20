const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common typos of popular providers. A match is a suggestion, never a block:
// no validator can know whether an address is real, only whether it is shaped
// like one. Rejecting a legitimate address is worse than accepting a typo.
const DOMAIN_TYPOS = {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yahoo.con': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'icloud.con': 'icloud.com',
};

export function suggestEmailFix(email) {
  if (!email || !EMAIL_RE.test(email.trim())) return null;
  const domain = email.trim().toLowerCase().split('@')[1];
  const fix = DOMAIN_TYPOS[domain];
  return fix ? email.trim().replace(new RegExp(`${domain}$`, 'i'), fix) : null;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

// Builds an ISO date string, or null if the parts do not form a real date.
// Catches 31 February, which per-field range checks alone would accept.
export function buildDateOfBirth({ dobDay, dobMonth, dobYear }) {
  const d = Number(dobDay);
  const m = Number(dobMonth);
  const y = Number(dobYear);

  if (!d || !m || !y) return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d;

  return valid ? date.toISOString().slice(0, 10) : null;
}

export function calculateAge(isoDate) {
  if (!isoDate) return null;
  const dob = new Date(isoDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function validateAccount(data) {
  const errors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name';
  }
  if (!data.email || !EMAIL_RE.test(data.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.password || data.password.length < 8) {
    errors.password = 'Use at least 8 characters';
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function validateAbout(data) {
  const errors = {};

  const iso = buildDateOfBirth(data);
  if (!iso) {
    errors.dobDay = 'Enter a valid date of birth';
  } else {
    const age = calculateAge(iso);
    if (age < 1 || age > 120) {
      errors.dobDay = 'Date of birth looks incorrect';
    }
  }

  if (!data.sex) {
    errors.sex = 'Select an option';
  }

  const weight = Number(data.weightKg);
  if (!data.weightKg || Number.isNaN(weight)) {
    errors.weightKg = 'Enter your weight';
  } else if (weight < 10 || weight > 300) {
    errors.weightKg = 'Enter a weight between 10 and 300 kg';
  }

  const height = Number(data.heightCm);
  if (!data.heightCm || Number.isNaN(height)) {
    errors.heightCm = 'Enter your height';
  } else if (height < 50 || height > 250) {
    errors.heightCm = 'Enter a height between 50 and 250 cm';
  }

  return errors;
}

export function validateDiabetes(data) {
  const errors = {};

  if (!data.diabetesType) {
    errors.diabetesType = 'Select your diabetes type';
  }

  const year = Number(data.diagnosisYear);
  const thisYear = new Date().getFullYear();

  if (!data.diagnosisYear || Number.isNaN(year)) {
    errors.diagnosisYear = 'Enter the year you were diagnosed';
  } else if (year < 1920 || year > thisYear) {
    errors.diagnosisYear = `Enter a year between 1920 and ${thisYear}`;
  } else {
    const iso = buildDateOfBirth(data);
    if (iso && year < new Date(iso).getFullYear()) {
      errors.diagnosisYear = 'Diagnosis cannot be before your date of birth';
    }
  }

  return errors;
}

export function validateEmergency(data) {
  const errors = {};

  if (!data.emergencyName || data.emergencyName.trim().length < 2) {
    errors.emergencyName = 'Enter a contact name';
  }

  const digits = (data.emergencyPhone || '').replace(/\D/g, '');
  if (!digits) {
    errors.emergencyPhone = 'Enter a contact phone number';
  } else if (digits.length < 7 || digits.length > 15) {
    errors.emergencyPhone = 'Enter a valid phone number';
  }

  if (!data.emergencyRelationship) {
    errors.emergencyRelationship = 'Select a relationship';
  }

  return errors;
}
