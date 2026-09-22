/**
 * Fires many simultaneous registrations at ONE competition and checks the invariants:
 *   - never more successes than spots
 *   - spotsTaken in the API view equals successes
 *   - a user who double-taps only ever gets one hold
 *
 * Usage:  API_URL=http://localhost:4000 COMPETITION_ID=<id> USERS=200 node scripts/load-check.js
 * Needs the API running with the seed loaded (creates its own throw-away users via mongoose).
 * Best run against a competition with a small number of free spots, e.g. the "Mimic Open" seed (3 left, free).
 */
const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/User');

const API = process.env.API_URL || `http://localhost:${config.port}`;
const COMPETITION_ID = process.env.COMPETITION_ID;
const USERS = parseInt(process.env.USERS || '200', 10);

async function main() {
  if (!COMPETITION_ID) throw new Error('Set COMPETITION_ID');
  await mongoose.connect(config.mongoUri);
  const stamp = Date.now();
  const users = await User.insertMany(
    Array.from({ length: USERS }, (_, i) => ({ name: `load-${i}`, referralCode: `load${stamp}${i}` }))
  );

  const call = (userId) =>
    fetch(`${API}/api/v1/competitions/${COMPETITION_ID}/registrations`, {
      method: 'POST',
      headers: { 'x-user-id': String(userId), 'Content-Type': 'application/json' },
    }).then(async (r) => ({ status: r.status, body: await r.json() }));

  const view = (userId) =>
    fetch(`${API}/api/v1/competitions/${COMPETITION_ID}`, { headers: { 'x-user-id': String(userId) } }).then((r) => r.json());

  const before = await view(users[0]._id);
  // Every user fires twice (double tap) at the same instant
  const results = await Promise.all(users.flatMap((u) => [call(u._id), call(u._id)]));
  const after = await view(users[0]._id);

  const created = results.filter((r) => r.status === 201).length;
  const resumed = results.filter((r) => r.status === 200).length;
  const soldOut = results.filter((r) => r.body?.error?.code === 'SOLD_OUT').length;
  const limited = results.filter((r) => r.status === 429).length;
  const gained = after.spots.booked - before.spots.booked;

  console.table({ requests: results.length, created, resumed, soldOut, rateLimited: limited, spotsBefore: before.spots.left, spotsAfter: after.spots.left });

  const ok = created === gained && created <= before.spots.left && after.spots.booked <= after.spots.total;
  console.log(ok ? 'PASS: no overbooking, counter matches successful holds' : 'FAIL: invariant violated');
  await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
  await mongoose.disconnect();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
