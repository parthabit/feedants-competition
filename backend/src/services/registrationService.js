const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const payments = require('./payments');
const config = require('../config');
const { Errors } = require('../utils/AppError');
const { computeWindows } = require('./lifecycle');

const DUPLICATE_KEY = 11000;

/*
 * ---------------------------------------------------------------------------
 * CONCURRENCY MODEL
 *
 * 1. A spot is reserved with ONE atomic conditional update on the competition:
 *      findOneAndUpdate({ _id, spotsTaken < maxSpots }, { $inc: { spotsTaken: 1 } })
 *    MongoDB serialises writes to a single document, so with 5,000 people hitting the
 *    last spot at once exactly one wins and the rest get SOLD_OUT. No locks, no
 *    read-then-write race, works across any number of API instances.
 *
 * 2. Double registration by the same user (double tap / two devices) is stopped by a
 *    partial unique index (competitionId, userId where active). The loser releases
 *    the spot it just took.
 *
 * 3. Every release path (expiry sweeper, user cancel, failed order creation) flips the
 *    registration status with a conditional update FIRST and only decrements the
 *    counter if that flip actually happened - so a spot can never be released twice.
 *
 * 4. Payment confirmation is idempotent and can arrive from the app (verify endpoint)
 *    and from the Razorpay webhook in any order.
 * ---------------------------------------------------------------------------
 */

async function reserveSpot(competitionId) {
  return Competition.findOneAndUpdate(
    { _id: competitionId, status: 'PUBLISHED', $expr: { $lt: ['$spotsTaken', '$maxSpots'] } },
    { $inc: { spotsTaken: 1 } },
    { new: true, projection: { spotsTaken: 1, maxSpots: 1 } }
  );
}

async function releaseSpot(competitionId) {
  await Competition.updateOne({ _id: competitionId, spotsTaken: { $gt: 0 } }, { $inc: { spotsTaken: -1 } });
}

/** Moves a held registration to a terminal state and frees its spot - exactly once. */
async function releaseHold(registrationId, newStatus, now = new Date()) {
  const reg = await Registration.findOneAndUpdate(
    { _id: registrationId, status: 'PENDING_PAYMENT' },
    { $set: { status: newStatus, active: false, releasedAt: now } },
    { new: true }
  );
  if (!reg) return null; // someone else already confirmed/released it
  await releaseSpot(reg.competitionId);
  return reg;
}

function paymentPayload(reg, competition) {
  return {
    provider: reg.provider,
    orderId: reg.orderId,
    amountPaise: reg.amount * 100,
    currency: 'INR',
    keyId: reg.provider === 'razorpay' ? config.razorpay.keyId : 'mock_key',
    description: competition.title?.en,
  };
}

/**
 * Start (or resume) a registration.
 * Idempotent: repeating the call while a hold is alive returns the same order.
 */
async function startRegistration({ competitionId, user, now = new Date() }) {
  const competition = await Competition.findById(competitionId).lean();
  if (!competition || competition.status === 'DRAFT') throw Errors.notFound();
  if (competition.status !== 'PUBLISHED') throw Errors.competitionUnavailable();

  // Fast path / idempotency: look at the user's live registration first.
  const existing = await Registration.findOne({ competitionId, userId: user._id, active: true });
  if (existing) {
    if (existing.status === 'CONFIRMED') throw Errors.alreadyRegistered();
    if (existing.holdExpiresAt > now) {
      return { registration: existing, payment: paymentPayload(existing, competition), resumed: true };
    }
    await releaseHold(existing._id, 'EXPIRED', now); // stale hold, sweeper hasn't reached it yet
  }

  const w = computeWindows(competition, now);
  if (w.registration.upcoming) throw Errors.registrationNotOpen();
  if (w.registration.closed) throw Errors.registrationClosed();

  // (1) atomically claim a spot
  const claimed = await reserveSpot(competitionId);
  if (!claimed) throw Errors.soldOut();

  // (2) record the registration; unique index rejects a concurrent duplicate
  const isFree = competition.entryFee === 0;
  let reg;
  try {
    reg = await Registration.create({
      competitionId,
      userId: user._id,
      status: isFree ? 'CONFIRMED' : 'PENDING_PAYMENT',
      active: true,
      amount: competition.entryFee,
      provider: isFree ? 'none' : payments.name,
      holdExpiresAt: isFree ? undefined : new Date(now.getTime() + config.holdMinutes * 60 * 1000),
      paidAt: isFree ? now : undefined,
    });
  } catch (err) {
    await releaseSpot(competitionId);
    if (err.code === DUPLICATE_KEY) {
      const winner = await Registration.findOne({ competitionId, userId: user._id, active: true });
      if (winner?.status === 'CONFIRMED') throw Errors.alreadyRegistered();
      if (winner) return { registration: winner, payment: paymentPayload(winner, competition), resumed: true };
    }
    throw err;
  }

  if (isFree) return { registration: reg, payment: null, resumed: false };

  // (3) create the payment order; if the provider is down, give the spot back
  try {
    const order = await payments.createOrder({
      amountInr: competition.entryFee,
      receipt: String(reg._id),
      notes: { competitionId: String(competitionId), userId: String(user._id) },
    });
    reg.orderId = order.orderId;
    await reg.save();
    return { registration: reg, payment: { ...paymentPayload(reg, competition), keyId: order.keyId }, resumed: false };
  } catch (err) {
    await releaseHold(reg._id, 'CANCELLED', now);
    throw err;
  }
}

/** User closed the payment sheet / payment failed: free the spot immediately instead of waiting for expiry. */
async function cancelPendingRegistration({ competitionId, user, now = new Date() }) {
  const reg = await Registration.findOne({ competitionId, userId: user._id, active: true, status: 'PENDING_PAYMENT' });
  if (!reg) return { cancelled: false };
  const released = await releaseHold(reg._id, 'CANCELLED', now);
  return { cancelled: Boolean(released) };
}

/**
 * Mark an order as paid. Safe to call any number of times, from the app and from the webhook.
 * Handles the nasty case where money is captured AFTER the hold expired.
 */
async function confirmPayment({ orderId, paymentId, now = new Date() }) {
  const confirmed = await Registration.findOneAndUpdate(
    { orderId, status: 'PENDING_PAYMENT' },
    { $set: { status: 'CONFIRMED', paymentId, paidAt: now }, $unset: { holdExpiresAt: 1 } },
    { new: true }
  );
  if (confirmed) return { registration: confirmed, outcome: 'CONFIRMED' };

  const reg = await Registration.findOne({ orderId });
  if (!reg) throw Errors.notFound('Order not found');
  if (reg.status === 'CONFIRMED') return { registration: reg, outcome: 'ALREADY_CONFIRMED' };
  if (reg.status === 'REFUND_PENDING') return { registration: reg, outcome: 'REFUND_PENDING' };

  // EXPIRED / CANCELLED but the user did pay -> try to take a spot back.
  const claimed = await reserveSpot(reg.competitionId);
  if (claimed) {
    try {
      const revived = await Registration.findOneAndUpdate(
        { _id: reg._id, status: { $in: ['EXPIRED', 'CANCELLED'] } },
        { $set: { status: 'CONFIRMED', active: true, paymentId, paidAt: now }, $unset: { holdExpiresAt: 1, releasedAt: 1 } },
        { new: true }
      );
      if (revived) return { registration: revived, outcome: 'CONFIRMED_LATE' };
      await releaseSpot(reg.competitionId);
    } catch (err) {
      await releaseSpot(reg.competitionId);
      if (err.code !== DUPLICATE_KEY) throw err; // user re-registered meanwhile: fall through to refund
    }
  }
  const flagged = await Registration.findOneAndUpdate(
    { _id: reg._id, status: { $in: ['EXPIRED', 'CANCELLED'] } },
    { $set: { status: 'REFUND_PENDING', paymentId, paidAt: now } },
    { new: true }
  );
  return { registration: flagged || reg, outcome: 'REFUND_PENDING' };
}

/** Client-driven confirmation after checkout. Ownership + signature are both checked. */
async function verifyAndConfirm({ competitionId, user, orderId, paymentId, signature }) {
  const reg = await Registration.findOne({ competitionId, userId: user._id, orderId });
  if (!reg) throw Errors.notFound('Order not found');
  if (!payments.verifyPayment({ orderId, paymentId, signature })) throw Errors.invalidSignature();
  return confirmPayment({ orderId, paymentId });
}

module.exports = { startRegistration, cancelPendingRegistration, confirmPayment, verifyAndConfirm, releaseHold };
