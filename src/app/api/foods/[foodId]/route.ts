import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidUUID } from '@/lib/nutrition/domain';
import { VERIFIED_FOOD_SEEDS } from '@/lib/nutrition/seed-data';

interface FoodDatabaseRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  food_form?: string | null;
  foodForm?: string | null;
  dietary_preference?: string;
  dietaryPreference?: string;
  meal_types?: string[];
  mealTypes?: string[];
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
  source_record_id?: string | null;
  sourceRecordId?: string | null;
  source_reference?: string;
  sourceReference?: string;
  source_url?: string | null;
  sourceUrl?: string | null;
  match_status?: string;
  matchStatus?: string;
  value_method?: string;
  valueMethod?: string;
  is_active?: boolean;
  isActive?: boolean;
}

function formatFoodRow(row: FoodDatabaseRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    foodForm: row.food_form ?? row.foodForm ?? null,
    dietaryPreference: row.dietary_preference ?? row.dietaryPreference ?? 'vegetarian',
    mealTypes: row.meal_types ?? row.mealTypes ?? [],
    referenceQuantity: Number(row.reference_quantity ?? row.referenceQuantity ?? 100),
    referenceUnit: row.reference_unit ?? row.referenceUnit ?? 'g',
    energyKcal: row.energy_kcal !== null && row.energy_kcal !== undefined ? Number(row.energy_kcal) : (row.energyKcal !== undefined ? row.energyKcal : null),
    proteinG: row.protein_g !== null && row.protein_g !== undefined ? Number(row.protein_g) : (row.proteinG !== undefined ? row.proteinG : null),
    carbohydratesG: row.carbohydrates_g !== null && row.carbohydrates_g !== undefined ? Number(row.carbohydrates_g) : (row.carbohydratesG !== undefined ? row.carbohydratesG : null),
    fatG: row.fat_g !== null && row.fat_g !== undefined ? Number(row.fat_g) : (row.fatG !== undefined ? row.fatG : null),
    fibreG: row.fibre_g !== null && row.fibre_g !== undefined ? Number(row.fibre_g) : (row.fibreG !== undefined ? row.fibreG : null),
    sourceName: row.source_name ?? row.sourceName ?? 'IFCT 2017',
    sourceRecordId: row.source_record_id ?? row.sourceRecordId ?? null,
    sourceReference: row.source_reference ?? row.sourceReference ?? '',
    sourceUrl: row.source_url ?? row.sourceUrl ?? null,
    matchStatus: row.match_status ?? row.matchStatus ?? 'exact',
    valueMethod: row.value_method ?? row.valueMethod ?? 'sourced',
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
  };
}

export async function GET(
  request: Request,
  props: { params: Promise<{ foodId: string }> }
) {
  try {
    const { foodId } = await props.params;

    if (!isValidUUID(foodId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'foodId must be a valid UUID.' } },
        { status: 400 }
      );
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('id', foodId)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ data: formatFoodRow(data) });
      }
    } catch {
      // Fallback
    }

    // Fallback to verified seed constants
    const seed = VERIFIED_FOOD_SEEDS.find((f) => f.id === foodId && f.isActive);
    if (seed) {
      return NextResponse.json({ data: formatFoodRow(seed) });
    }

    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Food item not found.' } },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
