const mongoose = require('mongoose');

const glucoseReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Integer mg/dL, within the range real CGM sensors report.
    valueMgdl: {
      type: Number,
      required: true,
      min: 40,
      max: 400,
    },
    recordedAt: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      enum: ['simulator', 'cgm'],
      required: true,
    },
  },
  { versionKey: false }
);

glucoseReadingSchema.index({ userId: 1, recordedAt: -1 });

glucoseReadingSchema.methods.toSafeObject = function toSafeObject() {
  return {
    valueMgdl: this.valueMgdl,
    recordedAt: this.recordedAt,
    source: this.source,
  };
};

module.exports = mongoose.model('GlucoseReading', glucoseReadingSchema);
