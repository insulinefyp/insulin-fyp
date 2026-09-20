const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    sex: {
      type: String,
      enum: ['female', 'male', 'other'],
      required: true,
    },
    weightKg: {
      type: Number,
      required: true,
      min: [10, 'Weight must be at least 10 kg'],
      max: [300, 'Weight must be at most 300 kg'],
    },
    heightCm: {
      type: Number,
      required: true,
      min: [50, 'Height must be at least 50 cm'],
      max: [250, 'Height must be at most 250 cm'],
    },
    diabetesType: {
      type: String,
      enum: ['type1', 'type2_insulin_dependent'],
      required: true,
    },
    diagnosisYear: {
      type: Number,
      required: true,
      min: 1920,
      max: new Date().getFullYear(),
    },
    emergencyContact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      relationship: {
        type: String,
        enum: ['parent', 'spouse', 'sibling', 'friend', 'other'],
        required: true,
      },
    },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

patientProfileSchema.virtual('age').get(function getAge() {
  if (!this.dateOfBirth) return null;
  const now = new Date();
  let age = now.getFullYear() - this.dateOfBirth.getFullYear();
  const m = now.getMonth() - this.dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < this.dateOfBirth.getDate())) age -= 1;
  return age;
});

patientProfileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
