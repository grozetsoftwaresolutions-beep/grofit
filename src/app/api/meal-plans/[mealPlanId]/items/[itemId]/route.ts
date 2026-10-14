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

export async function PATCH(
  request: Request,
  props: { params: Promise<{ mealPlanId: string; itemId: string }> }
) {
  try {
    const { mealPlanId, itemId } = await props.params;

    if (!isValidUUID(mealPlanId) || !isValidUUID(itemId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'mealPlanId and itemId must be valid UUIDs.' } },
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

    // 1. Fetch item and verify owner and parent plan
    const { data: item, error: itemError } = await supabase
      .from('meal_plan_items')
      .select('id, meal_plan_id, food_id, meal_slot, quantity, quantity_unit, sort_order, user_id, foods(*)')
      .eq('id', itemId)
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (itemError || !item) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Meal plan item not found or access denied.' } },
        { status: 404 }
      );
    }

    interface PatchItemBody {
      quantity?: unknown;
      quantityUnit?: unknown;
      mealSlot?: unknown;
      sortOrder?: unknown;
    }

    let body: PatchItemBody;
    try {
      body = (await request.json()) as PatchItemBody;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body.' } },
        { status: 400 }
      );
    }

    interface ItemUpdateFields {
      quantity?: number;
      quantity_unit?: string;
      meal_slot?: string;
      sort_order?: number;
    }

    const updates: ItemUpdateFields = {};

    let targetQty = Number(item.quantity);
    let targetUnit = item.quantity_unit;

    if (body.quantity !== undefined) {
      const qRes = validatePortionQuantity(body.quantity);
      if (!qRes.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { quantity: qRes.error } } },
          { status: 400 }
        );
      }
      targetQty = qRes.value;
      updates.quantity = targetQty;
    }

    if (body.quantityUnit !== undefined) {
      const uRes = validatePortionUnit(typeof body.quantityUnit === 'string' ? body.quantityUnit : '');
      if (!uRes.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { quantityUnit: uRes.error } } },
          { status: 400 }
        );
      }
      targetUnit = uRes.value;
      updates.quantity_unit = targetUnit;
    }

    if (body.mealSlot !== undefined) {
      const sRes = validateMealSlot(typeof body.mealSlot === 'string' ? body.mealSlot : '');
      if (!sRes.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { mealSlot: sRes.error } } },
          { status: 400 }
        );
      }
      updates.meal_slot = sRes.value;
    }

    if (body.sortOrder !== undefined) {
      const o = parseInt(String(body.sortOrder), 10);
      if (!isNaN(o) && o >= 0) {
        updates.sort_order = o;
      }
    }

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
    }

    // 2. Validate unit compatibility with referenced food
    let foodData: FoodRecordLike | null = (item.foods as unknown as FoodRecordLike) || null;
    if (!foodData) {
      const seedMatch = VERIFIED_FOOD_SEEDS.find((f) => f.id === item.food_id);
      if (seedMatch) {
        foodData = seedMatch as unknown as FoodRecordLike;
      }
    }

    if (foodData) {
      const foodBasis: FoodNutrientBasis = {
        id: item.food_id,
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
      };

      const scaleCheck = scaleFoodNutrients(foodBasis, targetQty, targetUnit);
      if (!scaleCheck.success) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { quantityUnit: scaleCheck.error } } },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'No valid fields provided for update.' } },
        { status: 400 }
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from('meal_plan_items')
      .update(updates)
      .eq('id', itemId)
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id)
      .select('id, meal_plan_id, food_id, meal_slot, quantity, quantity_unit, sort_order, created_at, updated_at')
      .single();

    if (updateErr || !updated) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update meal plan item.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        mealPlanId: updated.meal_plan_id,
        foodId: updated.food_id,
        mealSlot: updated.meal_slot,
        quantity: Number(updated.quantity),
        quantityUnit: updated.quantity_unit,
        sortOrder: updated.sort_order,
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
  props: { params: Promise<{ mealPlanId: string; itemId: string }> }
) {
  try {
    const { mealPlanId, itemId } = await props.params;

    if (!isValidUUID(mealPlanId) || !isValidUUID(itemId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'mealPlanId and itemId must be valid UUIDs.' } },
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

    // Verify item ownership and delete item ONLY (never touching foods table)
    const { data: deleted, error } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('id', itemId)
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error || !deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Meal plan item not found or access denied.' } },
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
