const { Schema, model } = require('mongoose');

const localized = { en: { type: String, required: true }, hi: String };
const localizedList = { en: { type: [String], default: [] }, hi: { type: [String], default: [] } };

/**
 * One document per competition.
 *
 * - Everything the details page shows that rarely changes (content, judge, rewards, rules)
 *   is embedded so a page load is a single read.
 * - `spotsTaken` is the ONLY hot field. It is a counter that includes confirmed registrations
 *   AND unexpired payment holds, and is only ever changed through atomic conditional updates
 *   (see registrationService). That is what makes overbooking impossible.
 * - Money is stored in whole rupees (INR). Converted to paise only at the payment boundary.
 */
const CompetitionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: localized,
    category: { key: { type: String, required: true }, label: localized },
    format: { type: String, enum: ['SINGLE_WIN', 'MULTI_WIN'], required: true },
    hasCertificate: { type: Boolean, default: false },

    entryFee: { type: Number, min: 0, required: true },
    rewards: {
      type: [{ _id: false, position: { type: Number, min: 1, required: true }, amount: { type: Number, min: 0, required: true } }],
      validate: [(r) => r.length > 0, 'At least one reward is required'],
    },

    maxSpots: { type: Number, min: 1, required: true },
    spotsTaken: { type: Number, min: 0, default: 0 },

    // Lifecycle. All instants are stored as UTC; the client formats them in IST.
    registrationOpensAt: Date, // optional: open immediately when absent
    registrationDeadline: { type: Date, required: true },
    submissionStartsAt: { type: Date, required: true },
    submissionEndsAt: { type: Date, required: true },
    resultDate: { type: Date, required: true },

    judgeId: { type: Schema.Types.ObjectId, ref: 'Judge', required: true },
    previousWinners: [{ _id: false, name: String, position: Number, thumbnailUrl: String, videoUrl: String }],

    about: localizedList,
    judgingParameters: [{ _id: false, name: localized, weight: { type: Number, min: 0, max: 100 } }],
    rules: localizedList,

    prizeVideoUrl: String,
    refundPolicyUrl: String,
    ad: { imageUrl: String, targetUrl: String },

    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'], default: 'PUBLISHED', index: true },
  },
  { timestamps: true }
);

CompetitionSchema.virtual('prizePool').get(function prizePool() {
  return this.rewards.reduce((sum, r) => sum + r.amount, 0);
});

CompetitionSchema.pre('validate', function validateLifecycle(next) {
  const t = (d) => (d ? new Date(d).getTime() : null);
  const opens = t(this.registrationOpensAt);
  const deadline = t(this.registrationDeadline);
  const subStart = t(this.submissionStartsAt);
  const subEnd = t(this.submissionEndsAt);
  const result = t(this.resultDate);

  if (opens && deadline && opens >= deadline) return next(new Error('registrationOpensAt must be before registrationDeadline'));
  if (subStart && subEnd && subStart >= subEnd) return next(new Error('submissionStartsAt must be before submissionEndsAt'));
  // Registration may overlap the submission window (as in the design) but must close before submissions end.
  if (deadline && subEnd && deadline > subEnd) return next(new Error('registrationDeadline must not be after submissionEndsAt'));
  if (subEnd && result && subEnd > result) return next(new Error('submissionEndsAt must not be after resultDate'));

  const positions = this.rewards.map((r) => r.position);
  if (new Set(positions).size !== positions.length) return next(new Error('Reward positions must be unique'));
  if (this.spotsTaken > this.maxSpots) return next(new Error('spotsTaken cannot exceed maxSpots'));
  next();
});

module.exports = model('Competition', CompetitionSchema);
