import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

interface FormattedFoodResponse {
  id: string;
  name: string;
  description: string | null;
  category: string;
  foodForm: string | null;
  dietaryPreference: string;
  mealTypes: string[];
  referenceQuantity: number;
  referenceUnit: string;
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  fibreG: number | null;
  sourceName: string;
  sourceRecordId: string | null;
  sourceReference: string;
  sourceUrl: string | null;
  matchStatus: string;
  valueMethod: string;
  isActive: boolean;
}

function formatFoodRow(row: FoodDatabaseRow): FormattedFoodResponse {
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.trim().toLowerCase() || '';
    const category = url.searchParams.get('category')?.trim() || '';
    const dietaryPreference = url.searchParams.get('dietaryPreference')?.trim().toLowerCase() || '';
    const mealType = url.searchParams.get('mealType')?.trim().toLowerCase() || '';

    // Query Supabase foods table
    let foodList: FormattedFoodResponse[] = [];
    try {
      const supabase = await createClient();
      let queryBuilder = supabase
        .from('foods')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (category && category !== 'all') {
        queryBuilder = queryBuilder.eq('category', category);
      }
      if (dietaryPreference && dietaryPreference !== 'all') {
        queryBuilder = queryBuilder.eq('dietary_preference', dietaryPreference);
      }

      const { data, error } = await queryBuilder;
      if (!error && data) {
        foodList = data.map(formatFoodRow);
      }
    } catch {
      // Offline / network fallback
      foodList = [];
    }

    // Ensure all verified seeds from the application catalogue are included
    const existingIds = new Set(foodList.map((f) => f.id));
    for (const s of VERIFIED_FOOD_SEEDS) {
      if (!existingIds.has(s.id) && s.isActive) {
        foodList.push({
          id: s.id,
          name: s.name,
          description: s.description,
          category: s.category,
          foodForm: s.foodForm,
          dietaryPreference: s.dietaryPreference,
          mealTypes: s.mealTypes,
          referenceQuantity: s.referenceQuantity,
          referenceUnit: s.referenceUnit,
          energyKcal: s.energyKcal,
          proteinG: s.proteinG,
          carbohydratesG: s.carbohydratesG,
          fatG: s.fatG,
          fibreG: s.fibreG,
          sourceName: s.sourceName,
          sourceRecordId: s.sourceRecordId,
          sourceReference: s.sourceReference,
          sourceUrl: s.sourceUrl,
          matchStatus: s.matchStatus,
          valueMethod: s.valueMethod,
          isActive: s.isActive,
        });
      }
    }

    // Sort alphabetically by name
    foodList.sort((a, b) => a.name.localeCompare(b.name));

    // Apply filtering
    let filtered = foodList;

    if (query) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          (f.description && f.description.toLowerCase().includes(query)) ||
          f.category.toLowerCase().includes(query)
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((f) => f.category === category);
    }

    if (dietaryPreference && dietaryPreference !== 'all') {
      filtered = filtered.filter((f) => f.dietaryPreference === dietaryPreference);
    }

    if (mealType && mealType !== 'all') {
      filtered = filtered.filter((f) => f.mealTypes.includes(mealType));
    }

    return NextResponse.json({
      data: filtered,
      meta: {
        total: filtered.length,
        sources: ['IFCT_2017', 'USDA_FDC'],
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve food catalogue.' } },
      { status: 500 }
    );
  }
}
