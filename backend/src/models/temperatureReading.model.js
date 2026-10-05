const mongoose = require('mongoose');

// Stored on meaningful change rather than on every poll (see
// shouldStoreReading in utils/temperatureRules.js).
const temperatureReadingSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    celsius: { type: Number, required: true },
    status: {
      type: String,
      enum: ['critical_cold', 'normal', 'warning_hot', 'critical_hot'],
      required: true,
    },
    // True when the firmware's test override supplied the value. Kept so a
    // forced reading can never be mistaken for a real measurement.
    simulated: { type: Boolean, default: false },
    recordedAt: { type: Date, required: true },
  },
  { versionKey: false }
);

temperatureReadingSchema.index({ deviceId: 1, recordedAt: -1 });

temperatureReadingSchema.methods.toSafeObject = function toSafeObject() {
  return {
    celsius: this.celsius,
    status: this.status,
    simulated: this.simulated,
    recordedAt: this.recordedAt,
  };
};

module.exports = mongoose.model('TemperatureReading', temperatureReadingSchema);
