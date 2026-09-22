/**
 * Seeds demo data. Dates are RELATIVE to "now" so every lifecycle state is demoable
 * whenever you run it. Re-run `npm run seed` to reset the demo.
 */
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Judge = require('../models/Judge');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const Testimonial = require('../models/Testimonial');

const IST = 330 * 60 * 1000;
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const now = Date.now();

/** A wall-clock time in India `days` from today, e.g. istAt(3, 23, 50) = 11:50 PM IST in 3 days. */
const istAt = (days, hh, mm = 0) => {
  const b = new Date(now + IST);
  return new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate() + days, hh, mm) - IST);
};
const fromNow = (ms) => new Date(now + ms);

const vid = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const face = (n) => `https://i.pravatar.cc/240?img=${n}`;
const pic = (seed) => `https://picsum.photos/seed/${seed}/240/280`;

const REFUND_URL = 'https://feedants.com/refund-policy';
const PRIZE_VIDEO = vid('how to receive prize money');

async function main() {
  if (config.env === 'production') throw new Error('Refusing to seed in production');
  await mongoose.connect(config.mongoUri);
  await Promise.all([User, Judge, Competition, Registration, Submission, Testimonial].map((m) => m.deleteMany({})));
  await Promise.all([Registration, Submission, Competition, User].map((m) => m.init()));

  const [priya, rohan, ananya] = await User.create([
    { name: 'Priya Sharma', avatarUrl: face(32), referralCode: 'referral123' },
    { name: 'Rohan Das', avatarUrl: face(12), referralCode: 'rohan456' },
    { name: 'Ananya Iyer', avatarUrl: face(45), referralCode: 'ananya789' },
  ]);

  const [manju, vikram, meera] = await Judge.create([
    {
      name: { en: 'Manju Dubey', hi: 'मंजू दुबे' },
      title: { en: 'Professional Kathak Dancer', hi: 'पेशेवर कथक नृत्यांगना' },
      experienceYears: 12,
      photoUrl: face(47),
      introVideoUrl: vid('kathak dance introduction'),
    },
    {
      name: { en: 'Vikram Sethi', hi: 'विक्रम सेठी' },
      title: { en: 'Playback Singer & Vocal Coach', hi: 'प्लेबैक सिंगर और वोकल कोच' },
      experienceYears: 15,
      photoUrl: face(15),
      introVideoUrl: vid('vocal coach introduction'),
    },
    {
      name: { en: 'Meera Kulkarni', hi: 'मीरा कुलकर्णी' },
      title: { en: 'Award-winning Photographer', hi: 'पुरस्कार विजेता फ़ोटोग्राफ़र' },
      experienceYears: 9,
      photoUrl: face(26),
      introVideoUrl: vid('photography introduction'),
    },
  ]);

  const rewards6 = [
    { position: 1, amount: 550 },
    { position: 2, amount: 300 },
    { position: 3, amount: 240 },
    { position: 4, amount: 200 },
    { position: 5, amount: 130 },
    { position: 6, amount: 80 },
  ]; // = Rs 1,500 prize pool, same as the design

  const common = {
    prizeVideoUrl: PRIZE_VIDEO,
    refundPolicyUrl: REFUND_URL,
    format: 'MULTI_WIN',
    hasCertificate: true,
  };

  const danceWinners = [
    { name: 'Riya Shah', position: 1, thumbnailUrl: pic('dance1'), videoUrl: vid('kathak performance') },
    { name: 'Aarav Mehta', position: 1, thumbnailUrl: pic('dance2'), videoUrl: vid('bharatanatyam performance') },
    { name: 'Neha Verma', position: 2, thumbnailUrl: pic('dance3'), videoUrl: vid('odissi performance') },
    { name: 'Ishita Chopra', position: 3, thumbnailUrl: pic('dance4'), videoUrl: vid('kuchipudi performance') },
  ];

  // 1) HERO - matches the design: registered viewer, closing in 1d 06h 28m 32s, 1/20 booked
  const hero = await Competition.create({
    ...common,
    slug: 'feedants-classical-dance',
    title: { en: 'Feedants Classical Dance', hi: 'फीडेंट्स शास्त्रीय नृत्य' },
    category: { key: 'dance', label: { en: 'Dance', hi: 'नृत्य' } },
    entryFee: 99,
    rewards: rewards6,
    maxSpots: 20,
    spotsTaken: 1,
    registrationDeadline: fromNow(30 * HOUR + 28 * MIN + 32 * 1000),
    submissionStartsAt: istAt(-3, 4, 0),
    submissionEndsAt: istAt(24, 23, 55),
    resultDate: istAt(26, 23, 50),
    judgeId: manju._id,
    previousWinners: danceWinners,
    about: {
      en: [
        'This is an online classical dance competition open for all age groups.',
        'Participate from anywhere and showcase your talent.',
        'Express your passion through traditional dance.',
        'Record a solo performance of 2 to 4 minutes in any Indian classical form: Kathak, Bharatanatyam, Odissi, Kuchipudi, Manipuri, Mohiniyattam or Sattriya.',
        'Winners receive prize money in their wallet and a digital certificate of achievement.',
      ],
      hi: [
        'यह सभी आयु वर्ग के लिए एक ऑनलाइन शास्त्रीय नृत्य प्रतियोगिता है।',
        'कहीं से भी भाग लें और अपनी प्रतिभा दिखाएँ।',
        'पारंपरिक नृत्य के ज़रिए अपने जुनून को व्यक्त करें।',
        'किसी भी भारतीय शास्त्रीय शैली में 2 से 4 मिनट का सोलो प्रदर्शन रिकॉर्ड करें: कथक, भरतनाट्यम, ओडिसी, कुचिपुड़ी, मणिपुरी, मोहिनीअट्टम या सत्रिया।',
        'विजेताओं को पुरस्कार राशि उनके वॉलेट में और एक डिजिटल प्रमाणपत्र मिलेगा।',
      ],
    },
    judgingParameters: [
      { name: { en: 'Technique & precision', hi: 'तकनीक और सटीकता' }, weight: 30 },
      { name: { en: 'Expression (abhinaya)', hi: 'अभिनय और भाव' }, weight: 25 },
      { name: { en: 'Rhythm & timing (laya)', hi: 'लय और ताल' }, weight: 25 },
      { name: { en: 'Costume & presentation', hi: 'वेशभूषा और प्रस्तुति' }, weight: 10 },
      { name: { en: 'Overall impact', hi: 'समग्र प्रभाव' }, weight: 10 },
    ],
    rules: {
      en: [
        'One entry per participant. You can replace it any time before the submission deadline.',
        'Video must be 2 to 4 minutes long and shot in a single take, without editing.',
        'Only original performances. Copied or reposted content is disqualified.',
        'The entry fee must be paid before the registration deadline. Unpaid entries are not judged.',
        'The judge’s decision is final.',
      ],
      hi: [
        'प्रति प्रतिभागी एक प्रविष्टि। सबमिशन की अंतिम तिथि से पहले इसे कभी भी बदला जा सकता है।',
        'वीडियो 2 से 4 मिनट का होना चाहिए और बिना एडिटिंग के एक ही टेक में बना हो।',
        'केवल मौलिक प्रस्तुतियाँ मान्य हैं। कॉपी या दोबारा पोस्ट की गई सामग्री अयोग्य होगी।',
        'पंजीकरण की अंतिम तिथि से पहले प्रवेश शुल्क का भुगतान अनिवार्य है। बिना भुगतान वाली प्रविष्टियाँ जज नहीं की जाएँगी।',
        'जज का निर्णय अंतिम होगा।',
      ],
    },
  });

  await Registration.create({
    competitionId: hero._id,
    userId: priya._id,
    status: 'CONFIRMED',
    active: true,
    amount: 99,
    provider: config.paymentProvider,
    orderId: 'order_seed_priya',
    paymentId: 'pay_seed_priya',
    paidAt: fromNow(-2 * HOUR),
  });

  // 2) SOLD OUT
  await Competition.create({
    ...common,
    slug: 'feedants-solo-singing',
    title: { en: 'Feedants Solo Singing', hi: 'फीडेंट्स सोलो गायन' },
    category: { key: 'music', label: { en: 'Music', hi: 'संगीत' } },
    entryFee: 149,
    rewards: [
      { position: 1, amount: 1000 },
      { position: 2, amount: 600 },
      { position: 3, amount: 400 },
    ],
    maxSpots: 30,
    spotsTaken: 30,
    registrationDeadline: fromNow(2 * 24 * HOUR + 5 * HOUR),
    submissionStartsAt: istAt(1, 4, 0),
    submissionEndsAt: istAt(15, 23, 55),
    resultDate: istAt(17, 23, 50),
    judgeId: vikram._id,
    previousWinners: [{ name: 'Kabir Nair', position: 1, thumbnailUrl: pic('sing1'), videoUrl: vid('solo singing') }],
    about: { en: ['Sing any original or cover song in any Indian language.', 'Solo entries only. Vocal-only or with a single instrument.'] },
    judgingParameters: [
      { name: { en: 'Pitch & tone' }, weight: 40 },
      { name: { en: 'Emotion' }, weight: 30 },
      { name: { en: 'Song choice' }, weight: 30 },
    ],
    rules: { en: ['One entry per participant.', 'Keep the video under 5 minutes.'] },
  });

  // 3) REGISTRATION CLOSED (submissions still running) - viewer not registered
  await Competition.create({
    ...common,
    slug: 'feedants-photography-challenge',
    title: { en: 'Feedants Street Photography', hi: 'फीडेंट्स स्ट्रीट फ़ोटोग्राफ़ी' },
    category: { key: 'photography', label: { en: 'Photography', hi: 'फ़ोटोग्राफ़ी' } },
    format: 'SINGLE_WIN',
    hasCertificate: false,
    entryFee: 49,
    rewards: [{ position: 1, amount: 1500 }],
    maxSpots: 50,
    spotsTaken: 12,
    registrationDeadline: fromNow(-6 * HOUR),
    submissionStartsAt: istAt(-5, 4, 0),
    submissionEndsAt: istAt(9, 23, 55),
    resultDate: istAt(11, 23, 50),
    judgeId: meera._id,
    previousWinners: [{ name: 'Sanjay Rao', position: 1, thumbnailUrl: pic('photo1'), videoUrl: vid('street photography') }],
    about: { en: ['Capture one photo that tells the story of your street.', 'No heavy editing. Colour correction only.'] },
    judgingParameters: [
      { name: { en: 'Storytelling' }, weight: 50 },
      { name: { en: 'Composition' }, weight: 30 },
      { name: { en: 'Technical quality' }, weight: 20 },
    ],
    rules: { en: ['Submit one image link.', 'AI-generated images are not allowed.'] },
  });

  // 4) UPCOMING - registration opens in 2 days
  await Competition.create({
    ...common,
    slug: 'feedants-poetry-slam',
    title: { en: 'Feedants Poetry Slam', hi: 'फीडेंट्स कविता प्रतियोगिता' },
    category: { key: 'poetry', label: { en: 'Poetry', hi: 'कविता' } },
    format: 'SINGLE_WIN',
    entryFee: 79,
    rewards: [
      { position: 1, amount: 700 },
      { position: 2, amount: 300 },
    ],
    maxSpots: 40,
    spotsTaken: 0,
    registrationOpensAt: fromNow(2 * 24 * HOUR),
    registrationDeadline: istAt(9, 23, 50),
    submissionStartsAt: istAt(4, 4, 0),
    submissionEndsAt: istAt(20, 23, 55),
    resultDate: istAt(23, 23, 50),
    judgeId: manju._id,
    about: { en: ['Perform an original poem in Hindi, English or any regional language.'] },
    judgingParameters: [{ name: { en: 'Originality' }, weight: 50 }, { name: { en: 'Delivery' }, weight: 50 }],
    rules: { en: ['Poem must be your own work.', 'Maximum 3 minutes.'] },
  });

  // 5) FREE + RESULT DECLARED
  await Competition.create({
    ...common,
    slug: 'feedants-art-contest',
    title: { en: 'Feedants Free Art Contest', hi: 'फीडेंट्स फ्री आर्ट कॉन्टेस्ट' },
    category: { key: 'art', label: { en: 'Art', hi: 'कला' } },
    entryFee: 0,
    rewards: [
      { position: 1, amount: 500 },
      { position: 2, amount: 250 },
    ],
    maxSpots: 100,
    spotsTaken: 64,
    registrationDeadline: istAt(-20, 23, 50),
    submissionStartsAt: istAt(-25, 4, 0),
    submissionEndsAt: istAt(-8, 23, 55),
    resultDate: istAt(-2, 23, 50),
    judgeId: meera._id,
    previousWinners: [{ name: 'Tara Menon', position: 1, thumbnailUrl: pic('art1'), videoUrl: vid('art timelapse') }],
    about: { en: ['Draw or paint anything that makes you happy.'] },
    judgingParameters: [{ name: { en: 'Creativity' }, weight: 60 }, { name: { en: 'Craft' }, weight: 40 }],
    rules: { en: ['Free to enter.', 'Original artwork only.'] },
  });

  // 6) FREE and still open - shows the no-payment registration path
  await Competition.create({
    ...common,
    slug: 'feedants-mimicry-open',
    title: { en: 'Feedants Mimicry Open', hi: 'फीडेंट्स मिमिक्री ओपन' },
    category: { key: 'comedy', label: { en: 'Comedy', hi: 'कॉमेडी' } },
    entryFee: 0,
    rewards: [
      { position: 1, amount: 300 },
      { position: 2, amount: 150 },
    ],
    maxSpots: 25,
    spotsTaken: 22,
    registrationDeadline: fromNow(6 * HOUR + 15 * MIN),
    submissionStartsAt: istAt(2, 4, 0),
    submissionEndsAt: istAt(12, 23, 55),
    resultDate: istAt(14, 23, 50),
    judgeId: vikram._id,
    about: { en: ['Mimic your favourite voices and characters.'] },
    judgingParameters: [{ name: { en: 'Accuracy' }, weight: 60 }, { name: { en: 'Humour' }, weight: 40 }],
    rules: { en: ['Keep it respectful. No abusive content.'] },
  });

  await Testimonial.create([
    { userName: 'Sneha Kapoor', avatarUrl: face(5), rating: 5, text: { en: 'Won 2nd place in my first ever competition. The payout reached my wallet in two days!', hi: 'मेरी पहली प्रतियोगिता में दूसरा स्थान मिला। पैसे दो दिन में वॉलेट में आ गए!' }, competitionTitle: 'Classical Dance' },
    { userName: 'Arjun Malhotra', avatarUrl: face(60), rating: 5, text: { en: 'Simple to join and the feedback from the judge was genuinely useful.', hi: 'जुड़ना आसान था और जज का फ़ीडबैक सच में काम का था।' }, competitionTitle: 'Solo Singing' },
    { userName: 'Divya Nair', avatarUrl: face(9), rating: 4, text: { en: 'Loved that only paid participants are judged. It feels fair.', hi: 'अच्छा लगा कि सिर्फ़ भुगतान करने वालों को जज किया जाता है। यह निष्पक्ष लगता है।' }, competitionTitle: 'Street Photography' },
    { userName: 'Imran Sheikh', avatarUrl: face(33), rating: 5, text: { en: 'The countdown kept me honest. Submitted with hours to spare.', hi: 'काउंटडाउन ने मुझे समय पर रखा। कुछ घंटे पहले ही सबमिट कर दिया।' }, competitionTitle: 'Poetry Slam' },
    { userName: 'Kavya Reddy', avatarUrl: face(20), rating: 5, text: { en: 'Refer & earn is a nice bonus. Got my friends to join too.', hi: 'रेफ़र एंड अर्न एक अच्छा बोनस है। दोस्तों को भी जोड़ा।' }, competitionTitle: 'Art Contest' },
  ]);

  console.log('Seeded. Users:');
  [priya, rohan, ananya].forEach((u) => console.log(`  ${u.name.padEnd(14)} ${u._id}`));
  console.log(`Hero competition id: ${hero._id}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
