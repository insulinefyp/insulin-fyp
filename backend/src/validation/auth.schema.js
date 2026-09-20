const { z } = require('zod');

// Kept identical to mobile/src/utils/validation.js on purpose. If the server
// is stricter than the client, the form passes locally and fails on submit,
// which is exactly the confusion validation is meant to prevent.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const currentYear = new Date().getFullYear();

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

const profileSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .refine((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 1 && age <= 120;
    }, 'Date of birth looks incorrect'),
  sex: z.enum(['female', 'male', 'other']),
  weightKg: z.number().min(10).max(300),
  heightCm: z.number().min(50).max(250),
  diabetesType: z.enum(['type1', 'type2_insulin_dependent']),
  diagnosisYear: z.number().int().min(1920).max(currentYear),
  emergencyContact: emergencyContactSchema,
});

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .regex(EMAIL_RE, 'Enter a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters'),
    profile: profileSchema,
  })
  .refine(
    (data) =>
      data.profile.diagnosisYear >=
      new Date(data.profile.dateOfBirth).getFullYear(),
    {
      message: 'Diagnosis cannot be before date of birth',
      path: ['profile', 'diagnosisYear'],
    }
  );

module.exports = { registerSchema };
