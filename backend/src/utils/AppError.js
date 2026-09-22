/** Operational error that maps cleanly to an HTTP response: { error: { code, message } } */
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

const Errors = {
  notFound: (msg = 'Competition not found') => new AppError(404, 'NOT_FOUND', msg),
  unauthorized: (msg = 'Missing or invalid user') => new AppError(401, 'UNAUTHORIZED', msg),
  alreadyRegistered: () => new AppError(409, 'ALREADY_REGISTERED', 'You are already registered for this competition'),
  soldOut: () => new AppError(409, 'SOLD_OUT', 'All spots are booked'),
  registrationNotOpen: () => new AppError(409, 'REGISTRATION_NOT_OPEN', 'Registration has not opened yet'),
  registrationClosed: () => new AppError(409, 'REGISTRATION_CLOSED', 'Registration is closed'),
  notRegistered: () => new AppError(403, 'NOT_REGISTERED', 'Register for this competition before submitting'),
  submissionNotOpen: () => new AppError(409, 'SUBMISSION_NOT_OPEN', 'Submissions have not started yet'),
  submissionClosed: () => new AppError(409, 'SUBMISSION_CLOSED', 'Submissions are closed'),
  invalidSignature: () => new AppError(400, 'INVALID_SIGNATURE', 'Payment signature could not be verified'),
  holdExpired: () => new AppError(410, 'HOLD_EXPIRED', 'Your spot hold expired. Please register again'),
  competitionUnavailable: () => new AppError(409, 'COMPETITION_UNAVAILABLE', 'This competition is not accepting participants'),
  paymentProviderDown: () => new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'Could not start the payment. Please try again'),
};

module.exports = { AppError, Errors };
