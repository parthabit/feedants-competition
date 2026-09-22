const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const { Errors } = require('../utils/AppError');
const { computeWindows } = require('./lifecycle');

/** Only confirmed participants, only inside the submission window. Re-submitting replaces the previous entry. */
async function submitEntry({ competitionId, user, videoUrl, caption, now = new Date() }) {
  const competition = await Competition.findById(competitionId)
    .select('status submissionStartsAt submissionEndsAt registrationDeadline registrationOpensAt resultDate')
    .lean();
  if (!competition || competition.status === 'DRAFT') throw Errors.notFound();
  if (competition.status === 'CANCELLED') throw Errors.competitionUnavailable();

  const registration = await Registration.findOne({ competitionId, userId: user._id, status: 'CONFIRMED' }).select('_id').lean();
  if (!registration) throw Errors.notRegistered();

  const w = computeWindows(competition, now);
  if (w.submission.upcoming) throw Errors.submissionNotOpen();
  if (w.submission.closed) throw Errors.submissionClosed();

  const upsert = () =>
    Submission.findOneAndUpdate(
      { competitionId, userId: user._id },
      {
        $set: { videoUrl, caption, registrationId: registration._id, submittedAt: now },
        $setOnInsert: { firstSubmittedAt: now },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: false }
    );

  try {
    return await upsert();
  } catch (err) {
    // Two simultaneous first-time submits can both try to insert; the loser simply retries as an update.
    if (err.code === 11000) return upsert();
    throw err;
  }
}

module.exports = { submitEntry };
