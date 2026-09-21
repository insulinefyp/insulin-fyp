const mongoose = require('mongoose');

// Append-only. There is deliberately no update or delete path: an audit
// trail that can be rewritten is not an audit trail.
const profileChangeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    field: {
      type: String,
      required: true,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: 'changedAt', updatedAt: false } }
);

module.exports = mongoose.model('ProfileChange', profileChangeSchema);
