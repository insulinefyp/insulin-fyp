const GlucoseReading = require('../../models/glucoseReading.model');

// Glucose source interface. Every source exposes exactly:
//
//   getCurrentReading(userId)                -> reading | null
//   getHistory(userId, { from, to, limit })  -> readings, oldest first
//
// where a reading is { valueMgdl, recordedAt, source }.
//
// A real CGM integration would be a sibling file implementing the same two
// functions. Nothing that calls them would change.

async function getCurrentReading(userId) {
  const reading = await GlucoseReading.findOne({ userId, source: 'simulator' })
    .sort({ recordedAt: -1 });
  return reading ? reading.toSafeObject() : null;
}

async function getHistory(userId, { from, to = new Date(), limit = 2000 } = {}) {
  const query = { userId, source: 'simulator', recordedAt: { $lte: to } };
  if (from) query.recordedAt.$gte = from;

  // Newest first so `limit` keeps the most recent readings, then reversed
  // so callers always receive chronological order.
  const rows = await GlucoseReading.find(query)
    .sort({ recordedAt: -1 })
    .limit(limit);

  return rows.reverse().map((r) => r.toSafeObject());
}

module.exports = { name: 'simulator', getCurrentReading, getHistory };
