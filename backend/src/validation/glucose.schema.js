const { z } = require('zod');
const { SCENARIO_KEYS } = require('../simulation/scenarios');
const { RANGE_KEYS, DEFAULT_RANGE } = require('../config/glucoseRanges');

const simulatorControlSchema = z
  .object({
    scenario: z.enum([...SCENARIO_KEYS]).optional(),
    paused: z.boolean().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'No changes supplied',
  });

const historyQuerySchema = z.object({
  range: z.enum([...RANGE_KEYS]).default(DEFAULT_RANGE),
});

module.exports = { simulatorControlSchema, historyQuerySchema };
