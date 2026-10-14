import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { validateMealPlanName } from '@/lib/nutrition/domain';

interface MealPlanSummaryRow {
  id: string;
  name: string;
  target_kcal: number | null;
  created_at: string;
  updated_at: string;
  meal_plan_items?: { id: string }[];
}

interface CreateMealPlanBody {
  name?: unknown;
  targetKcal?: unknown;
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { data: plans, error } = await supabase
      .from('meal_plans')
      .select('id, name, target_kcal, created_at, updated_at, meal_plan_items(id)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve meal plans.' } },
        { status: 500 }
      );
    }

    const formatted = ((plans || []) as unknown as MealPlanSummaryRow[]).map((p) => ({
      id: p.id,
      name: p.name,
      targetKcal: p.target_kcal !== null ? Number(p.target_kcal) : null,
      itemCount: Array.isArray(p.meal_plan_items) ? p.meal_plan_items.length : 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ data: formatted });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    let body: CreateMealPlanBody;
    try {
      body = (await request.json()) as CreateMealPlanBody;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body.' } },
        { status: 400 }
      );
    }

    const nameRes = validateMealPlanName(typeof body.name === 'string' ? body.name : '');
    if (!nameRes.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', fieldErrors: { name: nameRes.error } } },
        { status: 400 }
      );
    }

    let targetKcal: number | null = null;
    if (body.targetKcal !== undefined && body.targetKcal !== null) {
      const num = Number(body.targetKcal);
      if (isNaN(num) || num < 500 || num > 10000) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { targetKcal: 'Target calories must be between 500 and 10,000 kcal.' } } },
          { status: 400 }
        );
      }
      targetKcal = Math.round(num);
    }

    const { data: created, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        name: nameRes.value,
        target_kcal: targetKcal,
      })
      .select('id, name, target_kcal, created_at, updated_at')
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create meal plan.' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: created.id,
          name: created.name,
          targetKcal: created.target_kcal !== null ? Number(created.target_kcal) : null,
          itemCount: 0,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
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
