const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeWindows,
  computePhase,
  computeCountdown,
  computeSpots,
  effectiveRegistration,
  computeCta,
} = require('../src/services/lifecycle');

const H = 3600e3;
const NOW = new Date('2026-08-05T10:00:00Z');
const at = (h) => new Date(NOW.getTime() + h * H);

// Mirrors the design: submissions start BEFORE registration closes (overlap is legal)
const comp = (over = {}) => ({
  status: 'PUBLISHED',
  registrationOpensAt: at(-100),
  registrationDeadline: at(30),
  submissionStartsAt: at(-6),
  submissionEndsAt: at(500),
  resultDate: at(550),
  ...over,
});

const state = (c, extra = {}) => {
  const windows = computeWindows(c, NOW);
  const phase = computePhase(c, windows);
  const spots = extra.spots || computeSpots(20, 1);
  return { windows, phase, spots, registration: extra.registration || null, hasSubmission: !!extra.hasSubmission };
};

test('windows overlap: registration and submission both open', () => {
  const w = computeWindows(comp(), NOW);
  assert.equal(w.registration.open, true);
  assert.equal(w.submission.open, true);
  assert.equal(w.result.declared, false);
});

test('registration boundary is exclusive at the deadline instant', () => {
  const c = comp({ registrationDeadline: NOW });
  const w = computeWindows(c, NOW);
  assert.equal(w.registration.open, false);
  assert.equal(w.registration.closed, true);
});

test('phase progression', () => {
  assert.equal(computePhase(comp({ registrationOpensAt: at(5) }), computeWindows(comp({ registrationOpensAt: at(5) }), NOW)), 'UPCOMING');
  assert.equal(state(comp()).phase, 'ACTIVE');
  assert.equal(state(comp({ submissionEndsAt: at(-1) })).phase, 'JUDGING');
  assert.equal(state(comp({ submissionEndsAt: at(-3), resultDate: at(-1) })).phase, 'RESULT');
  assert.equal(state(comp({ status: 'CANCELLED' })).phase, 'CANCELLED');
});

test('countdown prefers registration deadline and flags hurry within 48h', () => {
  const c = comp();
  const cd = computeCountdown(c, computeWindows(c, NOW), NOW, 48);
  assert.equal(cd.key, 'REGISTRATION_CLOSES_IN');
  assert.equal(cd.hurry, true);
  const far = comp({ registrationDeadline: at(200) });
  assert.equal(computeCountdown(far, computeWindows(far, NOW), NOW, 48).hurry, false);
});

test('countdown moves on to submission end, then result, then nothing', () => {
  const closed = comp({ registrationDeadline: at(-1) });
  assert.equal(computeCountdown(closed, computeWindows(closed, NOW), NOW).key, 'SUBMISSION_ENDS_IN');
  const judging = comp({ registrationDeadline: at(-5), submissionEndsAt: at(-1) });
  assert.equal(computeCountdown(judging, computeWindows(judging, NOW), NOW).key, 'RESULT_IN');
  const done = comp({ registrationDeadline: at(-9), submissionEndsAt: at(-5), resultDate: at(-1) });
  assert.equal(computeCountdown(done, computeWindows(done, NOW), NOW), null);
});

test('countdown before registration opens', () => {
  const c = comp({ registrationOpensAt: at(48) });
  assert.equal(computeCountdown(c, computeWindows(c, NOW), NOW).key, 'REGISTRATION_OPENS_IN');
});

test('spots never go negative or above total', () => {
  assert.deepEqual(computeSpots(20, 1), { total: 20, booked: 1, left: 19 });
  assert.deepEqual(computeSpots(20, 25), { total: 20, booked: 20, left: 0 });
  assert.deepEqual(computeSpots(20, -3), { total: 20, booked: 0, left: 20 });
});

test('expired payment hold is treated as not registered immediately', () => {
  const held = { status: 'PENDING_PAYMENT', holdExpiresAt: at(-0.01) };
  assert.equal(effectiveRegistration(held, NOW), null);
  const live = { status: 'PENDING_PAYMENT', holdExpiresAt: at(0.1) };
  assert.equal(effectiveRegistration(live, NOW), live);
  assert.equal(effectiveRegistration({ status: 'EXPIRED' }, NOW), null);
  assert.equal(effectiveRegistration(null, NOW), null);
});

test('CTA: unregistered user with open registration can register', () => {
  const cta = computeCta(state(comp()));
  assert.equal(cta.action, 'REGISTER');
  assert.equal(cta.enabled, true);
});

test('CTA: sold out disables registration', () => {
  const cta = computeCta(state(comp(), { spots: computeSpots(20, 20) }));
  assert.equal(cta.key, 'soldOut');
  assert.equal(cta.enabled, false);
});

test('CTA: registration closed / not open yet', () => {
  assert.equal(computeCta(state(comp({ registrationDeadline: at(-1) }))).key, 'registrationClosed');
  assert.equal(computeCta(state(comp({ registrationOpensAt: at(3) }))).key, 'registrationOpensSoon');
});

test('CTA: registered user sees Upload Submission while window is open (design state)', () => {
  const cta = computeCta(state(comp(), { registration: { status: 'CONFIRMED' } }));
  assert.equal(cta.action, 'UPLOAD_SUBMISSION');
  assert.equal(cta.key, 'uploadSubmission');
  assert.equal(cta.subKey, 'registered');
});

test('CTA: registered user before submission window is disabled with the date', () => {
  const c = comp({ submissionStartsAt: at(24) });
  const cta = computeCta(state(c, { registration: { status: 'CONFIRMED' } }));
  assert.equal(cta.key, 'submissionOpensOn');
  assert.equal(cta.enabled, false);
  assert.ok(cta.params.at);
});

test('CTA: already submitted can update until deadline, then locks', () => {
  const open = computeCta(state(comp(), { registration: { status: 'CONFIRMED' }, hasSubmission: true }));
  assert.equal(open.key, 'updateSubmission');
  const c = comp({ submissionEndsAt: at(-1), resultDate: at(10) });
  const locked = computeCta(state(c, { registration: { status: 'CONFIRMED' }, hasSubmission: true }));
  assert.equal(locked.enabled, false);
  assert.equal(locked.key, 'submissionReceived');
});

test('CTA: registered but missed the submission deadline', () => {
  const c = comp({ submissionEndsAt: at(-1), resultDate: at(10) });
  assert.equal(computeCta(state(c, { registration: { status: 'CONFIRMED' } })).key, 'submissionMissed');
});

test('CTA: pending payment offers to resume', () => {
  const cta = computeCta(state(comp(), { registration: { status: 'PENDING_PAYMENT', holdExpiresAt: at(0.1) } }));
  assert.equal(cta.action, 'RESUME_PAYMENT');
  assert.equal(cta.enabled, true);
});

test('CTA: cancelled competition is locked for everyone', () => {
  const cta = computeCta(state(comp({ status: 'CANCELLED' }), { registration: { status: 'CONFIRMED' } }));
  assert.equal(cta.key, 'cancelled');
  assert.equal(cta.enabled, false);
});
