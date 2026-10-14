import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCalories,
  MIN_DAILY_TARGET_KCAL
} from '../../src/lib/domain/calorie-calculator.ts';

test('Reference Case (docs/05-domain-logic & docs/11-test-plan)', () => {
  // Reference Case: Age 25, Height 180 cm, Weight 90 kg, +5, moderately active (1.55), maintain (0%)
  const result = calculateCalories({
    ageYears: 25,
    height: { value: 180, unit: 'cm' },
    weight: { value: 90, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'moderately_active',
    goal: 'maintain',
  });

  assert.equal(result.status, 'calculated');
  // BMR = 10*90 + 6.25*180 - 5*25 + 5 = 900 + 1125 - 125 + 5 = 1905
  assert.equal(result.unrounded.bmr, 1905);
  assert.equal(result.bmrKcalPerDay, 1905);

  // TDEE = 1905 * 1.55 = 2952.75
  assert.equal(result.unrounded.tdee, 2952.75);
  assert.equal(result.maintenanceKcalPerDay, 2950);

  // Target = 2952.75 * 1.0 = 2952.75 -> rounded to nearest 10: 2950
  assert.equal(result.unrounded.target, 2952.75);
  assert.equal(result.targetKcalPerDay, 2950);
  assert.equal(result.method, 'mifflin_st_jeor');
  assert.equal(result.units.energy, 'kcal/day');
});

test('BMR Variant (-161 vs +5)', () => {
  // Test -161 variant with same inputs
  // BMR = 10*90 + 6.25*180 - 5*25 - 161 = 1900 - 161 = 1739
  const result = calculateCalories({
    ageYears: 25,
    height: { value: 180, unit: 'cm' },
    weight: { value: 90, unit: 'kg' },
    bmrVariant: 'minus_161',
    activityLevel: 'moderately_active',
    goal: 'maintain',
  });

  assert.equal(result.status, 'calculated');
  assert.equal(result.unrounded.bmr, 1739);
  assert.equal(result.bmrKcalPerDay, 1739);
  // TDEE = 1739 * 1.55 = 2695.45 -> nearest 10: 2700
  assert.ok(Math.abs(result.unrounded.tdee - 2695.45) < 0.0001);
  assert.equal(result.maintenanceKcalPerDay, 2700);
  assert.equal(result.targetKcalPerDay, 2700);
});

test('All 5 Activity Multipliers', () => {
  const baseInput = {
    ageYears: 25,
    height: { value: 180, unit: 'cm' },
    weight: { value: 90, unit: 'kg' },
    bmrVariant: 'plus_5',
    goal: 'maintain',
  };

  const bmr = 1905;

  // Sedentary (1.2)
  const sed = calculateCalories({ ...baseInput, activityLevel: 'sedentary' });
  assert.equal(sed.status, 'calculated');
  assert.equal(sed.unrounded.tdee, bmr * 1.2); // 2286
  assert.equal(sed.maintenanceKcalPerDay, 2290);

  // Lightly active (1.375)
  const light = calculateCalories({ ...baseInput, activityLevel: 'lightly_active' });
  assert.equal(light.status, 'calculated');
  assert.equal(light.unrounded.tdee, bmr * 1.375); // 2619.375
  assert.equal(light.maintenanceKcalPerDay, 2620);

  // Moderately active (1.55)
  const mod = calculateCalories({ ...baseInput, activityLevel: 'moderately_active' });
  assert.equal(mod.status, 'calculated');
  assert.equal(mod.unrounded.tdee, bmr * 1.55); // 2952.75
  assert.equal(mod.maintenanceKcalPerDay, 2950);

  // Very active (1.725)
  const very = calculateCalories({ ...baseInput, activityLevel: 'very_active' });
  assert.equal(very.status, 'calculated');
  assert.equal(very.unrounded.tdee, bmr * 1.725); // 3286.125
  assert.equal(very.maintenanceKcalPerDay, 3290);

  // Extra active (1.9)
  const extra = calculateCalories({ ...baseInput, activityLevel: 'extra_active' });
  assert.equal(extra.status, 'calculated');
  assert.equal(extra.unrounded.tdee, bmr * 1.9); // 3619.5
  assert.equal(extra.maintenanceKcalPerDay, 3620);
});

test('All 3 Goals (Loss -15%, Maintenance 0%, Gain +10%)', () => {
  const baseInput = {
    ageYears: 25,
    height: { value: 180, unit: 'cm' },
    weight: { value: 90, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'moderately_active', // TDEE = 2952.75
  };

  // Lose (-15%): 2952.75 * 0.85 = 2509.8375 -> nearest 10: 2510
  const lose = calculateCalories({ ...baseInput, goal: 'lose' });
  assert.equal(lose.status, 'calculated');
  assert.equal(lose.unrounded.target, 2952.75 * 0.85);
  assert.equal(lose.targetKcalPerDay, 2510);

  // Maintain (0%): 2952.75 -> nearest 10: 2950
  const maintain = calculateCalories({ ...baseInput, goal: 'maintain' });
  assert.equal(maintain.status, 'calculated');
  assert.equal(maintain.targetKcalPerDay, 2950);

  // Gain (+10%): 2952.75 * 1.10 = 3248.025 -> nearest 10: 3250
  const gain = calculateCalories({ ...baseInput, goal: 'gain' });
  assert.equal(gain.status, 'calculated');
  assert.equal(gain.unrounded.target, 2952.75 * 1.10);
  assert.equal(gain.targetKcalPerDay, 3250);
});

test('Under-18 restriction', () => {
  const result = calculateCalories({
    ageYears: 17,
    height: { value: 175, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'sedentary',
    goal: 'maintain',
  });

  assert.equal(result.status, 'underage');
  assert.equal(result.targetKcalPerDay, null);
  assert.equal(result.errorCode, 'UNDERAGE_NOT_ELIGIBLE');
  assert.match(result.message, /18 and older/);
});

test('Age boundary tests (18, 120, and out-of-bounds)', () => {
  const validBase = {
    height: { value: 175, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'sedentary',
    goal: 'maintain',
  };

  // Age 18 (valid)
  const age18 = calculateCalories({ ...validBase, ageYears: 18 });
  assert.equal(age18.status, 'calculated');

  // Age 120 (valid)
  const age120 = calculateCalories({ ...validBase, ageYears: 120 });
  assert.equal(age120.status, 'calculated');

  // Age 121 (invalid)
  const age121 = calculateCalories({ ...validBase, ageYears: 121 });
  assert.equal(age121.status, 'invalid_input');
  assert.equal(age121.errorCode, 'AGE_EXCEEDS_MAXIMUM');

  // Age non-integer or negative or NaN
  assert.equal(calculateCalories({ ...validBase, ageYears: 25.5 }).status, 'invalid_input');
  assert.equal(calculateCalories({ ...validBase, ageYears: -5 }).status, 'invalid_input');
  assert.equal(calculateCalories({ ...validBase, ageYears: NaN }).status, 'invalid_input');
});

test('Height bounds (100–250 cm) and conversions', () => {
  const validBase = {
    ageYears: 30,
    weight: { value: 70, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'sedentary',
    goal: 'maintain',
  };

  // 100 cm (min bound)
  assert.equal(calculateCalories({ ...validBase, height: { value: 100, unit: 'cm' } }).status, 'calculated');

  // 99.9 cm (below min bound)
  assert.equal(calculateCalories({ ...validBase, height: { value: 99.9, unit: 'cm' } }).status, 'invalid_input');

  // 250 cm (max bound)
  assert.equal(calculateCalories({ ...validBase, height: { value: 250, unit: 'cm' } }).status, 'calculated');

  // 250.1 cm (above max bound)
  assert.equal(calculateCalories({ ...validBase, height: { value: 250.1, unit: 'cm' } }).status, 'invalid_input');

  // Imperial unit: 70.8661 inches ≈ 180 cm
  const imperialH = calculateCalories({ ...validBase, height: { value: 70.8661, unit: 'in' } });
  assert.equal(imperialH.status, 'calculated');
  assert.ok(Math.abs(imperialH.unrounded.normalizedHeightCm - 180) < 0.01);
});

test('Weight bounds (25–350 kg) and conversions', () => {
  const validBase = {
    ageYears: 30,
    height: { value: 175, unit: 'cm' },
    bmrVariant: 'plus_5',
    activityLevel: 'sedentary',
    goal: 'maintain',
  };

  // 25 kg (min bound)
  assert.equal(calculateCalories({ ...validBase, weight: { value: 25, unit: 'kg' } }).status, 'calculated');

  // 24.9 kg (below min bound)
  assert.equal(calculateCalories({ ...validBase, weight: { value: 24.9, unit: 'kg' } }).status, 'invalid_input');

  // 350 kg (max bound)
  assert.equal(calculateCalories({ ...validBase, weight: { value: 350, unit: 'kg' } }).status, 'calculated');

  // 350.1 kg (above max bound)
  assert.equal(calculateCalories({ ...validBase, weight: { value: 350.1, unit: 'kg' } }).status, 'invalid_input');

  // Imperial unit: 198.416 lbs ≈ 90 kg
  const imperialW = calculateCalories({ ...validBase, weight: { value: 198.416, unit: 'lbs' } });
  assert.equal(imperialW.status, 'calculated');
  assert.ok(Math.abs(imperialW.unrounded.normalizedWeightKg - 90) < 0.01);
});

test('Safety Guardrail (MIN_DAILY_TARGET_KCAL = 1200): target withheld, not clamped', () => {
  // Low weight, low height, older age, -161 variant, sedentary, weight loss (-15%)
  // W=30kg, H=110cm, A=70, -161 variant:
  // BMR = 10*30 + 6.25*110 - 5*70 - 161 = 300 + 687.5 - 350 - 161 = 476.5
  // TDEE = 476.5 * 1.2 = 571.8
  // Target = 571.8 * 0.85 = 486.03 (< 1200)
  const result = calculateCalories({
    ageYears: 70,
    height: { value: 110, unit: 'cm' },
    weight: { value: 30, unit: 'kg' },
    bmrVariant: 'minus_161',
    activityLevel: 'sedentary',
    goal: 'lose',
  });

  assert.equal(result.status, 'target_withheld');
  assert.equal(result.targetKcalPerDay, null);
  assert.equal(result.reasonCode, 'TARGET_BELOW_APPROVED_MINIMUM');
  assert.ok(result.unrounded.target < MIN_DAILY_TARGET_KCAL);
  assert.notEqual(result.targetKcalPerDay, 1200, 'Must NOT silently clamp to 1200');
  assert.match(result.message, /below the application safety guardrail/);
});

test('Invalid Enums and Malformed Values', () => {
  const validBase = {
    ageYears: 25,
    height: { value: 180, unit: 'cm' },
    weight: { value: 90, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'moderately_active',
    goal: 'maintain',
  };

  // Invalid BMR variant
  assert.equal(calculateCalories({ ...validBase, bmrVariant: 'plus_100' }).status, 'invalid_input');

  // Invalid Activity level
  assert.equal(calculateCalories({ ...validBase, activityLevel: 'couch_potato' }).status, 'invalid_input');

  // Invalid Goal
  assert.equal(calculateCalories({ ...validBase, goal: 'bulk_up' }).status, 'invalid_input');

  // Invalid Units
  assert.equal(calculateCalories({ ...validBase, height: { value: 180, unit: 'meters' } }).status, 'invalid_input');
  assert.equal(calculateCalories({ ...validBase, weight: { value: 90, unit: 'stones' } }).status, 'invalid_input');

  // Non-finite values
  assert.equal(calculateCalories({ ...validBase, height: { value: Infinity, unit: 'cm' } }).status, 'invalid_input');
  assert.equal(calculateCalories({ ...validBase, weight: { value: NaN, unit: 'kg' } }).status, 'invalid_input');
});
