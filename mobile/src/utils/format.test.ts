import test from 'node:test';
import assert from 'node:assert/strict';
import { countdownParts, formatCountdown, formatDate, formatINR, formatMinSec, formatTime, groupIndian, ordinal } from './format.ts';

test('Indian grouping', () => {
  assert.equal(groupIndian(99), '99');
  assert.equal(groupIndian(1500), '1,500');
  assert.equal(groupIndian(125000), '1,25,000');
  assert.equal(formatINR(550), '₹ 550');
});

test('IST date/time formatting matches the design', () => {
  // 10 Aug 2026 11:50 PM IST == 18:20 UTC
  assert.equal(formatDate('2026-08-10T18:20:00Z'), '10 Aug 26');
  assert.equal(formatTime('2026-08-10T18:20:00Z'), '11:50 PM');
  // 6 Aug 2026 04:00 AM IST == 5 Aug 22:30 UTC (date rolls over across the UTC boundary)
  assert.equal(formatDate('2026-08-05T22:30:00Z'), '6 Aug 26');
  assert.equal(formatTime('2026-08-05T22:30:00Z'), '04:00 AM');
  assert.equal(formatTime('2026-08-05T06:30:00Z'), '12:00 PM');
  assert.equal(formatTime('2026-08-05T18:30:00Z'), '12:00 AM');
});

test('countdown formatting matches the design (01d : 06h : 28m : 32s)', () => {
  const ms = ((1 * 24 + 6) * 3600 + 28 * 60 + 32) * 1000;
  assert.equal(formatCountdown(ms), '01d : 06h : 28m : 32s');
  assert.deepEqual(countdownParts(-5000), { days: '00', hours: '00', minutes: '00', seconds: '00' });
  assert.equal(formatMinSec(7 * 60 * 1000 + 5000), '07:05');
});

test('ordinals', () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd']);
});
