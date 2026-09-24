const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const Judge = require('../models/Judge');
const TtlCache = require('../utils/ttlCache');
const config = require('../config');
const { Errors } = require('../utils/AppError');
const { pick, pickList } = require('../utils/localize');
const {
  computeWindows,
  computePhase,
  computeCountdown,
  computeSpots,
  effectiveRegistration,
  computeCta,
} = require('./lifecycle');

const staticCache = new TtlCache(config.staticCacheTtlMs);

const loadStatic = (id) =>
  staticCache.getOrLoad(String(id), () =>
    Competition.findOne({
      _id: id,
      status: { $in: ['PUBLISHED', 'CANCELLED'] },
    })
      .select('-spotsTaken')
      .populate('judgeId')
      .lean()
  );

function judgeView(judge, lang) {
  if (!judge) return null;

  return {
    name: pick(judge.name, lang),
    title: pick(judge.title, lang),
    experienceYears: judge.experienceYears,
    photoUrl: judge.photoUrl || null,
    introVideoUrl: judge.introVideoUrl || null,
  };
}

async function getCompetitionView({ competitionId, user, lang, now = new Date() }) {
  const [content, live, regDoc, submission] = await Promise.all([
    loadStatic(competitionId),
    Competition.findById(competitionId)
      .select('spotsTaken status')
      .lean(),
    Registration.findOne({
      competitionId,
      userId: user._id,
      active: true,
    })
      .select('status holdExpiresAt')
      .lean(),
    Submission.findOne({
      competitionId,
      userId: user._id,
    })
      .select('videoUrl submittedAt version')
      .lean(),
  ]);

  if (!content || !live) throw Errors.notFound();

  const c = { ...content, status: live.status };

  const windows = computeWindows(c, now);
  const phase = computePhase(c, windows);
  const spots = computeSpots(c.maxSpots, live.spotsTaken);

  const registration = effectiveRegistration(regDoc, now);

  const hasSubmission =
    Boolean(submission) && registration?.status === 'CONFIRMED';

  const rewards = [...(c.rewards || [])].sort(
    (a, b) => a.position - b.position
  );

  return {
    serverTime: now.toISOString(),

    id: String(c._id),
    title: pick(c.title, lang),

    category: {
      key: c.category.key,
      label: pick(c.category.label, lang),
    },

    format: c.format,
    hasCertificate: c.hasCertificate,
    status: c.status,
    phase,

    prizePool: rewards.reduce((sum, r) => sum + (r.amount || 0), 0),
    entryFee: c.entryFee,
    currency: 'INR',
    spots,

    viewer: {
      registration: registration
        ? {
            status: registration.status,
            holdExpiresAt: registration.holdExpiresAt
              ? new Date(registration.holdExpiresAt).toISOString()
              : null,
          }
        : null,

      submission: hasSubmission
        ? {
            videoUrl: submission.videoUrl,
            submittedAt: submission.submittedAt
              ? new Date(submission.submittedAt).toISOString()
              : null,
            version: submission.version,
          }
        : null,
    },

    windows,

    countdown: computeCountdown(
      c,
      windows,
      now,
      config.hurryThresholdHours
    ),

    importantDates: [
      { key: 'REGISTER_BEFORE', at: windows.registration.closesAt },
      { key: 'SUBMISSION_STARTS', at: windows.submission.opensAt },
      { key: 'SUBMISSION_ENDS', at: windows.submission.closesAt },
      { key: 'RESULT_DATE', at: windows.result.at },
    ],

    judge: judgeView(c.judgeId, lang),

    previousWinners: (c.previousWinners || []).map((w) => ({
      name: w.name,
      position: w.position,
      thumbnailUrl: w.thumbnailUrl || null,
      videoUrl: w.videoUrl || null,
    })),

    tabs: {
      about: pickList(c.about, lang),
      judgingParameters: (c.judgingParameters || []).map((p) => ({
        name: pick(p.name, lang),
        weight: p.weight,
      })),
      rules: pickList(c.rules, lang),
    },

    rewards,

    links: {
      prizeVideoUrl: c.prizeVideoUrl || null,
      refundPolicyUrl: c.refundPolicyUrl || null,
    },

    referral: {
      link: `${config.referral.baseUrl}/${user.referralCode}`,
      rewardPerSignup: config.referral.rewardInr,
    },

    ad: c.ad?.imageUrl
      ? {
          imageUrl: c.ad.imageUrl,
          targetUrl: c.ad.targetUrl || null,
        }
      : null,

    cta: computeCta({
      phase,
      windows,
      registration,
      hasSubmission,
      spots,
    }),
  };
}

async function listCompetitions(lang) {
  const docs = await Competition.find({
    status: { $in: ['PUBLISHED', 'CANCELLED'] },
  })
    .select(
      'title category spotsTaken maxSpots registrationDeadline'
    )
    .sort({ createdAt: 1 })
    .lean();

  return docs.map((d) => ({
    id: String(d._id),
    title: pick(d.title, lang),
    category: pick(d.category.label, lang),
    spotsLeft: d.maxSpots - d.spotsTaken,
  }));
}

module.exports = {
  getCompetitionView,
  listCompetitions,
  staticCache,
};