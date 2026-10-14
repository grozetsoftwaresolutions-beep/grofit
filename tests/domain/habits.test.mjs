import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateHabitName,
  validateHabitDescription,
  validateHabitDate,
  isValidIANATimezone,
  getLocalCalendarDate,
  addDays,
  calculateCurrentStreak,
  calculateBestStreak,
  calculateStreaks,
  isValidUUID,
} from '../../src/lib/habits/domain.ts';

test('validateHabitName trims text and enforces 1 to 100 character limits', () => {
  assert.equal(validateHabitName('Drink 2L Water').valid, true);
  assert.equal(validateHabitName('Drink 2L Water').value, 'Drink 2L Water');
  assert.equal(validateHabitName('  Morning Meditation  ').value, 'Morning Meditation');

  assert.equal(validateHabitName('').valid, false);
  assert.equal(validateHabitName('   ').valid, false);
  assert.equal(validateHabitName(null).valid, false);
  assert.equal(validateHabitName('a'.repeat(101)).valid, false);
});

test('validateHabitDescription trims text and enforces 500 character limits', () => {
  assert.deepEqual(validateHabitDescription(null), { valid: true, value: null });
  assert.deepEqual(validateHabitDescription('   '), { valid: true, value: null });
  assert.deepEqual(validateHabitDescription('Daily 15 min walks'), { valid: true, value: 'Daily 15 min walks' });

  assert.equal(validateHabitDescription('a'.repeat(501)).valid, false);
});

test('validateHabitDate validates YYYY-MM-DD calendar dates', () => {
  assert.equal(validateHabitDate('2026-10-13').valid, true);
  assert.equal(validateHabitDate('2024-02-29').valid, true);

  assert.equal(validateHabitDate('2026-02-29').valid, false);
  assert.equal(validateHabitDate('2026-13-01').valid, false);
  assert.equal(validateHabitDate('invalid-date').valid, false);
  assert.equal(validateHabitDate('').valid, false);
});

test('isValidIANATimezone recognizes valid IANA timezones and rejects invalid ones', () => {
  assert.equal(isValidIANATimezone('Asia/Kolkata'), true);
  assert.equal(isValidIANATimezone('UTC'), true);
  assert.equal(isValidIANATimezone('America/New_York'), true);

  assert.equal(isValidIANATimezone('Invalid/Timezone'), false);
  assert.equal(isValidIANATimezone(''), false);
  assert.equal(isValidIANATimezone(null), false);
});

test('addDays accurately performs UTC calendar arithmetic', () => {
  assert.equal(addDays('2026-10-13', 1), '2026-10-14');
  assert.equal(addDays('2026-10-13', -1), '2026-10-12');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29'); // Leap year
});

test('calculateCurrentStreak: handles empty, single today, single yesterday, and inactive streaks', () => {
  const today = '2026-10-13';
  const yesterday = '2026-10-12';
  const twoDaysAgo = '2026-10-11';

  // Empty history
  assert.equal(calculateCurrentStreak([], today), 0);

  // Completed today
  assert.equal(calculateCurrentStreak([today], today), 1);

  // Completed yesterday, today not yet completed (streak active while today is in progress)
  assert.equal(calculateCurrentStreak([yesterday], today), 1);

  // Completed 2 days ago, but neither today nor yesterday completed (broken streak)
  assert.equal(calculateCurrentStreak([twoDaysAgo], today), 0);
});

test('calculateCurrentStreak: counts consecutive completed dates backwards from endpoint', () => {
  const today = '2026-10-13';

  // 4 days streak ending today: [2026-10-10, 2026-10-11, 2026-10-12, 2026-10-13]
  const streakToday = ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'];
  assert.equal(calculateCurrentStreak(streakToday, today), 4);

  // 3 days streak ending yesterday: [2026-10-10, 2026-10-11, 2026-10-12]
  const streakYesterday = ['2026-10-10', '2026-10-11', '2026-10-12'];
  assert.equal(calculateCurrentStreak(streakYesterday, today), 3);

  // Streak with a gap: [2026-10-08, 2026-10-09, 2026-10-11, 2026-10-12, 2026-10-13]
  // Consecutive backwards: 13, 12, 11 (gap at 10) -> current streak is 3
  const streakWithGap = ['2026-10-08', '2026-10-09', '2026-10-11', '2026-10-12', '2026-10-13'];
  assert.equal(calculateCurrentStreak(streakWithGap, today), 3);

  // Does not count future dates
  const streakWithFuture = [today, '2026-10-14', '2026-10-15'];
  assert.equal(calculateCurrentStreak(streakWithFuture, today), 1);
});

test('calculateBestStreak: calculates longest consecutive run across all history', () => {
  // Empty
  assert.equal(calculateBestStreak([]), 0);

  // Single date
  assert.equal(calculateBestStreak(['2026-10-10']), 1);

  // Multiple runs: 3 days in Sep, 6 days in Oct
  const runs = [
    '2026-09-01', '2026-09-02', '2026-09-03', // 3 days
    // gap
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', // 6 days
    // gap
    '2026-10-12', '2026-10-13', // 2 days
  ];
  assert.equal(calculateBestStreak(runs), 6);

  // Duplicate dates in history do not inflate streak
  const duplicates = ['2026-10-01', '2026-10-01', '2026-10-02', '2026-10-02', '2026-10-03'];
  assert.equal(calculateBestStreak(duplicates), 3);
});

test('calculateStreaks: returns currentStreak, bestStreak, and isCompletedToday', () => {
  const today = '2026-10-13';
  const history = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-12', '2026-10-13'];

  const res = calculateStreaks(history, today);
  assert.equal(res.currentStreak, 2);
  assert.equal(res.bestStreak, 4);
  assert.equal(res.isCompletedToday, true);
});

test('isValidUUID validates UUID strings', () => {
  assert.equal(isValidUUID('a1000000-0000-0000-0000-000000000001'), true);
  assert.equal(isValidUUID('invalid-uuid'), false);
});

test('getLocalCalendarDate: resolves calendar date across timezones and midnight boundaries', () => {
  // 2026-10-13 at 20:00 UTC
  // In Asia/Kolkata (+5:30): 2026-10-14 01:30 (next day!)
  // In America/New_York (-4:00): 2026-10-13 16:00 (same day)
  const utcDate = new Date('2026-10-13T20:00:00.000Z');

  assert.equal(getLocalCalendarDate(utcDate, 'Asia/Kolkata'), '2026-10-14');
  assert.equal(getLocalCalendarDate(utcDate, 'America/New_York'), '2026-10-13');
  assert.equal(getLocalCalendarDate(utcDate, 'UTC'), '2026-10-13');

  // Invalid timezone falls back to Asia/Kolkata default safely
  assert.equal(getLocalCalendarDate(utcDate, 'Invalid/Timezone'), '2026-10-14');
});

