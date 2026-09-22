const mongoose = require('mongoose');
const { Errors } = require('../utils/AppError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) return next(parsed.error); // handled centrally as VALIDATION_ERROR
  req[source] = parsed.data;
  next();
};

const validObjectIdParam = (name) => (req, res, next) =>
  mongoose.isValidObjectId(req.params[name]) ? next() : next(Errors.notFound());

module.exports = { validate, validObjectIdParam };
