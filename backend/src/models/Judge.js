const { Schema, model } = require('mongoose');

const localized = { en: { type: String, required: true }, hi: String };

const JudgeSchema = new Schema(
  {
    name: localized,
    title: localized, // e.g. "Professional Kathak Dancer"
    experienceYears: { type: Number, min: 0, required: true },
    photoUrl: String,
    introVideoUrl: String,
  },
  { timestamps: true }
);

module.exports = model('Judge', JudgeSchema);
