// Centralized Nutrition Domain Logic
// Tamil Nadu Fitness Companion — Phase 6

export interface NutrientValues {
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  fibreG: number | null;
}

export interface FoodItemBasis extends NutrientValues {
  id: string;
  name: string;
  category: string;
  foodForm?: string | null;
  referenceQuantity: number;
  referenceUnit: string;
  sourceName?: string;
  sourceRecordId?: string | null;
  sourceReference?: string;
  matchStatus?: 'exact' | 'approximate' | 'needs_review' | 'unresolved_review_needed';
  valueMethod?: 'source' | 'sourced' | 'calculated';
}

export interface ScaledNutrientResult extends NutrientValues {
  quantity: number;
  quantityUnit: string;
  scalingRatio: number;
  isComplete: boolean;
  isApproximate: boolean;
  needsReview: boolean;
  matchStatus: 'exact' | 'approximate' | 'needs_review' | 'unresolved_review_needed';
}

export interface NutritionTotalResult extends NutrientValues {
  itemCount: number;
  isComplete: boolean;
  isIncomplete: boolean;
  isApproximate: boolean;
  missingEnergyCount: number;
  missingNutrientFields: string[];
}

export type FoodNutrientBasis = FoodItemBasis;
export type ScaledFoodNutrients = ScaledNutrientResult;
export type NutritionTotals = NutritionTotalResult;

export interface TargetComparisonResult {
  canCompare: boolean;
  targetKcal: number | null;
  actualKcal: number | null;
  differenceKcal: number | null;
  differencePercent: number | null;
  status: 'surplus' | 'deficit' | 'matching_indication' | 'incomplete';
  isExactToleranceClaimed: boolean;
}

export const SUPPORTED_PORTION_UNITS = ['g', 'ml', 'serving', 'piece'] as const;
export type SupportedPortionUnit = typeof SUPPORTED_PORTION_UNITS[number];

export const SUPPORTED_MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type SupportedMealSlot = typeof SUPPORTED_MEAL_SLOTS[number];

/**
 * Validates a meal plan name. Must be 1 to 100 characters after trimming.
 */
export function validateMealPlanName(name: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof name !== 'string') {
    return { valid: false, value: '', error: 'Meal plan name must be a text string.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, value: '', error: 'Meal plan name cannot be blank.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, value: '', error: 'Meal plan name cannot exceed 100 characters.' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates a meal slot identifier.
 */
export function validateMealSlot(slot: unknown): { valid: boolean; value: SupportedMealSlot; error?: string } {
  if (typeof slot !== 'string') {
    return { valid: false, value: 'breakfast', error: 'Meal slot must be a string.' };
  }
  const normalized = slot.trim().toLowerCase();
  if (!SUPPORTED_MEAL_SLOTS.includes(normalized as SupportedMealSlot)) {
    return {
      valid: false,
      value: 'breakfast',
      error: `Invalid meal slot "${slot}". Must be one of: ${SUPPORTED_MEAL_SLOTS.join(', ')}.`,
    };
  }
  return { valid: true, value: normalized as SupportedMealSlot };
}

/**
 * Validates portion quantity. Must be a finite number strictly greater than zero and <= 5000.
 */
export function validatePortionQuantity(quantity: unknown): { valid: boolean; value: number; error?: string } {
  const num = typeof quantity === 'number' ? quantity : parseFloat(String(quantity));
  if (!Number.isFinite(num) || isNaN(num)) {
    return { valid: false, value: 0, error: 'Portion quantity must be a valid number.' };
  }
  if (num <= 0) {
    return { valid: false, value: 0, error: 'Portion quantity must be greater than zero.' };
  }
  if (num > 5000) {
    return { valid: false, value: 0, error: 'Portion quantity cannot exceed 5000.' };
  }
  return { valid: true, value: Math.round(num * 100) / 100 };
}

/**
 * Validates portion unit against supported units.
 */
export function validatePortionUnit(unit: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof unit !== 'string') {
    return { valid: false, value: '', error: 'Unit must be a text string.' };
  }
  const normalized = unit.trim().toLowerCase();
  if (!SUPPORTED_PORTION_UNITS.includes(normalized as SupportedPortionUnit)) {
    return {
      valid: false,
      value: normalized,
      error: `Unsupported unit "${unit}". Supported units: ${SUPPORTED_PORTION_UNITS.join(', ')}.`,
    };
  }
  return { valid: true, value: normalized };
}

/**
 * UUID v4 / RFC 4122 Validator.
 */
export function isValidUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Single nutrient scaling formula: N_Q = N_R * (Q / R)
 * Preserves null when source nutrient is unavailable.
 * Preserves valid 0 when source nutrient is 0.
 */
export function scaleNutrientValue(sourceValue: number | null | undefined, ratio: number): number | null {
  if (sourceValue === null || sourceValue === undefined) {
    return null;
  }
  if (!Number.isFinite(sourceValue) || isNaN(sourceValue)) {
    return null;
  }
  // Preserves genuine 0
  if (sourceValue === 0) {
    return 0;
  }
  const scaled = sourceValue * ratio;
  // Round to 1 decimal place
  return Math.round(scaled * 10) / 10;
}

/**
 * Determines whether requested portion unit is compatible with source reference unit.
 * g <-> g (1:1)
 * ml <-> ml (1:1)
 * serving / piece: valid only if referenceUnit is serving or piece.
 */
export function isUnitCompatible(requestedUnit: string, referenceUnit: string): boolean {
  const req = requestedUnit.trim().toLowerCase();
  const ref = referenceUnit.trim().toLowerCase();

  if (req === ref) return true;

  // Mass to mass
  if ((req === 'g' || req === 'gram' || req === 'grams') && (ref === 'g' || ref === 'gram' || ref === 'grams')) {
    return true;
  }

  // Volume to volume
  if ((req === 'ml' || req === 'milliliter') && (ref === 'ml' || ref === 'milliliter')) {
    return true;
  }

  return false;
}

/**
 * Scales all nutrients for a given food and portion quantity.
 */
export function scaleFoodNutrients(
  food: FoodItemBasis,
  requestedQuantity: number,
  requestedUnit: string
): { success: true; data: ScaledNutrientResult } | { success: false; error: string } {
  const qtyCheck = validatePortionQuantity(requestedQuantity);
  if (!qtyCheck.valid) {
    return { success: false, error: qtyCheck.error || 'Invalid quantity' };
  }

  const unitCheck = validatePortionUnit(requestedUnit);
  if (!unitCheck.valid) {
    return { success: false, error: unitCheck.error || 'Invalid unit' };
  }

  if (!isUnitCompatible(unitCheck.value, food.referenceUnit)) {
    return {
      success: false,
      error: `Incompatible units: portion unit "${requestedUnit}" cannot be converted to food reference unit "${food.referenceUnit}" without density data.`,
    };
  }

  if (food.referenceQuantity <= 0) {
    return { success: false, error: 'Food reference quantity must be greater than zero.' };
  }

  const ratio = qtyCheck.value / food.referenceQuantity;
  const matchStatus = food.matchStatus || 'exact';
  const isApproximate = matchStatus === 'approximate';
  const needsReview = matchStatus === 'needs_review';

  const energyKcal = scaleNutrientValue(food.energyKcal, ratio);
  const proteinG = scaleNutrientValue(food.proteinG, ratio);
  const carbohydratesG = scaleNutrientValue(food.carbohydratesG, ratio);
  const fatG = scaleNutrientValue(food.fatG, ratio);
  const fibreG = scaleNutrientValue(food.fibreG, ratio);

  // A record is complete if all 5 primary fields are known
  const isComplete =
    energyKcal !== null &&
    proteinG !== null &&
    carbohydratesG !== null &&
    fatG !== null &&
    fibreG !== null;

  return {
    success: true,
    data: {
      energyKcal,
      proteinG,
      carbohydratesG,
      fatG,
      fibreG,
      quantity: qtyCheck.value,
      quantityUnit: unitCheck.value,
      scalingRatio: Math.round(ratio * 1000) / 1000,
      isComplete,
      isApproximate,
      needsReview,
      matchStatus,
    },
  };
}

/**
 * Calculates sum of nutrition totals across a list of items.
 * Adheres strictly to:
 * 1. Missing values are NOT treated as zero.
 * 2. If ANY item is missing a nutrient, the resulting sum for that nutrient is marked incomplete.
 * 3. An incomplete energy sum prevents an authoritative complete calorie total.
 * 4. Approximate items propagate approximation status to totals.
 */
export function calculateNutritionTotals(
  items: Array<NutrientValues & { matchStatus?: string }>
): NutritionTotalResult {
  if (items.length === 0) {
    return {
      itemCount: 0,
      energyKcal: 0,
      proteinG: 0,
      carbohydratesG: 0,
      fatG: 0,
      fibreG: 0,
      isComplete: true,
      isIncomplete: false,
      isApproximate: false,
      missingEnergyCount: 0,
      missingNutrientFields: [],
    };
  }

  let totalEnergy = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFibre = 0;

  let hasMissingEnergy = false;
  let hasMissingProtein = false;
  let hasMissingCarbs = false;
  let hasMissingFat = false;
  let hasMissingFibre = false;

  let missingEnergyCount = 0;
  let isApproximate = false;

  for (const item of items) {
    if (item.matchStatus === 'approximate') {
      isApproximate = true;
    }

    // Energy
    if (item.energyKcal === null || item.energyKcal === undefined) {
      hasMissingEnergy = true;
      missingEnergyCount++;
    } else {
      totalEnergy += item.energyKcal;
    }

    // Protein
    if (item.proteinG === null || item.proteinG === undefined) {
      hasMissingProtein = true;
    } else {
      totalProtein += item.proteinG;
    }

    // Carbohydrates
    if (item.carbohydratesG === null || item.carbohydratesG === undefined) {
      hasMissingCarbs = true;
    } else {
      totalCarbs += item.carbohydratesG;
    }

    // Fat
    if (item.fatG === null || item.fatG === undefined) {
      hasMissingFat = true;
    } else {
      totalFat += item.fatG;
    }

    // Fibre
    if (item.fibreG === null || item.fibreG === undefined) {
      hasMissingFibre = true;
    } else {
      totalFibre += item.fibreG;
    }
  }

  const missingNutrientFields: string[] = [];
  if (hasMissingEnergy) missingNutrientFields.push('energyKcal');
  if (hasMissingProtein) missingNutrientFields.push('proteinG');
  if (hasMissingCarbs) missingNutrientFields.push('carbohydratesG');
  if (hasMissingFat) missingNutrientFields.push('fatG');
  if (hasMissingFibre) missingNutrientFields.push('fibreG');

  const isIncomplete = missingNutrientFields.length > 0;
  const isComplete = !isIncomplete;

  return {
    itemCount: items.length,
    // Return partial/known numerical sum, but null if complete is strictly required, or note partial sum
    energyKcal: hasMissingEnergy ? null : Math.round(totalEnergy * 10) / 10,
    proteinG: hasMissingProtein ? null : Math.round(totalProtein * 10) / 10,
    carbohydratesG: hasMissingCarbs ? null : Math.round(totalCarbs * 10) / 10,
    fatG: hasMissingFat ? null : Math.round(totalFat * 10) / 10,
    fibreG: hasMissingFibre ? null : Math.round(totalFibre * 10) / 10,
    isComplete,
    isIncomplete,
    isApproximate,
    missingEnergyCount,
    missingNutrientFields,
  };
}

/**
 * Target comparison between a calculated meal plan total and a user's daily calorie target.
 * Honors the specification constraint:
 * "The meal-plan calorie-target matching tolerance remains unresolved.
 * Until the product owner explicitly approves the tolerance:
 * - Display the calculated target difference when the inputs support it.
 * - Do not claim a meal plan is an exact or accepted match to the target.
 * - Do not hardcode a guessed tolerance."
 */
export function compareMealPlanToTarget(
  actualKcal: number | null | undefined,
  targetKcal: number | null | undefined
): TargetComparisonResult {
  if (
    actualKcal === null ||
    actualKcal === undefined ||
    targetKcal === null ||
    targetKcal === undefined ||
    targetKcal <= 0 ||
    !Number.isFinite(actualKcal) ||
    !Number.isFinite(targetKcal)
  ) {
    return {
      canCompare: false,
      targetKcal: targetKcal || null,
      actualKcal: actualKcal || null,
      differenceKcal: null,
      differencePercent: null,
      status: 'incomplete',
      isExactToleranceClaimed: false,
    };
  }

  const diff = Math.round((actualKcal - targetKcal) * 10) / 10;
  const diffPct = Math.round(((actualKcal - targetKcal) / targetKcal) * 1000) / 10;

  let status: 'surplus' | 'deficit' | 'matching_indication';
  if (diff > 0) {
    status = 'surplus';
  } else if (diff < 0) {
    status = 'deficit';
  } else {
    status = 'matching_indication';
  }

  return {
    canCompare: true,
    targetKcal,
    actualKcal,
    differenceKcal: diff,
    differencePercent: diffPct,
    status,
    isExactToleranceClaimed: false, // strictly adheres to rule
  };
}
