import { VERIFIED_FOOD_SEEDS, FoodSeedRecord } from './seed-data';
import {
  scaleFoodNutrients,
  calculateNutritionTotals,
  FoodItemBasis,
  NutritionTotalResult,
  ScaledNutrientResult,
} from './domain';

export interface SamplePlanItemDef {
  foodId: string;
  mealSlot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  quantityUnit: string;
  sortOrder: number;
}

export interface SamplePlanDef {
  id: string;
  name: string;
  badge: string;
  targetKcal: number;
  description: string;
  items: SamplePlanItemDef[];
}

export interface ComputedSampleItem {
  food: FoodSeedRecord;
  mealSlot: string;
  quantity: number;
  quantityUnit: string;
  scaled: ScaledNutrientResult;
}

export interface ComputedSamplePlan {
  id: string;
  name: string;
  badge: string;
  targetKcal: number;
  description: string;
  items: ComputedSampleItem[];
  slotTotals: Record<string, NutritionTotalResult>;
  dailyTotals: NutritionTotalResult;
}

export const SAMPLE_MEAL_PLANS: SamplePlanDef[] = [
  {
    id: 'sample-weight-loss-tamil-nadu',
    name: 'Tamil Nadu Lean Day (~1500 kcal)',
    badge: 'DEFICIT SAMPLE DAY',
    targetKcal: 1500,
    description: 'Balanced deficit structure using traditional Tamil Nadu staples with high protein distribution.',
    items: [
      // Breakfast
      { foodId: 'f1000000-0000-0000-0000-000000000005', mealSlot: 'breakfast', quantity: 150, quantityUnit: 'g', sortOrder: 1 }, // Idli (~3 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000008', mealSlot: 'breakfast', quantity: 150, quantityUnit: 'g', sortOrder: 2 }, // Sambar
      { foodId: 'f1000000-0000-0000-0000-000000000017', mealSlot: 'breakfast', quantity: 70, quantityUnit: 'g', sortOrder: 3 },  // Boiled Egg White (~2 pcs)

      // Lunch
      { foodId: 'f1000000-0000-0000-0000-000000000001', mealSlot: 'lunch', quantity: 150, quantityUnit: 'g', sortOrder: 4 }, // Ponni Rice
      { foodId: 'f1000000-0000-0000-0000-000000000007', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 5 }, // Toor Dal
      { foodId: 'f1000000-0000-0000-0000-000000000011', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 6 }, // Cabbage Poriyal
      { foodId: 'f1000000-0000-0000-0000-000000000013', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 7 }, // Curd

      // Snack
      { foodId: 'f1000000-0000-0000-0000-000000000020', mealSlot: 'snack', quantity: 100, quantityUnit: 'g', sortOrder: 8 }, // Banana
      { foodId: 'f1000000-0000-0000-0000-000000000022', mealSlot: 'snack', quantity: 20, quantityUnit: 'g', sortOrder: 9 },  // Roasted Peanuts
      { foodId: 'f1000000-0000-0000-0000-000000000024', mealSlot: 'snack', quantity: 100, quantityUnit: 'ml', sortOrder: 10 }, // Tender Coconut Water

      // Dinner
      { foodId: 'f1000000-0000-0000-0000-000000000003', mealSlot: 'dinner', quantity: 100, quantityUnit: 'g', sortOrder: 11 }, // Chapati (2 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000018', mealSlot: 'dinner', quantity: 100, quantityUnit: 'g', sortOrder: 12 }, // Chicken Breast
      { foodId: 'f1000000-0000-0000-0000-000000000010', mealSlot: 'dinner', quantity: 150, quantityUnit: 'g', sortOrder: 13 }, // Tomato Rasam
    ],
  },
  {
    id: 'sample-surplus-tamil-nadu',
    name: 'Tamil Nadu Muscle Gain Day (~2400 kcal)',
    badge: 'SURPLUS SAMPLE DAY',
    targetKcal: 2400,
    description: 'Caloric surplus structure for active strength training using parboiled rice, legumes, and lean protein.',
    items: [
      // Breakfast
      { foodId: 'f1000000-0000-0000-0000-000000000006', mealSlot: 'breakfast', quantity: 150, quantityUnit: 'g', sortOrder: 1 }, // Plain Dosa
      { foodId: 'f1000000-0000-0000-0000-000000000008', mealSlot: 'breakfast', quantity: 150, quantityUnit: 'g', sortOrder: 2 }, // Sambar
      { foodId: 'f1000000-0000-0000-0000-000000000016', mealSlot: 'breakfast', quantity: 100, quantityUnit: 'g', sortOrder: 3 }, // Whole Boiled Egg (2 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000023', mealSlot: 'breakfast', quantity: 100, quantityUnit: 'ml', sortOrder: 4 }, // Filter Coffee

      // Lunch
      { foodId: 'f1000000-0000-0000-0000-000000000002', mealSlot: 'lunch', quantity: 250, quantityUnit: 'g', sortOrder: 5 }, // Parboiled Rice
      { foodId: 'f1000000-0000-0000-0000-000000000019', mealSlot: 'lunch', quantity: 150, quantityUnit: 'g', sortOrder: 6 }, // Fish Curry
      { foodId: 'f1000000-0000-0000-0000-000000000012', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 7 }, // Keerai Poriyal
      { foodId: 'f1000000-0000-0000-0000-000000000013', mealSlot: 'lunch', quantity: 150, quantityUnit: 'g', sortOrder: 8 }, // Curd

      // Snack
      { foodId: 'f1000000-0000-0000-0000-000000000009', mealSlot: 'snack', quantity: 150, quantityUnit: 'g', sortOrder: 9 }, // Chickpea Sundal
      { foodId: 'f1000000-0000-0000-0000-000000000014', mealSlot: 'snack', quantity: 150, quantityUnit: 'ml', sortOrder: 10 }, // Cow Milk
      { foodId: 'f1000000-0000-0000-0000-000000000020', mealSlot: 'snack', quantity: 100, quantityUnit: 'g', sortOrder: 11 }, // Banana

      // Dinner
      { foodId: 'f1000000-0000-0000-0000-000000000003', mealSlot: 'dinner', quantity: 150, quantityUnit: 'g', sortOrder: 12 }, // Chapati (3 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000015', mealSlot: 'dinner', quantity: 100, quantityUnit: 'g', sortOrder: 13 }, // Paneer
      { foodId: 'f1000000-0000-0000-0000-000000000010', mealSlot: 'dinner', quantity: 150, quantityUnit: 'g', sortOrder: 14 }, // Tomato Rasam
    ],
  },
  {
    id: 'sample-mutton-chicken-nonveg',
    name: 'Tamil Nadu Non-Veg Power Day (~2000 kcal)',
    badge: 'NON-VEG PROTEIN DAY',
    targetKcal: 2000,
    description: 'High-protein non-vegetarian plan featuring authentic Tamil Nadu chicken curry, tender mutton sukka, boiled eggs, and parboiled rice.',
    items: [
      // Breakfast
      { foodId: 'f1000000-0000-0000-0000-000000000016', mealSlot: 'breakfast', quantity: 100, quantityUnit: 'g', sortOrder: 1 }, // Whole Boiled Egg (2 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000003', mealSlot: 'breakfast', quantity: 100, quantityUnit: 'g', sortOrder: 2 }, // Chapati (2 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000014', mealSlot: 'breakfast', quantity: 150, quantityUnit: 'ml', sortOrder: 3 }, // Cow Milk

      // Lunch
      { foodId: 'f1000000-0000-0000-0000-000000000002', mealSlot: 'lunch', quantity: 200, quantityUnit: 'g', sortOrder: 4 }, // Parboiled Rice
      { foodId: 'f1000000-0000-0000-0000-000000000031', mealSlot: 'lunch', quantity: 120, quantityUnit: 'g', sortOrder: 5 }, // Mutton Sukka
      { foodId: 'f1000000-0000-0000-0000-000000000012', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 6 }, // Keerai Poriyal
      { foodId: 'f1000000-0000-0000-0000-000000000013', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 7 }, // Curd

      // Snack
      { foodId: 'f1000000-0000-0000-0000-000000000024', mealSlot: 'snack', quantity: 200, quantityUnit: 'ml', sortOrder: 8 }, // Tender Coconut Water
      { foodId: 'f1000000-0000-0000-0000-000000000022', mealSlot: 'snack', quantity: 25, quantityUnit: 'g', sortOrder: 9 },  // Roasted Peanuts

      // Dinner
      { foodId: 'f1000000-0000-0000-0000-000000000003', mealSlot: 'dinner', quantity: 100, quantityUnit: 'g', sortOrder: 10 }, // Chapati (2 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000026', mealSlot: 'dinner', quantity: 150, quantityUnit: 'g', sortOrder: 11 }, // Chicken Curry
      { foodId: 'f1000000-0000-0000-0000-000000000010', mealSlot: 'dinner', quantity: 150, quantityUnit: 'g', sortOrder: 12 }, // Tomato Rasam
    ],
  },
  {
    id: 'sample-paneer-soya-veg',
    name: 'Tamil Nadu Vegetarian High-Protein Day (~1900 kcal)',
    badge: 'VEG PROTEIN DAY',
    targetKcal: 1900,
    description: 'Rich vegetarian muscle-support day combining paneer bhurji, grilled paneer tikka, high-protein soya chunks, and lentils.',
    items: [
      // Breakfast
      { foodId: 'f1000000-0000-0000-0000-000000000005', mealSlot: 'breakfast', quantity: 150, quantityUnit: 'g', sortOrder: 1 }, // Idli (3 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000008', mealSlot: 'breakfast', quantity: 150, quantityUnit: 'g', sortOrder: 2 }, // Sambar
      { foodId: 'f1000000-0000-0000-0000-000000000041', mealSlot: 'breakfast', quantity: 100, quantityUnit: 'g', sortOrder: 3 }, // Sprouted Moong Sundal

      // Lunch
      { foodId: 'f1000000-0000-0000-0000-000000000001', mealSlot: 'lunch', quantity: 200, quantityUnit: 'g', sortOrder: 4 }, // Ponni Rice
      { foodId: 'f1000000-0000-0000-0000-000000000040', mealSlot: 'lunch', quantity: 150, quantityUnit: 'g', sortOrder: 5 }, // Soya Chunks Curry
      { foodId: 'f1000000-0000-0000-0000-000000000038', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 6 }, // Palak Paneer
      { foodId: 'f1000000-0000-0000-0000-000000000013', mealSlot: 'lunch', quantity: 100, quantityUnit: 'g', sortOrder: 7 }, // Curd

      // Snack
      { foodId: 'f1000000-0000-0000-0000-000000000037', mealSlot: 'snack', quantity: 100, quantityUnit: 'g', sortOrder: 8 }, // Grilled Paneer Tikka
      { foodId: 'f1000000-0000-0000-0000-000000000021', mealSlot: 'snack', quantity: 100, quantityUnit: 'g', sortOrder: 9 }, // Apple

      // Dinner
      { foodId: 'f1000000-0000-0000-0000-000000000003', mealSlot: 'dinner', quantity: 100, quantityUnit: 'g', sortOrder: 10 }, // Chapati (2 pcs)
      { foodId: 'f1000000-0000-0000-0000-000000000036', mealSlot: 'dinner', quantity: 120, quantityUnit: 'g', sortOrder: 11 }, // Paneer Bhurji
      { foodId: 'f1000000-0000-0000-0000-000000000010', mealSlot: 'dinner', quantity: 150, quantityUnit: 'g', sortOrder: 12 }, // Tomato Rasam
    ],
  },
];

export function computeSamplePlan(planDef: SamplePlanDef): ComputedSamplePlan {
  const computedItems: ComputedSampleItem[] = [];
  const scaledList: ScaledNutrientResult[] = [];
  const slotGroups: Record<string, ScaledNutrientResult[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  for (const item of planDef.items) {
    const food = VERIFIED_FOOD_SEEDS.find((f) => f.id === item.foodId);
    if (!food) continue;

    const basis: FoodItemBasis = {
      id: food.id,
      name: food.name,
      category: food.category,
      foodForm: food.foodForm,
      referenceQuantity: food.referenceQuantity,
      referenceUnit: food.referenceUnit,
      energyKcal: food.energyKcal,
      proteinG: food.proteinG,
      carbohydratesG: food.carbohydratesG,
      fatG: food.fatG,
      fibreG: food.fibreG,
      sourceName: food.sourceName,
      sourceRecordId: food.sourceRecordId,
      sourceReference: food.sourceReference,
      matchStatus: food.matchStatus,
      valueMethod: food.valueMethod,
    };

    const scaledRes = scaleFoodNutrients(basis, item.quantity, item.quantityUnit);
    if (scaledRes.success) {
      computedItems.push({
        food,
        mealSlot: item.mealSlot,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        scaled: scaledRes.data,
      });
      scaledList.push(scaledRes.data);
      if (slotGroups[item.mealSlot]) {
        slotGroups[item.mealSlot].push(scaledRes.data);
      }
    }
  }

  const slotTotals: Record<string, NutritionTotalResult> = {
    breakfast: calculateNutritionTotals(slotGroups.breakfast),
    lunch: calculateNutritionTotals(slotGroups.lunch),
    dinner: calculateNutritionTotals(slotGroups.dinner),
    snack: calculateNutritionTotals(slotGroups.snack),
  };

  const dailyTotals = calculateNutritionTotals(scaledList);

  return {
    id: planDef.id,
    name: planDef.name,
    badge: planDef.badge,
    targetKcal: planDef.targetKcal,
    description: planDef.description,
    items: computedItems,
    slotTotals,
    dailyTotals,
  };
}

export function getAllComputedSamplePlans(): ComputedSamplePlan[] {
  return SAMPLE_MEAL_PLANS.map(computeSamplePlan);
}
