const { z } = require('zod');
const { FIELD_KEYS } = require('../config/safetyLimits');
const { checkTreatmentParameters } = require('../utils/treatmentRules');

// zod checks shape and type only. Ranges and cross-field rules come from
// checkTreatmentParameters, so there is exactly one definition of them.
const shape = {};
FIELD_KEYS.forEach((key) => {
  shape[key] = z.number({ message: 'Must be a number' });
});

const createTreatmentSchema = z
  .object({
    ...shape,
    changeNote: z.string().trim().max(200).optional(),
  })
  .strict()
  .superRefine((values, ctx) => {
    const errors = checkTreatmentParameters(values);
    Object.entries(errors).forEach(([path, message]) => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    });
  });

module.exports = { createTreatmentSchema };
