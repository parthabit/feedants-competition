const mongoose = require('mongoose');
const User = require('../models/User');
const TtlCache = require('../utils/ttlCache');
const { Errors } = require('../utils/AppError');

const userCache = new TtlCache(60 * 1000, 5000);

/**
 * PLACEHOLDER AUTH. The assignment scopes out login, so the app sends `x-user-id`.
 * In production replace this single middleware with JWT/session verification that
 * sets `req.user`; nothing else in the codebase reads the header.
 */
async function auth(req, res, next) {
  try {
    const id = req.header('x-user-id');
    if (!id || !mongoose.isValidObjectId(id)) throw Errors.unauthorized();
    const user = await userCache.getOrLoad(id, () => User.findById(id).lean());
    if (!user) {
      userCache.invalidate(id);
      throw Errors.unauthorized('Unknown user');
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
