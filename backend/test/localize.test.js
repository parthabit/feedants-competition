const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLang, pick, pickList } = require('../src/utils/localize');

test('parseLang handles headers, junk and unsupported languages', () => {
  assert.equal(parseLang('hi'), 'hi');
  assert.equal(parseLang('hi-IN,en;q=0.8'), 'hi');
  assert.equal(parseLang('fr-FR'), 'en');
  assert.equal(parseLang(undefined), 'en');
  assert.equal(parseLang(42), 'en');
});

test('pick falls back to English when a translation is missing', () => {
  assert.equal(pick({ en: 'Dance', hi: 'नृत्य' }, 'hi'), 'नृत्य');
  assert.equal(pick({ en: 'Dance' }, 'hi'), 'Dance');
  assert.equal(pick(undefined, 'hi'), '');
});

test('pickList falls back to English for empty translated lists', () => {
  assert.deepEqual(pickList({ en: ['a'], hi: [] }, 'hi'), ['a']);
  assert.deepEqual(pickList({ en: ['a'], hi: ['b'] }, 'hi'), ['b']);
});
