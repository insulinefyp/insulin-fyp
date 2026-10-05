const mongoose = require('mongoose');

// A period outside the normal range, with its duration. Insulin degradation
// depends on cumulative exposure, so "above 30 C for 17 minutes, peak 33.4"
// is the meaningful record — not the individual readings that made it up.
const temperatureExcursionSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['critical_cold', 'warning_hot', 'critical_hot'],
      required: true,
    },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    peakCelsius: { type: Number, required: true },
    readingCount: { type: Number, default: 1 },
    simulated: { type: Boolean, default: false },
  },
  { versionKey: false }
);

temperatureExcursionSchema.index({ deviceId: 1, startedAt: -1 });

temperatureExcursionSchema.virtual('durationSeconds').get(function duration() {
  const end = this.endedAt || new Date();
  return Math.floor((end - this.startedAt) / 1000);
});

temperatureExcursionSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    status: this.status,
    startedAt: this.startedAt,
    endedAt: this.endedAt,
    ongoing: this.endedAt === null,
    durationSeconds: this.durationSeconds,
    peakCelsius: this.peakCelsius,
    readingCount: this.readingCount,
    simulated: this.simulated,
  };
};

module.exports = mongoose.model('TemperatureExcursion', temperatureExcursionSchema);
