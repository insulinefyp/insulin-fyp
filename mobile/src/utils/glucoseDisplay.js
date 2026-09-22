// Display classification only. It decides colour and wording on screen;
// nothing here decides or recommends a delivery.

const FALLBACK_TARGET = { low: 70, high: 180 };
export const URGENT_LOW_MGDL = 54;

export function classifyRange(valueMgdl, params) {
  const low = params?.targetGlucoseLowMgdl ?? FALLBACK_TARGET.low;
  const high = params?.targetGlucoseHighMgdl ?? FALLBACK_TARGET.high;

  if (valueMgdl < URGENT_LOW_MGDL) return 'urgentLow';
  if (valueMgdl < low) return 'low';
  if (valueMgdl > high) return 'high';
  return 'inRange';
}

export const RANGE_STYLE = {
  urgentLow: { label: 'Urgent low', color: '#b3261e', bg: '#fdecea' },
  low: { label: 'Below target', color: '#b3261e', bg: '#fdecea' },
  inRange: { label: 'In target', color: '#1b7f3b', bg: '#e8f5ec' },
  high: { label: 'Above target', color: '#8a5300', bg: '#fff4e5' },
};

// Stale overrides every range colour. An old value must not look actionable.
export const STALE_STYLE = { label: 'Stale', color: '#6b6b6b', bg: '#f0f0f0' };

// The server's age at response time, plus time elapsed on this device since
// that response. Uses the server's measurement rather than the phone's
// clock, so a wrong device clock cannot distort it, and keeps counting when
// the server can no longer be reached.
export function liveAgeSeconds(data, dataUpdatedAt, now) {
  if (!data?.reading || data.ageSeconds === null) return null;
  const sinceFetch = Math.max(0, Math.floor((now - dataUpdatedAt) / 1000));
  return data.ageSeconds + sinceFetch;
}

export function liveStatus(data, ageSeconds) {
  if (!data?.reading) return 'no_data';
  return ageSeconds > data.staleAfterSeconds ? 'stale' : 'fresh';
}

export function formatAge(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min ago`;
}
