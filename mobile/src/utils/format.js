function pad(n) {
  return String(n).padStart(2, '0');
}

// Dates of birth are stored as UTC midnight, so reading the UTC parts avoids
// showing the previous day in timezones behind UTC.
export function formatDateOnly(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export const SEX_LABELS = { female: 'Female', male: 'Male', other: 'Other' };

export const DIABETES_LABELS = {
  type1: 'Type 1',
  type2_insulin_dependent: 'Type 2 (insulin-dependent)',
};

export const RELATIONSHIP_LABELS = {
  parent: 'Parent',
  spouse: 'Spouse',
  sibling: 'Sibling',
  friend: 'Friend',
  other: 'Other',
};

export const FIELD_LABELS = {
  weightKg: { label: 'Weight', unit: 'kg' },
  heightCm: { label: 'Height', unit: 'cm' },
};
