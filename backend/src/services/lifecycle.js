/**
 * Pure, DB-free business rules for a competition's time-dependent behaviour.
 * Everything takes `now` explicitly so it is deterministic and unit-testable.
 * The server is the single source of truth for "what can the user do right now";
 * the client only renders what this module decides.
 */
const HOUR = 60 * 60 * 1000;
const ms = (d) => (d ? new Date(d).getTime() : null);

/** Registration and submission windows can overlap (as in the design), so they are modelled independently. */
function computeWindows(c, now) {
  const t = now.getTime();
  const win = (opensAt, closesAt) => {
    const o = ms(opensAt) ?? -Infinity;
    const cl = ms(closesAt);
    return {
      opensAt: opensAt ? new Date(opensAt).toISOString() : null,
      closesAt: new Date(closesAt).toISOString(),
      upcoming: t < o,
      open: t >= o && t < cl,
      closed: t >= cl,
    };
  };
  return {
    registration: win(c.registrationOpensAt, c.registrationDeadline),
    submission: win(c.submissionStartsAt, c.submissionEndsAt),
    result: { at: new Date(c.resultDate).toISOString(), declared: t >= ms(c.resultDate) },
  };
}

/** Coarse lifecycle stage used for display/ordering. */
function computePhase(c, w) {
  if (c.status === 'CANCELLED') return 'CANCELLED';
  if (w.result.declared) return 'RESULT';
  if (w.submission.closed) return 'JUDGING';
  if (w.registration.upcoming) return 'UPCOMING';
  return 'ACTIVE';
}

/**
 * The single live countdown shown in the banner. Ordered by "what matters next".
 * `hurry` is only set while registration is open and closing soon.
 */
function computeCountdown(c, w, now, hurryThresholdHours = 48) {
  const t = now.getTime();
  const iso = (d) => new Date(d).toISOString();

  if (c.status === 'CANCELLED') return null;
  if (w.registration.open) {
    const remaining = ms(c.registrationDeadline) - t;
    return { key: 'REGISTRATION_CLOSES_IN', targetAt: iso(c.registrationDeadline), hurry: remaining <= hurryThresholdHours * HOUR };
  }
  if (w.registration.upcoming) return { key: 'REGISTRATION_OPENS_IN', targetAt: iso(c.registrationOpensAt), hurry: false };
  if (w.submission.open) return { key: 'SUBMISSION_ENDS_IN', targetAt: iso(c.submissionEndsAt), hurry: false };
  if (t < ms(c.submissionStartsAt)) return { key: 'SUBMISSION_STARTS_IN', targetAt: iso(c.submissionStartsAt), hurry: false };
  if (!w.result.declared) return { key: 'RESULT_IN', targetAt: iso(c.resultDate), hurry: false };
  return null;
}

/** Spots as shown on the card. Held (unpaid) spots count as booked so nobody is promised a spot that is gone. */
function computeSpots(maxSpots, spotsTaken) {
  const booked = Math.min(Math.max(spotsTaken, 0), maxSpots);
  return { total: maxSpots, booked, left: maxSpots - booked };
}

/** A payment hold whose deadline passed is treated as "not registered" immediately, even before the sweeper runs. */
function effectiveRegistration(reg, now) {
  if (!reg) return null;
  if (reg.status === 'PENDING_PAYMENT' && new Date(reg.holdExpiresAt).getTime() <= now.getTime()) return null;
  if (reg.status === 'PENDING_PAYMENT' || reg.status === 'CONFIRMED') return reg;
  return null;
}

/**
 * State machine for the sticky bottom button.
 * Returns i18n keys (not strings) so the client can localise, plus whether it is tappable and what it does.
 */
function computeCta({ phase, windows, registration, hasSubmission, spots }) {
  const cta = (action, key, subKey, enabled, params) => ({ action, key, subKey: subKey || null, enabled, params: params || {} });

  if (phase === 'CANCELLED') return cta('NONE', 'cancelled', null, false);

  if (registration?.status === 'CONFIRMED') {
    if (windows.submission.open) {
      return hasSubmission
        ? cta('UPLOAD_SUBMISSION', 'updateSubmission', 'submitted', true)
        : cta('UPLOAD_SUBMISSION', 'uploadSubmission', 'registered', true);
    }
    if (windows.submission.upcoming || !windows.submission.closed) {
      return cta('NONE', 'submissionOpensOn', 'registered', false, { at: windows.submission.opensAt });
    }
    if (phase === 'RESULT') return cta('NONE', 'resultsDeclared', hasSubmission ? 'submitted' : 'registered', false);
    return cta('NONE', hasSubmission ? 'submissionReceived' : 'submissionMissed', hasSubmission ? 'resultsOn' : null, false, {
      at: windows.result.at,
    });
  }

  if (registration?.status === 'PENDING_PAYMENT') {
    return cta('RESUME_PAYMENT', 'completePayment', 'spotHeld', true, { holdExpiresAt: registration.holdExpiresAt });
  }

  if (windows.registration.upcoming) return cta('NONE', 'registrationOpensSoon', null, false, { at: windows.registration.opensAt });
  if (windows.registration.open) {
    if (spots.left <= 0) return cta('NONE', 'soldOut', null, false);
    return cta('REGISTER', 'registerNow', 'entryFee', true);
  }
  return cta('NONE', 'registrationClosed', null, false);
}

module.exports = { computeWindows, computePhase, computeCountdown, computeSpots, effectiveRegistration, computeCta };
