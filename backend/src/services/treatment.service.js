const TreatmentParameters = require('../models/treatmentParameters.model');
const AppError = require('../utils/AppError');
const { checkTreatmentParameters } = require('../utils/treatmentRules');
const {
  GLUCOSE_UNIT,
  FIELDS,
  FIELD_KEYS,
  RAISE_SENSITIVE,
} = require('../config/safetyLimits');

function getActive(userId) {
  return TreatmentParameters.findOne({ userId }).sort({ version: -1 });
}

async function getCurrent(user) {
  const active = await getActive(user._id);
  return {
    isSet: Boolean(active),
    glucoseUnit: GLUCOSE_UNIT,
    parameters: active ? active.toSafeObject() : null,
  };
}

// For stages 8, 10 and 11. With no parameters there is nothing to validate a
// delivery against, so the safe default is to refuse.
async function requireActiveParameters(userId) {
  const active = await getActive(userId);
  if (!active) {
    throw new AppError(
      'Treatment parameters have not been set. Delivery is disabled until they are.',
      409,
      'PARAMETERS_NOT_SET'
    );
  }
  return active;
}

async function createVersion(user, input) {
  const { changeNote, ...values } = input;

  // Runs again even though zod already ran it. The service is the layer that
  // must hold if a future route forgets the schema.
  const errors = checkTreatmentParameters(values);
  if (Object.keys(errors).length > 0) {
    const err = new AppError(
      'Treatment parameters failed safety checks',
      400,
      'VALIDATION_ERROR'
    );
    err.fields = errors;
    throw err;
  }

  const previous = await getActive(user._id);

  if (previous && FIELD_KEYS.every((k) => previous[k] === values[k])) {
    throw new AppError(
      'These values match the current parameters',
      400,
      'NO_CHANGES'
    );
  }

  const raisedLimits = previous
    ? RAISE_SENSITIVE.filter((k) => values[k] > previous[k])
    : [];

  const created = await TreatmentParameters.create({
    userId: user._id,
    version: previous ? previous.version + 1 : 1,
    ...values,
    changeNote: changeNote || undefined,
    createdBy: user._id,
  });

  return {
    parameters: created.toSafeObject(),
    previousVersion: previous ? previous.version : null,
    raisedLimits,
  };
}

async function getHistory(user, limit = 20) {
  const versions = await TreatmentParameters.find({ userId: user._id })
    .sort({ version: -1 })
    .limit(Math.min(limit, 100));

  return { versions: versions.map((v) => v.toSafeObject()) };
}

function getLimits() {
  return {
    glucoseUnit: GLUCOSE_UNIT,
    fields: FIELDS,
    raiseSensitive: RAISE_SENSITIVE,
  };
}

module.exports = {
  getCurrent,
  requireActiveParameters,
  createVersion,
  getHistory,
  getLimits,
};
