const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const auth = require('../middleware/auth');
const { validate, validObjectIdParam } = require('../middleware/validate');
const { parseLang } = require('../utils/localize');
const { getCompetitionView, listCompetitions } = require('../services/competitionView');
const registrations = require('../services/registrationService');
const { submitEntry } = require('../services/submissionService');

const router = express.Router();
router.use(auth);

// Per-user throttle on write endpoints (double taps, scripts). Reads are cheap and unthrottled here;
// put a CDN / API gateway limit in front for anything more.
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  handler: (req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } }),
});

const langOf = (req) => parseLang(req.query.lang || req.header('accept-language'));
const idCheck = validObjectIdParam('id');

router.get('/', async (req, res, next) => {
  try {
    res.json({ competitions: await listCompetitions(langOf(req)) });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', idCheck, async (req, res, next) => {
  try {
    const view = await getCompetitionView({ competitionId: req.params.id, user: req.user, lang: langOf(req) });
    res.set('Cache-Control', 'no-store'); // per-user + live counters: never cache at the edge
    res.json(view);
  } catch (e) {
    next(e);
  }
});

// Start (or resume) registration: reserves a spot and returns the payment order.
router.post('/:id/registrations', idCheck, writeLimiter, async (req, res, next) => {
  try {
    const { registration, payment, resumed } = await registrations.startRegistration({
      competitionId: req.params.id,
      user: req.user,
    });
    res.status(resumed ? 200 : 201).json({
      registration: {
        id: String(registration._id),
        status: registration.status,
        holdExpiresAt: registration.holdExpiresAt || null,
      },
      payment, // null for free competitions (already CONFIRMED)
    });
  } catch (e) {
    next(e);
  }
});

const verifySchema = z.object({
  orderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().min(1).max(300),
});

router.post('/:id/registrations/verify', idCheck, writeLimiter, validate(verifySchema), async (req, res, next) => {
  try {
    const { registration, outcome } = await registrations.verifyAndConfirm({
      competitionId: req.params.id,
      user: req.user,
      ...req.body,
    });
    res.json({ registration: { id: String(registration._id), status: registration.status }, outcome });
  } catch (e) {
    next(e);
  }
});

// User dismissed the payment sheet: give the spot back right away.
router.delete('/:id/registrations/pending', idCheck, writeLimiter, async (req, res, next) => {
  try {
    res.json(await registrations.cancelPendingRegistration({ competitionId: req.params.id, user: req.user }));
  } catch (e) {
    next(e);
  }
});

const submissionSchema = z.object({
  videoUrl: z
    .string()
    .trim()
    .url('Enter a valid link')
    .max(2048)
    .refine((u) => /^https?:\/\//i.test(u), 'Link must start with http:// or https://'),
  caption: z.string().trim().max(300).optional(),
});

router.post('/:id/submission', idCheck, writeLimiter, validate(submissionSchema), async (req, res, next) => {
  try {
    const s = await submitEntry({ competitionId: req.params.id, user: req.user, ...req.body });
    res.status(201).json({ submission: { videoUrl: s.videoUrl, submittedAt: s.submittedAt, version: s.version } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
