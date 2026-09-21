const mongoose = require('mongoose');
const { FIELDS, FIELD_KEYS } = require('../config/safetyLimits');

// Built from the same constants as the rules, so the database-level bounds
// can never drift from the API-level ones.
const parameterFields = {};
FIELD_KEYS.forEach((key) => {
  const def = FIELDS[key];
  parameterFields[key] = {
    type: Number,
    required: true,
    min: def.min,
    max: def.max,
  };
});

// Versioned and immutable. Each change is a new document with version N+1;
// the highest version is active. Nothing updates or deletes these, so a
// delivery record can always point at the exact limits it was checked against.
const treatmentParametersSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    ...parameterFields,
    changeNote: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

treatmentParametersSchema.index({ userId: 1, version: -1 }, { unique: true });

treatmentParametersSchema.methods.toSafeObject = function toSafeObject() {
  const out = {
    id: this._id.toString(),
    version: this.version,
    changeNote: this.changeNote || null,
    createdAt: this.createdAt,
  };
  FIELD_KEYS.forEach((key) => {
    out[key] = this[key];
  });
  return out;
};

module.exports = mongoose.model('TreatmentParameters', treatmentParametersSchema);
