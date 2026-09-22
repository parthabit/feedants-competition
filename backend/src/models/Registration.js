const { Schema, model } = require('mongoose');

/**
 * A user's claim on a spot.
 *
 *   PENDING_PAYMENT  spot is held (counted in competition.spotsTaken) until holdExpiresAt
 *   CONFIRMED        paid (or free) - the user is a participant
 *   EXPIRED          hold ran out before payment, spot released
 *   CANCELLED        user dismissed the payment, spot released
 *   REFUND_PENDING   money was captured after the hold expired and the spot could not be
 *                    re-claimed -> needs a refund
 *
 * `active` is true for PENDING_PAYMENT / CONFIRMED only. A partial unique index on
 * (competitionId, userId, active:true) guarantees a user can never hold two live
 * registrations, while still keeping history for expired / cancelled attempts.
 */
const RegistrationSchema = new Schema(
  {
    competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'REFUND_PENDING'],
      required: true,
    },
    active: { type: Boolean, required: true },

    amount: { type: Number, min: 0, required: true }, // INR charged, snapshot at registration time
    provider: { type: String, enum: ['none', 'mock', 'razorpay'], default: 'none' },
    orderId: String,
    paymentId: String,

    holdExpiresAt: Date,
    paidAt: Date,
    releasedAt: Date,
  },
  { timestamps: true }
);

RegistrationSchema.index(
  { competitionId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { active: true }, name: 'one_active_registration_per_user' }
);
RegistrationSchema.index(
  { orderId: 1 },
  { unique: true, partialFilterExpression: { orderId: { $type: 'string' } }, name: 'unique_order' }
);
// Powers the hold sweeper
RegistrationSchema.index(
  { holdExpiresAt: 1 },
  { partialFilterExpression: { status: 'PENDING_PAYMENT' }, name: 'pending_holds' }
);
RegistrationSchema.index({ userId: 1, createdAt: -1 });

module.exports = model('Registration', RegistrationSchema);
