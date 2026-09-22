const Registration = require('../models/Registration');
const config = require('../config');
const { releaseHold } = require('./registrationService');

/**
 * Releases spots held by users who never completed payment.
 * Safe to run on every API instance simultaneously: releaseHold() is an atomic
 * status transition, so each expired hold is released exactly once.
 * Correctness does not depend on this job - views treat expired holds as "not registered"
 * and startRegistration() reclaims stale holds - it only keeps the public counter tidy.
 */
async function sweepOnce(now = new Date(), batchSize = 200) {
  const expired = await Registration.find({ status: 'PENDING_PAYMENT', holdExpiresAt: { $lte: now } })
    .select('_id')
    .limit(batchSize)
    .lean();
  let released = 0;
  for (const { _id } of expired) {
    if (await releaseHold(_id, 'EXPIRED', now)) released += 1;
  }
  return released;
}

function startSweeper() {
  const timer = setInterval(() => {
    sweepOnce().catch((err) => console.error('[sweeper] failed', err));
  }, config.sweeperIntervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

module.exports = { sweepOnce, startSweeper };
