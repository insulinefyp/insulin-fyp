const { z } = require('zod');

const emergencyContactSchema = z.object({
  name: z.string().trim().min(2, 'Enter a contact name'),
  phone: z
    .string()
    .trim()
    .refine((v) => {
      const digits = v.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, 'Enter a valid phone number'),
  relationship: z.enum(['parent', 'spouse', 'sibling', 'friend', 'other']),
});

// Only these four are editable. Date of birth, sex, diabetes type and
// diagnosis year do not change, so .strict() rejects them outright rather
// than dropping them silently and letting the client think it worked.
const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').optional(),
    weightKg: z
      .number()
      .min(10, 'Weight must be at least 10 kg')
      .max(300, 'Weight must be at most 300 kg')
      .optional(),
    heightCm: z
      .number()
      .min(50, 'Height must be at least 50 cm')
      .max(250, 'Height must be at most 250 cm')
      .optional(),
    emergencyContact: emergencyContactSchema.optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'No changes supplied',
  });

module.exports = { updateProfileSchema };
