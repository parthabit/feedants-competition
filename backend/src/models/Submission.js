const { Schema, model } = require('mongoose');

/** One submission per participant per competition; re-submitting replaces it until the deadline. */
const SubmissionSchema = new Schema(
  {
    competitionId: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
    videoUrl: { type: String, required: true },
    caption: { type: String, maxlength: 300 },
    version: { type: Number },
    firstSubmittedAt: Date,
    submittedAt: Date,
  },
  { timestamps: true }
);

SubmissionSchema.index({ competitionId: 1, userId: 1 }, { unique: true });

module.exports = model('Submission', SubmissionSchema);
