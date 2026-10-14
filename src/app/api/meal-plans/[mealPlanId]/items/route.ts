import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import {
  isValidUUID,
  validateMealSlot,
  validatePortionQuantity,
  validatePortionUnit,
  scaleFoodNutrients,
  FoodNutrientBasis,
} from '@/lib/nutrition/domain';
import { VERIFIED_FOOD_SEEDS } from '@/lib/nutrition/seed-data';

export async function POST(
  request: Request,
  props: { params: Promise<{ mealPlanId: string }> }
) {
  try {
    const { mealPlanId } = await props.params;

    if (!isValidUUID(mealPlanId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'mealPlanId must be a valid UUID.' } },
        { status: 400 }
      );
    }

    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    // 1. Verify meal plan exists and belongs to user
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (planError || !plan) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Meal plan not found or access denied.' } },
        { status: 404 }
      );
    }

    interface AddItemBody {
      foodId?: unknown;
      mealSlot?: unknown;
      quantity?: unknown;
      quantityUnit?: unknown;
      sortOrder?: unknown;
    }

    let body: AddItemBody;
    try {
      body = (await request.json()) as AddItemBody;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body.' } },
        { status: 400 }
      );
    }

    // 2. Validate input fields
    const { foodId, mealSlot, quantity, quantityUnit, sortOrder } = body;

    if (typeof foodId !== 'string' || !isValidUUID(foodId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', fieldErrors: { foodId: 'foodId must be a valid UUID.' } } },
        { status: 400 }
      );
    }

    const slotRes = validateMealSlot(typeof mealSlot === 'string' ? mealSlot : '');
    if (!slotRes.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', fieldErrors: { mealSlot: slotRes.error } } },
        { status: 400 }
      );
    }

    const qtyRes = validatePortionQuantity(quantity);
    if (!qtyRes.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', fieldErrors: { quantity: qtyRes.error } } },
        { status: 400 }
      );
    }

    const unitRes = validatePortionUnit(typeof quantityUnit === 'string' ? quantityUnit : '');
    if (!unitRes.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', fieldErrors: { quantityUnit: unitRes.error } } },
        { status: 400 }
      );
    }

    // 3. Verify food exists and load reference info
    interface FoodRecordLike {
      name: string;
      category: string;
      food_form?: string | null;
      foodForm?: string | null;
      reference_quantity?: number | string;
      referenceQuantity?: number | string;
      reference_unit?: string;
      referenceUnit?: string;
      energy_kcal?: number | null;
      energyKcal?: number | null;
      protein_g?: number | null;
      proteinG?: number | null;
      carbohydrates_g?: number | null;
      carbohydratesG?: number | null;
      fat_g?: number | null;
      fatG?: number | null;
      fibre_g?: number | null;
      fibreG?: number | null;
      source_name?: string;
      sourceName?: string;
      match_status?: 'exact' | 'approximate' | 'unresolved_review_needed';
      matchStatus?: 'exact' | 'approximate' | 'unresolved_review_needed';
      value_method?: 'sourced' | 'calculated';
      valueMethod?: 'sourced' | 'calculated';
      is_active?: boolean;
      isActive?: boolean;
    }

    let foodData: FoodRecordLike | null = null;
    const { data: dbFood, error: dbFoodErr } = await supabase
      .from('foods')
      .select('*')
      .eq('id', foodId)
      .eq('is_active', true)
      .maybeSingle();

    if (!dbFoodErr && dbFood) {
      foodData = dbFood as FoodRecordLike;
    } else {
      const seedMatch = VERIFIED_FOOD_SEEDS.find((f) => f.id === foodId && f.isActive);
      if (seedMatch) {
        foodData = seedMatch as FoodRecordLike;
      }
    }

    if (!foodData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Referenced food not found in catalogue.' } },
        { status: 404 }
      );
    }

    const foodBasis: FoodNutrientBasis = {
      id: foodId,
      name: foodData.name,
      category: foodData.category,
      foodForm: foodData.food_form ?? foodData.foodForm ?? null,
      referenceQuantity: Number(foodData.reference_quantity ?? foodData.referenceQuantity ?? 100),
      referenceUnit: foodData.reference_unit ?? foodData.referenceUnit ?? 'g',
      energyKcal: foodData.energy_kcal !== undefined ? (foodData.energy_kcal !== null ? Number(foodData.energy_kcal) : null) : (foodData.energyKcal ?? null),
      proteinG: foodData.protein_g !== undefined ? (foodData.protein_g !== null ? Number(foodData.protein_g) : null) : (foodData.proteinG ?? null),
      carbohydratesG: foodData.carbohydrates_g !== undefined ? (foodData.carbohydrates_g !== null ? Number(foodData.carbohydrates_g) : null) : (foodData.carbohydratesG ?? null),
      fatG: foodData.fat_g !== undefined ? (foodData.fat_g !== null ? Number(foodData.fat_g) : null) : (foodData.fatG ?? null),
      fibreG: foodData.fibre_g !== undefined ? (foodData.fibre_g !== null ? Number(foodData.fibre_g) : null) : (foodData.fibreG ?? null),
      sourceName: foodData.source_name ?? foodData.sourceName ?? 'IFCT_2017',
      matchStatus: foodData.match_status ?? foodData.matchStatus ?? 'exact',
      valueMethod: foodData.value_method ?? foodData.valueMethod ?? 'sourced',
    };

    // Verify unit compatibility before saving
    const scaleRes = scaleFoodNutrients(foodBasis, qtyRes.value, unitRes.value);
    if (!scaleRes.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', fieldErrors: { quantityUnit: scaleRes.error } } },
        { status: 400 }
      );
    }

    let order = 0;
    if (sortOrder !== undefined && sortOrder !== null) {
      const numOrder = parseInt(String(sortOrder), 10);
      if (!isNaN(numOrder) && numOrder >= 0) {
        order = numOrder;
      }
    }

    // 4. Insert item into meal_plan_items
    const { data: created, error: insertErr } = await supabase
      .from('meal_plan_items')
      .insert({
        user_id: user.id,
        meal_plan_id: mealPlanId,
        food_id: foodId,
        meal_slot: slotRes.value,
        quantity: qtyRes.value,
        quantity_unit: unitRes.value,
        sort_order: order,
      })
      .select('id, meal_plan_id, food_id, meal_slot, quantity, quantity_unit, sort_order, created_at, updated_at')
      .single();

    if (insertErr || !created) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to add item to meal plan.' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: created.id,
          mealPlanId: created.meal_plan_id,
          foodId: created.food_id,
          mealSlot: created.meal_slot,
          quantity: Number(created.quantity),
          quantityUnit: created.quantity_unit,
          sortOrder: created.sort_order,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
          food: foodBasis,
          scaledNutrients: scaleRes.data,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
