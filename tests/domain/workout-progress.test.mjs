import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWorkoutDate,
  validateCompletedSets,
  validateCompletedReps,
  validateLoadAndBodyweight,
  validateNotes,
  convertWeight,
  validateWorkoutLogInput,
  isValidUUID,
} from '../../src/lib/workout-progress/domain.ts';

test('validateWorkoutDate accepts valid calendar dates and rejects invalid ones', () => {
  assert.equal(validateWorkoutDate('2026-10-13').valid, true);
  assert.equal(validateWorkoutDate('2026-01-01').valid, true);
  assert.equal(validateWorkoutDate('2024-02-29').valid, true); // leap year

  // Invalid formats and dates
  assert.equal(validateWorkoutDate('2026-02-29').valid, false); // 2026 is not a leap year
  assert.equal(validateWorkoutDate('2026-02-31').valid, false);
  assert.equal(validateWorkoutDate('2026-13-01').valid, false);
  assert.equal(validateWorkoutDate('not-a-date').valid, false);
  assert.equal(validateWorkoutDate('').valid, false);
  assert.equal(validateWorkoutDate(null).valid, false);
  assert.equal(validateWorkoutDate('1899-12-31').valid, false); // year < 1900
});

test('validateCompletedSets enforces whole numbers 1 to 20 or null', () => {
  assert.deepEqual(validateCompletedSets(null), { valid: true, value: null });
  assert.deepEqual(validateCompletedSets(''), { valid: true, value: null });
  assert.deepEqual(validateCompletedSets(undefined), { valid: true, value: null });
  assert.deepEqual(validateCompletedSets(3), { valid: true, value: 3 });
  assert.deepEqual(validateCompletedSets('5'), { valid: true, value: 5 });
  assert.deepEqual(validateCompletedSets(1), { valid: true, value: 1 });
  assert.deepEqual(validateCompletedSets(20), { valid: true, value: 20 });

  assert.equal(validateCompletedSets(0).valid, false);
  assert.equal(validateCompletedSets(21).valid, false);
  assert.equal(validateCompletedSets(3.5).valid, false);
  assert.equal(validateCompletedSets('abc').valid, false);
});

test('validateCompletedReps enforces whole numbers 1 to 200 or null', () => {
  assert.deepEqual(validateCompletedReps(null), { valid: true, value: null });
  assert.deepEqual(validateCompletedReps(10), { valid: true, value: 10 });
  assert.deepEqual(validateCompletedReps('15'), { valid: true, value: 15 });
  assert.deepEqual(validateCompletedReps(1), { valid: true, value: 1 });
  assert.deepEqual(validateCompletedReps(200), { valid: true, value: 200 });

  assert.equal(validateCompletedReps(0).valid, false);
  assert.equal(validateCompletedReps(201).valid, false);
  assert.equal(validateCompletedReps(12.5).valid, false);
  assert.equal(validateCompletedReps('xyz').valid, false);
});

test('validateLoadAndBodyweight handles external load, bodyweight, and absent load', () => {
  // Case 1: Valid External Load
  const resKg = validateLoadAndBodyweight({ externalLoad: 50, externalLoadUnit: 'kg', isBodyweight: false });
  assert.equal(resKg.valid, true);
  assert.deepEqual(resKg.value, { externalLoad: 50, externalLoadUnit: 'kg', isBodyweight: false });

  const resLbs = validateLoadAndBodyweight({ externalLoad: '110.5', externalLoadUnit: 'lbs', isBodyweight: false });
  assert.equal(resLbs.valid, true);
  assert.deepEqual(resLbs.value, { externalLoad: 110.5, externalLoadUnit: 'lbs', isBodyweight: false });

  // Rejects 0 or negative load
  assert.equal(validateLoadAndBodyweight({ externalLoad: 0, externalLoadUnit: 'kg', isBodyweight: false }).valid, false);
  assert.equal(validateLoadAndBodyweight({ externalLoad: -10, externalLoadUnit: 'kg', isBodyweight: false }).valid, false);

  // Rejects load without unit
  assert.equal(validateLoadAndBodyweight({ externalLoad: 50, externalLoadUnit: null, isBodyweight: false }).valid, false);
  assert.equal(validateLoadAndBodyweight({ externalLoad: 50, externalLoadUnit: 'stones', isBodyweight: false }).valid, false);

  // Case 2: Bodyweight (must have null load and null unit)
  const bw = validateLoadAndBodyweight({ externalLoad: null, externalLoadUnit: null, isBodyweight: true });
  assert.equal(bw.valid, true);
  assert.deepEqual(bw.value, { externalLoad: null, externalLoadUnit: null, isBodyweight: true });

  // Rejects bodyweight with load or unit
  assert.equal(validateLoadAndBodyweight({ externalLoad: 20, externalLoadUnit: null, isBodyweight: true }).valid, false);
  assert.equal(validateLoadAndBodyweight({ externalLoad: null, externalLoadUnit: 'kg', isBodyweight: true }).valid, false);

  // Case 3: No external load, not bodyweight
  const noLoad = validateLoadAndBodyweight({ externalLoad: null, externalLoadUnit: null, isBodyweight: false });
  assert.equal(noLoad.valid, true);
  assert.deepEqual(noLoad.value, { externalLoad: null, externalLoadUnit: null, isBodyweight: false });

  // Unit specified without load is rejected
  assert.equal(validateLoadAndBodyweight({ externalLoad: null, externalLoadUnit: 'kg', isBodyweight: false }).valid, false);
});

test('validateNotes trims text and enforces 500 char limit', () => {
  assert.deepEqual(validateNotes(null), { valid: true, value: null });
  assert.deepEqual(validateNotes('   '), { valid: true, value: null });
  assert.deepEqual(validateNotes(' Felt smooth on the last set '), { valid: true, value: 'Felt smooth on the last set' });

  const longText = 'a'.repeat(501);
  assert.equal(validateNotes(longText).valid, false);
});

test('convertWeight uses canonical conversion constants', () => {
  const kg = 100;
  const lbs = convertWeight(kg, 'kg', 'lbs');
  assert.equal(Math.round(lbs * 100) / 100, 220.46);

  const backToKg = convertWeight(lbs, 'lbs', 'kg');
  assert.equal(Math.round(backToKg * 100) / 100, 100);
});

test('validateWorkoutLogInput validates full record', () => {
  const validPayload = {
    exerciseId: 'a1000000-0000-0000-0000-000000000001',
    loggedOn: '2026-10-13',
    setsCompleted: 4,
    repsCompleted: 12,
    externalLoad: 25,
    externalLoadUnit: 'kg',
    isBodyweight: false,
    notes: 'Good form',
  };

  const res = validateWorkoutLogInput(validPayload);
  assert.equal(res.valid, true);
  assert.equal(res.data.exerciseId, 'a1000000-0000-0000-0000-000000000001');
  assert.equal(res.data.setsCompleted, 4);
  assert.equal(res.data.externalLoad, 25);
  assert.equal(res.data.externalLoadUnit, 'kg');

  // Invalid payload
  const invalidRes = validateWorkoutLogInput({
    exerciseId: 'not-a-uuid',
    loggedOn: '2026-02-31',
    setsCompleted: 99,
    repsCompleted: -5,
    externalLoad: 0,
    externalLoadUnit: 'kg',
    isBodyweight: true,
  });
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.error.fieldErrors.exerciseId);
  assert.ok(invalidRes.error.fieldErrors.loggedOn);
  assert.ok(invalidRes.error.fieldErrors.setsCompleted);
  assert.ok(invalidRes.error.fieldErrors.repsCompleted);
});

test('isValidUUID validates valid and invalid UUID strings', () => {
  assert.equal(isValidUUID('a1000000-0000-0000-0000-000000000001'), true);
  assert.equal(isValidUUID('07014628-88e5-4897-bfd3-fb9298b11809'), true);
  assert.equal(isValidUUID('invalid-uuid'), false);
  assert.equal(isValidUUID(''), false);
  assert.equal(isValidUUID(null), false);
});

