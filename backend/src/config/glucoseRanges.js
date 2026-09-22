// Chart windows and how each is summarised. Defined once here and served to
// the mobile app, so there is no second copy of these numbers.
//
// bucketMinutes 0 means raw readings, one point each. Longer windows are
// averaged into buckets: 1440 per-minute readings would overwhelm both the
// chart library and the eye.

function range(def) {
  return Object.freeze(def);
}

const RANGES = Object.freeze({
  '1h': range({ label: '1 h', hours: 1, bucketMinutes: 0 }),
  '3h': range({ label: '3 h', hours: 3, bucketMinutes: 0 }),
  '6h': range({ label: '6 h', hours: 6, bucketMinutes: 3 }),
  '12h': range({ label: '12 h', hours: 12, bucketMinutes: 5 }),
  '24h': range({ label: '24 h', hours: 24, bucketMinutes: 10 }),
});

const RANGE_KEYS = Object.freeze(Object.keys(RANGES));
const DEFAULT_RANGE = '3h';

// Window used for the trend arrow. Long enough that noise averages out,
// short enough to reflect what glucose is doing now.
const TREND_WINDOW_MINUTES = 15;

module.exports = { RANGES, RANGE_KEYS, DEFAULT_RANGE, TREND_WINDOW_MINUTES };
