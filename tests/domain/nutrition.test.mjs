import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scaleFoodNutrients,
  scaleNutrientValue,
  calculateNutritionTotals,
  compareMealPlanToTarget,
  validateMealPlanName,
  validateMealSlot,
  validatePortionQuantity,
  validatePortionUnit,
  isValidUUID,
} from '../../src/lib/nutrition/domain.ts';

// Synthetic test food fixture (explicit values for arithmetic verification)
const SYNTHETIC_CHICKEN = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Synthetic Chicken Breast',
  category: 'poultry_meat',
  foodForm: 'cooked',
  referenceQuantity: 100,
  referenceUnit: 'g',
  energyKcal: 165,
  proteinG: 31.0,
  carbohydratesG: 0.0, // valid zero
  fatG: 3.6,
  fibreG: 0.0, // valid zero
  sourceName: 'USDA_FDC',
  matchStatus: 'exact',
};

const SYNTHETIC_INCOMPLETE_FOOD = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Synthetic Incomplete Herb',
  category: 'beverages',
  foodForm: 'raw',
  referenceQuantity: 100,
  referenceUnit: 'g',
  energyKcal: null, // missing energy
  proteinG: null, // missing protein
  carbohydratesG: 5.0,
  fatG: null,
  fibreG: 2.0,
  sourceName: 'IFCT_2017',
  matchStatus: 'needs_review',
};

const SYNTHETIC_APPROXIMATE_DISH = {
  id: '00000000-0000-0000-0000-000000000003',
  name: 'Synthetic Sambar Dish',
  category: 'prepared_dishes',
  foodForm: 'cooked',
  referenceQuantity: 100,
  referenceUnit: 'g',
  energyKcal: 75,
  proteinG: 2.8,
  carbohydratesG: 11.2,
  fatG: 1.8,
  fibreG: 2.2,
  sourceName: 'IFCT_2017',
  matchStatus: 'approximate',
};

test('1. scaleNutrientValue: accurately computes N_Q = N_R * (Q / R)', () => {
  // Scaling 100g basis to 150g (ratio 1.5)
  // 31.0 * 1.5 = 46.5
  assert.equal(scaleNutrientValue(31.0, 1.5), 46.5);

  // Scaling 100g basis to 50g (ratio 0.5)
  // 165 * 0.5 = 82.5
  assert.equal(scaleNutrientValue(165, 0.5), 82.5);
});

test('2. scaleNutrientValue: preserves valid zeros and preserves nulls', () => {
  // Carbohydrate is valid 0.0 -> must remain 0.0, NOT null
  assert.equal(scaleNutrientValue(0.0, 1.5), 0.0);
  assert.equal(scaleNutrientValue(0, 2.0), 0);

  // Missing nutrient (null) -> must remain null, NEVER 0
  assert.equal(scaleNutrientValue(null, 1.5), null);
  assert.equal(scaleNutrientValue(undefined, 1.5), null);
});

test('3. scaleFoodNutrients: scales complete food with compatible units', () => {
  const result = scaleFoodNutrients(SYNTHETIC_CHICKEN, 200, 'g');
  assert.equal(result.success, true);
  if (result.success) {
    // 200g is 2x reference of 100g
    assert.equal(result.data.energyKcal, 330); // 165 * 2
    assert.equal(result.data.proteinG, 62.0); // 31.0 * 2
    assert.equal(result.data.carbohydratesG, 0.0); // 0.0 * 2 = 0.0
    assert.equal(result.data.fatG, 7.2); // 3.6 * 2
    assert.equal(result.data.fibreG, 0.0);
    assert.equal(result.data.isComplete, true);
    assert.equal(result.data.isApproximate, false);
    assert.equal(result.data.scalingRatio, 2.0);
  }
});

test('4. scaleFoodNutrients: rejects zero, negative, or invalid quantities', () => {
  assert.equal(scaleFoodNutrients(SYNTHETIC_CHICKEN, 0, 'g').success, false);
  assert.equal(scaleFoodNutrients(SYNTHETIC_CHICKEN, -50, 'g').success, false);
  assert.equal(scaleFoodNutrients(SYNTHETIC_CHICKEN, NaN, 'g').success, false);
  assert.equal(scaleFoodNutrients(SYNTHETIC_CHICKEN, 10000, 'g').success, false); // exceeds 5000g limit
});

test('5. scaleFoodNutrients: rejects incompatible units without conversion', () => {
  // Food reference is 'g' (mass). Requesting 'ml' (volume) must be rejected
  const res = scaleFoodNutrients(SYNTHETIC_CHICKEN, 150, 'ml');
  assert.equal(res.success, false);
  assert.match(res.error, /incompatible units/i);
});

test('6. calculateNutritionTotals: sums complete items with valid zeros', () => {
  const items = [
    { energyKcal: 330, proteinG: 62.0, carbohydratesG: 0.0, fatG: 7.2, fibreG: 0.0, matchStatus: 'exact' },
    { energyKcal: 150, proteinG: 5.6, carbohydratesG: 22.4, fatG: 3.6, fibreG: 4.4, matchStatus: 'exact' },
  ];

  const totals = calculateNutritionTotals(items);
  assert.equal(totals.itemCount, 2);
  assert.equal(totals.energyKcal, 480);
  assert.equal(totals.proteinG, 67.6);
  assert.equal(totals.carbohydratesG, 22.4);
  assert.equal(totals.fatG, 10.8);
  assert.equal(totals.fibreG, 4.4);
  assert.equal(totals.isComplete, true);
  assert.equal(totals.isIncomplete, false);
  assert.equal(totals.isApproximate, false);
});

test('7. calculateNutritionTotals: marks total incomplete when any item lacks energy or nutrients', () => {
  const scaledIncomplete = scaleFoodNutrients(SYNTHETIC_INCOMPLETE_FOOD, 50, 'g');
  assert.equal(scaledIncomplete.success, true);
  const itemsWithMissing = [
    { energyKcal: 330, proteinG: 62.0, carbohydratesG: 0.0, fatG: 7.2, fibreG: 0.0, matchStatus: 'exact' },
    scaledIncomplete.data,
  ];

  const totals = calculateNutritionTotals(itemsWithMissing);
  assert.equal(totals.itemCount, 2);
  // Missing energy MUST NOT be treated as 0 kcal!
  assert.equal(totals.energyKcal, null);
  assert.equal(totals.proteinG, null);
  assert.equal(totals.isComplete, false);
  assert.equal(totals.isIncomplete, true);
  assert.equal(totals.missingEnergyCount, 1);
  assert.ok(totals.missingNutrientFields.includes('energyKcal'));
  assert.ok(totals.missingNutrientFields.includes('proteinG'));
});

test('8. calculateNutritionTotals: propagates approximate status from any item', () => {
  const scaledApprox = scaleFoodNutrients(SYNTHETIC_APPROXIMATE_DISH, 200, 'g');
  assert.equal(scaledApprox.success, true);
  const items = [
    { energyKcal: 200, proteinG: 10, carbohydratesG: 30, fatG: 5, fibreG: 2, matchStatus: 'exact' },
    scaledApprox.data,
  ];

  const totals = calculateNutritionTotals(items);
  assert.equal(totals.isApproximate, true);
  assert.equal(totals.isComplete, true);
});

test('9. compareMealPlanToTarget: calculates difference and never claims exact tolerance', () => {
  // Plan total = 2200 kcal, Target = 2000 kcal -> +200 kcal surplus (+10.0%)
  const cmpSurplus = compareMealPlanToTarget(2200, 2000);
  assert.equal(cmpSurplus.canCompare, true);
  assert.equal(cmpSurplus.differenceKcal, 200);
  assert.equal(cmpSurplus.differencePercent, 10.0);
  assert.equal(cmpSurplus.status, 'surplus');
  assert.equal(cmpSurplus.isExactToleranceClaimed, false);

  // Plan total = 1850 kcal, Target = 2000 kcal -> -150 kcal deficit (-7.5%)
  const cmpDeficit = compareMealPlanToTarget(1850, 2000);
  assert.equal(cmpDeficit.canCompare, true);
  assert.equal(cmpDeficit.differenceKcal, -150);
  assert.equal(cmpDeficit.differencePercent, -7.5);
  assert.equal(cmpDeficit.status, 'deficit');
  assert.equal(cmpDeficit.isExactToleranceClaimed, false);

  // Incomplete calorie total -> comparison not possible
  const cmpIncomplete = compareMealPlanToTarget(null, 2000);
  assert.equal(cmpIncomplete.canCompare, false);
  assert.equal(cmpIncomplete.status, 'incomplete');
});

test('10. Validation helpers: meal plan names, slots, and quantities', () => {
  assert.equal(validateMealPlanName('Weight Loss Tamil Nadu Plan').valid, true);
  assert.equal(validateMealPlanName('   ').valid, false);
  assert.equal(validateMealPlanName('a'.repeat(101)).valid, false);

  assert.equal(validateMealSlot('breakfast').valid, true);
  assert.equal(validateMealSlot('LUNCH').valid, true);
  assert.equal(validateMealSlot('midnight_snack').valid, false);

  assert.equal(validatePortionQuantity(150).valid, true);
  assert.equal(validatePortionQuantity(-5).valid, false);

  assert.equal(validatePortionUnit('g').valid, true);
  assert.equal(validatePortionUnit('ml').valid, true);
  assert.equal(validatePortionUnit('bucket').valid, false);

  assert.equal(isValidUUID('f1000000-0000-0000-0000-000000000001'), true);
  assert.equal(isValidUUID('not-a-uuid'), false);
});
