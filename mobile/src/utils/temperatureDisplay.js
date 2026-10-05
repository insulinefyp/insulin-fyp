// Display classification only. The backend decides the status; this maps it
// to wording and colour.

export const TEMP_STYLE = {
  normal: {
    label: 'Normal',
    color: '#1b7f3b',
    bg: '#e8f5ec',
    detail: 'Within the safe storage range.',
  },
  warning_hot: {
    label: 'Too warm',
    color: '#8a5300',
    bg: '#fff4e5',
    detail: 'Above 30 °C. Prolonged exposure degrades insulin.',
  },
  critical_hot: {
    label: 'Critically hot',
    color: '#b3261e',
    bg: '#fdecea',
    detail: 'Above 37 °C. Insulin may be compromised.',
  },
  critical_cold: {
    label: 'Critically cold',
    color: '#b3261e',
    bg: '#fdecea',
    detail: 'Below 2 °C. Freezing destroys insulin.',
  },
  unavailable: {
    label: 'Unavailable',
    color: '#6b6b6b',
    bg: '#f0f0f0',
    detail: 'No reading from the temperature sensor.',
  },
};

export const STALE_TEMP_STYLE = {
  label: 'Stale',
  color: '#6b6b6b',
  bg: '#f0f0f0',
  detail: 'No recent reading from the device.',
};

export function isCritical(status) {
  return status === 'critical_hot' || status === 'critical_cold';
}

export function isAlert(status) {
  return isCritical(status) || status === 'warning_hot';
}

export function formatCelsius(celsius) {
  if (celsius === null || celsius === undefined) return '—';
  return `${celsius.toFixed(1)}`;
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}
