const { z } = require('zod');
const { SCENARIO_KEYS } = require('../simulation/scenarios');

const simulatorControlSchema = z
  .object({
    scenario: z.enum([...SCENARIO_KEYS]).optional(),
    paused: z.boolean().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'No changes supplied',
  });

module.exports = { simulatorControlSchema };
