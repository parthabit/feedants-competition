const express = require('express');
const Testimonial = require('../models/Testimonial');
const auth = require('../middleware/auth');
const { parseLang, pick } = require('../utils/localize');

const router = express.Router();
router.use(auth);

// Cursor pagination on _id so the list stays cheap however large it grows.
router.get('/', async (req, res, next) => {
  try {
    const lang = parseLang(req.query.lang || req.header('accept-language'));
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 30);
    const filter = req.query.cursor ? { _id: { $lt: req.query.cursor } } : {};
    const rows = await Testimonial.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
    const page = rows.slice(0, limit);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      testimonials: page.map((t) => ({
        id: String(t._id),
        userName: t.userName,
        avatarUrl: t.avatarUrl || null,
        rating: t.rating,
        text: pick(t.text, lang),
        competitionTitle: t.competitionTitle || null,
      })),
      nextCursor: rows.length > limit ? String(page[page.length - 1]._id) : null,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
