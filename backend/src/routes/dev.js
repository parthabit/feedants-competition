const express = require('express');
const User = require('../models/User');

/** Demo helper: lets the app switch between seeded users. Disabled unless ENABLE_DEV_ROUTES=true. */
const router = express.Router();

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: 1 }).select('name referralCode').lean();
    res.json({ users: users.map((u) => ({ id: String(u._id), name: u.name, referralCode: u.referralCode })) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
