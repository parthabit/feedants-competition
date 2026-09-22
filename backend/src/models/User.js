const { Schema, model } = require('mongoose');

/**
 * Minimal user record. Real auth (OTP/JWT) lives in another service in production;
 * this module only needs identity + a referral code.
 */
const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    avatarUrl: String,
    referralCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = model('User', UserSchema);
