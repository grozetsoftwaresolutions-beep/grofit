/**
 * Centralized Domain Logic for Calorie Calculator
 * Reference: docs/05-domain-logic-reviewed.md
 */

export const MIN_DAILY_TARGET_KCAL = 1200;

export const INCHES_TO_CM = 2.54;
export const LBS_TO_KG = 0.45359237;

export const AGE_MIN_YEARS = 18;
export const AGE_MAX_YEARS = 120;

export const HEIGHT_MIN_CM = 100;
export const HEIGHT_MAX_CM = 250;

export const WEIGHT_MIN_KG = 25;
export const WEIGHT_MAX_KG = 350;

export type HeightUnit = 'cm' | 'in';
export type WeightUnit = 'kg' | 'lbs';

export type BmrVariant = 'plus_5' | 'minus_161';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type Goal = 'lose' | 'maintain' | 'gain';

export const BMR_COEFFICIENTS: Record<BmrVariant, number> = {
  plus_5: 5,
  minus_161: -161,
};

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -0.15,
  maintain: 0.0,
  gain: 0.1,
};

export const ESTIMATE_DISCLAIMER =
  'This is an estimate, not an individualized medical prescription.';

export interface CalorieCalculatorInput {
  ageYears: number;
  height: {
    value: number;
    unit: HeightUnit;
  };
  weight: {
    value: number;
    unit: WeightUnit;
  };
  bmrVariant: BmrVariant;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export type CalculationStatus =
  | 'calculated'
  | 'underage'
  | 'target_withheld'
  | 'invalid_input'
  | 'invalid_calculation';

export interface CalculatedResult {
  status: 'calculated';
  bmrKcalPerDay: number;
  maintenanceKcalPerDay: number;
  targetKcalPerDay: number;
  unrounded: {
    bmr: number;
    tdee: number;
    target: number;
    normalizedHeightCm: number;
    normalizedWeightKg: number;
  };
  units: {
    energy: 'kcal/day';
    height: 'cm';
    weight: 'kg';
  };
  method: 'mifflin_st_jeor';
  estimateDisclaimer: string;
}

export interface TargetWithheldResult {
  status: 'target_withheld';
  bmrKcalPerDay: number;
  maintenanceKcalPerDay: number;
  targetKcalPerDay: null;
  reasonCode: 'TARGET_BELOW_APPROVED_MINIMUM';
  unrounded: {
    bmr: number;
    tdee: number;
    target: number;
    normalizedHeightCm: number;
    normalizedWeightKg: number;
  };
  message: string;
}

export interface IneligibleResult {
  status: 'underage' | 'invalid_input' | 'invalid_calculation';
  targetKcalPerDay: null;
  errorCode: string;
  message: string;
}

export type CalorieCalculatorResult =
  | CalculatedResult
  | TargetWithheldResult
  | IneligibleResult;

/**
 * Normalizes height to centimetres using canonical conversion.
 */
export function normalizeHeightCm(value: number, unit: HeightUnit): number {
  if (!Number.isFinite(value) || value <= 0) return NaN;
  if (unit === 'cm') return value;
  if (unit === 'in') return value * INCHES_TO_CM;
  return NaN;
}

/**
 * Normalizes weight to kilograms using canonical conversion.
 */
export function normalizeWeightKg(value: number, unit: WeightUnit): number {
  if (!Number.isFinite(value) || value <= 0) return NaN;
  if (unit === 'kg') return value;
  if (unit === 'lbs') return value * LBS_TO_KG;
  return NaN;
}

/**
 * Rounding policy:
 * - BMR: nearest whole kcal/day for display.
 * - TDEE / Maintenance: nearest 10 kcal/day per docs/05-domain-logic & docs/09-api-spec.
 * - Daily target: nearest 10 kcal/day for display, after safety checks.
 */
export function roundToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function roundToNearestWhole(value: number): number {
  return Math.round(value);
}

/**
 * Pure domain function to calculate daily energy targets using the Mifflin-St Jeor formula.
 */
export function calculateCalories(
  input: CalorieCalculatorInput
): CalorieCalculatorResult {
  // 1. Validate age
  if (
    typeof input?.ageYears !== 'number' ||
    !Number.isFinite(input.ageYears) ||
    !Number.isInteger(input.ageYears) ||
    input.ageYears <= 0
  ) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'INVALID_AGE',
      message: 'Age must be a positive whole integer number of years.',
    };
  }

  if (input.ageYears < AGE_MIN_YEARS) {
    return {
      status: 'underage',
      targetKcalPerDay: null,
      errorCode: 'UNDERAGE_NOT_ELIGIBLE',
      message:
        'The calorie calculator is designed for adults aged 18 and older. Calorie targets cannot be estimated for individuals under 18.',
    };
  }

  if (input.ageYears > AGE_MAX_YEARS) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'AGE_EXCEEDS_MAXIMUM',
      message: `Age must not exceed ${AGE_MAX_YEARS} years.`,
    };
  }

  // 2. Validate height unit and value
  if (!input.height || !['cm', 'in'].includes(input.height.unit)) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'INVALID_HEIGHT_UNIT',
      message: 'Supported height units are cm or in.',
    };
  }

  const heightCm = normalizeHeightCm(input.height.value, input.height.unit);
  if (
    !Number.isFinite(heightCm) ||
    heightCm < HEIGHT_MIN_CM ||
    heightCm > HEIGHT_MAX_CM
  ) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'HEIGHT_OUT_OF_BOUNDS',
      message: `Height must be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm (approx. ${(HEIGHT_MIN_CM / INCHES_TO_CM).toFixed(1)}–${(HEIGHT_MAX_CM / INCHES_TO_CM).toFixed(1)} inches).`,
    };
  }

  // 3. Validate weight unit and value
  if (!input.weight || !['kg', 'lbs'].includes(input.weight.unit)) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'INVALID_WEIGHT_UNIT',
      message: 'Supported weight units are kg or lbs.',
    };
  }

  const weightKg = normalizeWeightKg(input.weight.value, input.weight.unit);
  if (
    !Number.isFinite(weightKg) ||
    weightKg < WEIGHT_MIN_KG ||
    weightKg > WEIGHT_MAX_KG
  ) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'WEIGHT_OUT_OF_BOUNDS',
      message: `Weight must be between ${WEIGHT_MIN_KG} and ${WEIGHT_MAX_KG} kg (approx. ${(WEIGHT_MIN_KG / LBS_TO_KG).toFixed(1)}–${(WEIGHT_MAX_KG / LBS_TO_KG).toFixed(1)} lbs).`,
    };
  }

  // 4. Validate BMR Variant
  if (!input.bmrVariant || !(input.bmrVariant in BMR_COEFFICIENTS)) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'INVALID_BMR_VARIANT',
      message:
        'A valid BMR formula coefficient option (+5 or -161) must be selected.',
    };
  }

  // 5. Validate Activity Level
  if (!input.activityLevel || !(input.activityLevel in ACTIVITY_MULTIPLIERS)) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'INVALID_ACTIVITY_LEVEL',
      message: 'A valid activity level must be selected.',
    };
  }

  // 6. Validate Goal
  if (!input.goal || !(input.goal in GOAL_ADJUSTMENTS)) {
    return {
      status: 'invalid_input',
      targetKcalPerDay: null,
      errorCode: 'INVALID_GOAL',
      message:
        'A valid goal (lose, maintain, or gain) must be selected.',
    };
  }

  // 7. Calculate BMR using Mifflin-St Jeor equation:
  // BMR = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + coefficient
  const coefficient = BMR_COEFFICIENTS[input.bmrVariant];
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.ageYears + coefficient;

  if (!Number.isFinite(bmr) || bmr <= 0) {
    return {
      status: 'invalid_calculation',
      targetKcalPerDay: null,
      errorCode: 'INVALID_BMR_RESULT',
      message: 'Unable to compute a valid physiological BMR with the provided measurements.',
    };
  }

  // 8. Calculate TDEE:
  // TDEE = BMR * activityMultiplier
  const activityMultiplier = ACTIVITY_MULTIPLIERS[input.activityLevel];
  const tdee = bmr * activityMultiplier;

  if (!Number.isFinite(tdee) || tdee <= 0) {
    return {
      status: 'invalid_calculation',
      targetKcalPerDay: null,
      errorCode: 'INVALID_TDEE_RESULT',
      message: 'Unable to compute a valid total daily energy expenditure.',
    };
  }

  // 9. Calculate Goal Target:
  // Target = TDEE * (1 + goalAdjustment)
  const goalAdjustment = GOAL_ADJUSTMENTS[input.goal];
  const unroundedTarget = tdee * (1 + goalAdjustment);

  // 10. Check Safety Guardrail:
  // MIN_DAILY_TARGET_KCAL = 1200 kcal/day
  if (unroundedTarget < MIN_DAILY_TARGET_KCAL) {
    return {
      status: 'target_withheld',
      bmrKcalPerDay: roundToNearestWhole(bmr),
      maintenanceKcalPerDay: roundToNearestTen(tdee),
      targetKcalPerDay: null,
      reasonCode: 'TARGET_BELOW_APPROVED_MINIMUM',
      unrounded: {
        bmr,
        tdee,
        target: unroundedTarget,
        normalizedHeightCm: heightCm,
        normalizedWeightKg: weightKg,
      },
      message:
        `The calculated daily target of ${roundToNearestWhole(unroundedTarget)} kcal/day is below the application safety guardrail of ${MIN_DAILY_TARGET_KCAL} kcal/day. For safety, this target is withheld. Please consult a qualified health or nutrition professional for personalized advice.`,
    };
  }

  // 11. Normal Successful Output
  return {
    status: 'calculated',
    bmrKcalPerDay: roundToNearestWhole(bmr),
    maintenanceKcalPerDay: roundToNearestTen(tdee),
    targetKcalPerDay: roundToNearestTen(unroundedTarget),
    unrounded: {
      bmr,
      tdee,
      target: unroundedTarget,
      normalizedHeightCm: heightCm,
      normalizedWeightKg: weightKg,
    },
    units: {
      energy: 'kcal/day',
      height: 'cm',
      weight: 'kg',
    },
    method: 'mifflin_st_jeor',
    estimateDisclaimer: ESTIMATE_DISCLAIMER,
  };
}
