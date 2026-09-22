# Feedants — Competition Details (Full-Stack Assignment)

A functional, full-stack implementation of the Competition Details screen: **React Native (Expo)** frontend, **Node.js + Express** backend, **MongoDB** database. Every value on screen (prize pool, spots left, countdown, registration/submission state, rewards, judge, winners, testimonials, referral link) is served from the database — nothing is hardcoded in the app.

```
feedants-competition/
├── backend/     Express API + MongoDB models/services + tests
└── mobile/      Expo React Native app
```

## 1. Quick start

### Backend

```bash
cd backend
npm install
cp .env.example .env        # defaults work out of the box (mock payments, local Mongo)
# start MongoDB locally, e.g.: mongod --dbpath ./data  (or use a free Atlas cluster and paste its URI into .env)
npm run seed                 # loads 6 demo competitions covering every lifecycle state
npm run dev                  # http://localhost:4000
```

The seed prints the demo user IDs and the "hero" competition ID (the one matching the provided design) to the console.

### Mobile app

```bash
cd mobile
npm install
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://localhost:4000 (iOS sim/web)
# Android emulator: leave it as localhost — the app auto-rewrites it to 10.0.2.2
# Physical device: use your computer's LAN IP, e.g. http://192.168.1.5:4000
npx expo start
```

Open in Expo Go (or a simulator). The app boots by calling `/api/v1/dev/users` and `/api/v1/competitions` to pick a demo user and the first competition — this bypasses the login screen, which is out of scope (see Assumptions). Tap the small ⚙︎ icon next to the language switch to open the **demo switcher** and jump between users and the six seeded competitions (registered / sold out / registration closed / upcoming / free+results-declared / free+open) to see every state without touching the database.

### Tests

```bash
cd backend && npm test              # 20 unit tests: lifecycle rules + i18n fallback
cd mobile  && npm test              # date/currency/countdown formatting tests
cd backend && npm run load-test     # concurrency check, see below
```

### Screen recording

Not included in this text delivery — see the submission checklist below for what to record.

---

## 2. Architecture

### Data model (MongoDB / Mongoose)

| Collection | Purpose |
|---|---|
| `Competition` | Content + lifecycle timestamps + the **live spot counter** (`spotsTaken`) |
| `Registration` | One user's claim on a spot: `PENDING_PAYMENT → CONFIRMED`, or `EXPIRED`/`CANCELLED`/`REFUND_PENDING` |
| `Submission` | One entry per (competition, user); re-submitting replaces it (upsert) |
| `Judge`, `Testimonial` | Supporting content, localized `{en, hi}` |
| `User` | Minimal identity (auth is out of scope, see Assumptions) |

Money is stored in whole rupees and converted to paise only at the Razorpay boundary.

### The read path (`GET /competitions/:id`)

This is the hottest endpoint, so it's split by volatility:
- **Static content** (title, judge, rewards, rules, winners) is cached in-process for 60s with **request coalescing** — if 5,000 people open the same competition in the same second, only one query hits Mongo.
- **Volatile fields** (spot counter, competition status, the viewer's own registration/submission) are always read fresh — each is a single indexed lookup, so correctness never depends on cache TTLs.
- All lifecycle math (is registration open? what's the countdown target? what should the button say?) is computed **server-side** in `src/services/lifecycle.js`, a pure, unit-tested module. The client only renders what the server decides — this is what makes "hurry up", CTA text, and locked/unlocked submission behave correctly no matter what the device clock says (the response also carries `serverTime`, which the app uses to drive countdowns instead of trusting the phone's clock).

### Concurrency & consistency (the part the assignment stresses)

The critical invariant is: **the number of confirmed + held registrations can never exceed `maxSpots`**, even with thousands of users hitting "Register" on the last spot at the same instant.

1. **Atomic spot claim.** A spot is reserved with one conditional update:
   ```js
   Competition.findOneAndUpdate(
     { _id, status: 'PUBLISHED', $expr: { $lt: ['$spotsTaken', '$maxSpots'] } },
     { $inc: { spotsTaken: 1 } }
   )
   ```
   MongoDB serializes writes to a single document, so exactly one request wins when the counter is at `maxSpots - 1`; every other concurrent request gets `null` back → `409 SOLD_OUT`. No locks, no read-then-write race, and it works identically across any number of API instances behind a load balancer.

2. **No double registration.** A partial unique index — `{ competitionId, userId }` where `active: true` — stops a double-tap or a second device from creating two live registrations for the same person. If two requests race, the loser's insert throws a duplicate-key error and its spot is released.

3. **Payment holds, not permanent claims.** For a paid competition, "Register" creates a `PENDING_PAYMENT` registration with a 10-minute hold (`HOLD_MINUTES`) and immediately counts toward `spotsTaken`, so the spot can't be double-sold while checkout is in progress. If the user pays, it becomes `CONFIRMED`. If they cancel, or the hold expires, the spot is released via one more conditional update (`releaseHold`), which flips status **and only then** decrements the counter — so a spot can never be released twice even if the cancel button and the expiry sweeper race each other.

4. **A background sweeper** (`holdSweeper.js`) releases expired holds every 30s, safe to run on every instance simultaneously. It's a tidiness job, not a correctness dependency: the read path already treats an expired-but-unswept hold as "not registered" (`effectiveRegistration`), and `startRegistration` reclaims a stale hold on sight.

5. **Idempotent payment confirmation.** `confirmPayment` can be called twice (client-side "I paid" callback *and* the Razorpay webhook, in any order) and only ever transitions the registration once. It also handles the awkward case where money is captured **after** the hold expired: it tries to reclaim a spot for the user, and if none is left, flags the registration `REFUND_PENDING` instead of silently losing track of the payment.

6. **Rate limiting** on all write endpoints (register, verify, submit) is keyed per user, so a scripted retry loop can't hammer the database.

I load-tested this with `npm run load-test`, which fires two simultaneous requests from each of N fresh users at a low-spot competition and asserts `successful registrations === spots actually taken` and that the counter never exceeds `maxSpots`.

### Business rules encoded server-side

- Registration and submission windows are modelled **independently** and can overlap, matching the design (submissions open a few days before registration closes).
- A competition can be `PUBLISHED` or `CANCELLED`; cancelling locks the CTA for everyone regardless of their own state.
- Free competitions (`entryFee: 0`) skip payment entirely and confirm instantly.
- The submission endpoint re-validates registration status and the time window server-side on every call — the client's CTA state is only a hint, never trusted.
- All lifecycle boundaries are tested as **exclusive at the instant** (e.g. exactly at the deadline, registration is already closed) — see `test/lifecycle.test.js`.

### Internationalization

The design shows an ENG / हिंदी toggle. Localized content (title, about, rules, judging parameters, judge bio, testimonials) is stored as `{ en, hi }` in MongoDB and picked server-side from `Accept-Language` / `?lang=`, falling back to English for any missing translation. UI chrome strings live in `mobile/src/i18n/strings.ts`.

### Payments

`PAYMENT_PROVIDER=mock` (default) simulates checkout in-app with no external calls or credentials — the whole reserve → pay → confirm → spot-released-on-cancel flow is demoable offline. Setting `PAYMENT_PROVIDER=razorpay` (plus the three `RAZORPAY_*` env vars) switches to the real Razorpay Orders API, HMAC signature verification, and a webhook endpoint (`POST /api/v1/webhooks/razorpay`) as a safety net for payments that complete after the app loses connectivity. `mobile/src/payments/razorpayCheckout.ts` documents exactly what to add (`react-native-razorpay` + a dev client build) to wire up the real native checkout sheet.

---

## 3. API summary

| Method & path | Purpose |
|---|---|
| `GET /api/v1/competitions/:id` | Full details-screen payload for the current user |
| `POST /api/v1/competitions/:id/registrations` | Start/resume registration (reserves a spot, returns a payment order or confirms instantly if free) |
| `POST /api/v1/competitions/:id/registrations/verify` | Confirm payment after checkout (ownership + signature checked) |
| `DELETE /api/v1/competitions/:id/registrations/pending` | User backed out of payment — release the held spot |
| `POST /api/v1/competitions/:id/submission` | Upload/replace a submission (server re-checks registration + window) |
| `GET /api/v1/testimonials` | Cursor-paginated reviews |
| `POST /api/v1/webhooks/razorpay` | Payment webhook (raw-body HMAC verified) |
| `GET /api/v1/dev/users`, `GET /api/v1/competitions` | Demo-only helpers (`ENABLE_DEV_ROUTES=true`), used by the in-app demo switcher |

All endpoints require `x-user-id` (see Assumptions on auth). Errors are `{ error: { code, message } }` with a stable `code` the client maps to localized copy.

---

## 4. Assumptions

- **Auth is out of scope.** The assignment is scoped to the details screen, not login. The API expects an `x-user-id` header identifying an existing `User` document; in production this middleware (`src/middleware/auth.js`) is the only file that would be replaced with real JWT/session verification — nothing else reads the header directly.
- **File upload is out of scope.** "Upload Submission" takes a link (Drive/YouTube/etc.) rather than an in-app video upload/transcode pipeline, which is a project on its own.
- Money amounts in the design (₹1,500 pool, ₹99 fee) are treated as **seed data**, not hardcoded constants — a different competition can have any fee, reward split, or spot count.
- Where the design doesn't specify exact behaviour (e.g. what happens if you cancel a payment, or what "registered" looks like once submissions close and results aren't out yet), I made a reasonable product decision and encoded it as an explicit CTA state (see the `computeCta` state machine and its 12 unit tests) rather than leaving it undefined.
- IST is used for all displayed dates/times, matching the design ("10 Aug 26, 11:50 PM"), independent of the device's own timezone.

## 5. Trade-offs

- **In-process cache instead of Redis.** Fine for a single instance or a small fleet; note left in code (`TtlCache`) on swapping to Redis when horizontally scaling further, since in-process caches don't invalidate across instances.
- **Polling (20s) instead of WebSockets/SSE** for the live spot counter. Simpler to build and completely stateless on the server, at the cost of up to 20s of staleness on other users' bookings — acceptable for a "spots left" indicator, but a push-based approach would feel snappier for something like a live-auction countdown.
- **Submission is a link, not an upload**, as above — a real product would need resumable uploads, virus scanning, and a CDN/transcoding pipeline.
- **Single MongoDB replica set** is assumed for transactional guarantees; the concurrency design deliberately avoids multi-document transactions (which need a replica set and add latency) in favor of single-document atomic updates, which work even on a standalone Mongo instance and scale better.
- **Rate limiting is in-process** (`express-rate-limit` with an in-memory store). Behind multiple instances this becomes per-instance rather than global; swapping in a Redis store is a one-line change (`rate-limit-redis`) if that precision matters.

## 6. What I'd change for production

- Real authentication (JWT/OAuth), and rely on it instead of `x-user-id`.
- Move the in-process TTL cache and rate-limit store to Redis, shared across instances.
- Replace polling with SSE/WebSocket push for the spot counter and countdown-critical moments (e.g. sold out).
- A proper media pipeline for submissions (signed upload URLs, background transcoding, moderation).
- Structured logging/metrics (e.g. OpenTelemetry) around the registration and payment paths specifically, since that's where money and fairness (no overbooking) are on the line.
- An admin surface for creating/editing competitions, rather than the seed script.
- E2E tests (Detox/Playwright) covering the full register → pay → submit flow, on top of the current unit tests for business logic.
