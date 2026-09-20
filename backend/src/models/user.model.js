const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor'],
      default: 'patient',
    },
  },
  { timestamps: true }
);

// Hashing lives here, not in a service, so no code path can store a
// plaintext password by forgetting a step.
//
// Async middleware is promise-based: Mongoose does not pass `next` to an
// async function, so this returns instead of calling next(), and a thrown
// error aborts the save on its own.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash')) return;

  this.passwordHash = await bcrypt.hash(this.passwordHash, config.bcryptRounds);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
