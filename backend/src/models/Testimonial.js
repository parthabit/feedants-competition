const { Schema, model } = require('mongoose');

const TestimonialSchema = new Schema(
  {
    userName: { type: String, required: true },
    avatarUrl: String,
    rating: { type: Number, min: 1, max: 5, default: 5 },
    text: { en: { type: String, required: true }, hi: String },
    competitionTitle: String,
  },
  { timestamps: true }
);

TestimonialSchema.index({ createdAt: -1 });

module.exports = model('Testimonial', TestimonialSchema);
