import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import {
  isValidUUID,
  validateMealPlanName,
  scaleFoodNutrients,
  calculateNutritionTotals,
  compareMealPlanToTarget,
  SUPPORTED_MEAL_SLOTS,
  FoodNutrientBasis,
  ScaledFoodNutrients,
  NutritionTotals,
} from '@/lib/nutrition/domain';
import { VERIFIED_FOOD_SEEDS } from '@/lib/nutrition/seed-data';

export async function GET(
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

    // 1. Fetch meal plan
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, name, target_kcal, user_id, created_at, updated_at')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (planError || !plan) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Meal plan not found or access denied.' } },
        { status: 404 }
      );
    }

    // 2. Fetch items for this plan
    const { data: rawItems, error: itemsError } = await supabase
      .from('meal_plan_items')
      .select('id, meal_plan_id, food_id, meal_slot, quantity, quantity_unit, sort_order, created_at, updated_at, foods(*)')
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve meal plan items.' } },
        { status: 500 }
      );
    }

    interface RawFoodData {
      name?: string;
      category?: string;
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
      match_status?: 'exact' | 'approximate' | 'needs_review' | 'unresolved_review_needed';
      matchStatus?: 'exact' | 'approximate' | 'needs_review' | 'unresolved_review_needed';
      value_method?: 'source' | 'sourced' | 'calculated';
      valueMethod?: 'source' | 'sourced' | 'calculated';
    }

    interface RawItemRow {
      id: string;
      meal_plan_id: string;
      food_id: string;
      meal_slot: string;
      quantity: number | string;
      quantity_unit: string;
      sort_order: number;
      created_at: string;
      updated_at: string;
      foods?: RawFoodData | null;
    }

    // 3. Scale items and group by slot
    const items = ((rawItems || []) as unknown as RawItemRow[]).map((item) => {
      // Find food from joined row or fallback to seed
      let foodData: RawFoodData | undefined = item.foods || undefined;
      if (!foodData) {
        foodData = VERIFIED_FOOD_SEEDS.find((f) => f.id === item.food_id);
      }

      const foodBasis: FoodNutrientBasis = {
        id: item.food_id,
        name: foodData?.name || 'Unknown Food',
        category: foodData?.category || 'general',
        foodForm: foodData?.food_form ?? foodData?.foodForm ?? null,
        referenceQuantity: Number(foodData?.reference_quantity ?? foodData?.referenceQuantity ?? 100),
        referenceUnit: foodData?.reference_unit ?? foodData?.referenceUnit ?? 'g',
        energyKcal: foodData?.energy_kcal !== undefined ? (foodData.energy_kcal !== null ? Number(foodData.energy_kcal) : null) : (foodData?.energyKcal !== undefined ? foodData.energyKcal : null),
        proteinG: foodData?.protein_g !== undefined ? (foodData.protein_g !== null ? Number(foodData.protein_g) : null) : (foodData?.proteinG !== undefined ? foodData.proteinG : null),
        carbohydratesG: foodData?.carbohydrates_g !== undefined ? (foodData.carbohydrates_g !== null ? Number(foodData.carbohydrates_g) : null) : (foodData?.carbohydratesG !== undefined ? foodData.carbohydratesG : null),
        fatG: foodData?.fat_g !== undefined ? (foodData.fat_g !== null ? Number(foodData.fat_g) : null) : (foodData?.fatG !== undefined ? foodData.fatG : null),
        fibreG: foodData?.fibre_g !== undefined ? (foodData.fibre_g !== null ? Number(foodData.fibre_g) : null) : (foodData?.fibreG !== undefined ? foodData.fibreG : null),
        sourceName: foodData?.source_name ?? foodData?.sourceName ?? 'IFCT_2017',
        matchStatus: foodData?.match_status ?? foodData?.matchStatus ?? 'exact',
        valueMethod: foodData?.value_method ?? foodData?.valueMethod ?? 'sourced',
      };

      const scaled = scaleFoodNutrients(foodBasis, Number(item.quantity), item.quantity_unit);

      return {
        id: item.id,
        mealPlanId: item.meal_plan_id,
        foodId: item.food_id,
        mealSlot: item.meal_slot,
        quantity: Number(item.quantity),
        quantityUnit: item.quantity_unit,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        food: foodBasis,
        scaledNutrients: scaled.success ? scaled.data : null,
      };
    });

    // 4. Calculate per-meal totals and daily total
    const slotTotals: Record<string, NutritionTotals> = {};
    for (const slot of SUPPORTED_MEAL_SLOTS) {
      const slotItems = items
        .filter((i) => i.mealSlot === slot && i.scaledNutrients)
        .map((i) => i.scaledNutrients as ScaledFoodNutrients);
      slotTotals[slot] = calculateNutritionTotals(slotItems);
    }

    const allScaledItems = items
      .filter((i) => i.scaledNutrients)
      .map((i) => i.scaledNutrients as ScaledFoodNutrients);
    const dailyTotals = calculateNutritionTotals(allScaledItems);

    // 5. Compare with target (if set)
    const targetComparison = compareMealPlanToTarget(dailyTotals.energyKcal, plan.target_kcal);

    return NextResponse.json({
      data: {
        id: plan.id,
        name: plan.name,
        targetKcal: plan.target_kcal !== null ? Number(plan.target_kcal) : null,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
        items,
        slotTotals,
        dailyTotals,
        targetComparison,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    interface PatchBody {
      name?: unknown;
      targetKcal?: unknown;
    }

    let body: PatchBody;
    try {
      body = (await request.json()) as PatchBody;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body.' } },
        { status: 400 }
      );
    }

    const updates: { name?: string; target_kcal?: number | null } = {};

    if (body.name !== undefined) {
      const nameRes = validateMealPlanName(typeof body.name === 'string' ? body.name : '');
      if (!nameRes.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { name: nameRes.error } } },
          { status: 400 }
        );
      }
      updates.name = nameRes.value;
    }

    if (body.targetKcal !== undefined) {
      if (body.targetKcal === null) {
        updates.target_kcal = null;
      } else {
        const num = Number(body.targetKcal);
        if (isNaN(num) || num < 500 || num > 10000) {
          return NextResponse.json(
            { error: { code: 'INVALID_INPUT', fieldErrors: { targetKcal: 'Target calories must be between 500 and 10,000 kcal.' } } },
            { status: 400 }
          );
        }
        updates.target_kcal = Math.round(num);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'No valid fields provided for update.' } },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from('meal_plans')
      .update(updates)
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .select('id, name, target_kcal, created_at, updated_at')
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Meal plan not found or access denied.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        targetKcal: updated.target_kcal !== null ? Number(updated.target_kcal) : null,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify ownership and delete
    const { data: deleted, error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error || !deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Meal plan not found or access denied.' } },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
