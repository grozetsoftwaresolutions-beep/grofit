import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID, validateName, validateSortOrder } from '@/lib/workout/domain';

export async function POST(
  request: Request,
  props: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await props.params;

    if (!isValidUUID(planId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid plan identifier.' } },
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

    // Verify target plan exists and belongs to user
    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Workout plan not found or not authorized.' } },
        { status: 404 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON payload.' } },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Request body must be an object.' } },
        { status: 400 }
      );
    }

    const { name, sortOrder, dayNumber } = body as {
      name?: unknown;
      sortOrder?: unknown;
      dayNumber?: unknown;
    };

    const nameValidation = validateName(name, 'Day name');
    if (!nameValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: nameValidation.error || 'Invalid day name.',
            fieldErrors: { name: nameValidation.error || 'Invalid day name.' },
          },
        },
        { status: 400 }
      );
    }

    // Determine sort order
    let finalSortOrder: number;
    if (sortOrder !== undefined && sortOrder !== null) {
      const sortValidation = validateSortOrder(sortOrder);
      if (!sortValidation.valid) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: sortValidation.error || 'Invalid sort order.',
              fieldErrors: { sortOrder: sortValidation.error || 'Invalid sort order.' },
            },
          },
          { status: 400 }
        );
      }
      finalSortOrder = sortValidation.value;
    } else {
      const { data: maxOrderData } = await supabase
        .from('workout_plan_days')
        .select('sort_order')
        .eq('workout_plan_id', planId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1);

      finalSortOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].sort_order + 1 : 0;
    }

    const finalDayNumber =
      typeof dayNumber === 'number' && Number.isInteger(dayNumber) && dayNumber > 0
        ? dayNumber
        : null;

    const { data: newDay, error: insertError } = await supabase
      .from('workout_plan_days')
      .insert({
        workout_plan_id: planId,
        user_id: user.id,
        name: nameValidation.value,
        sort_order: finalSortOrder,
        day_number: finalDayNumber,
      })
      .select('id, name, sort_order, day_number, created_at, updated_at')
      .single();

    if (insertError || !newDay) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create plan day.' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: newDay.id,
          name: newDay.name,
          sortOrder: newDay.sort_order,
          dayNumber: newDay.day_number,
          createdAt: newDay.created_at,
          updatedAt: newDay.updated_at,
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
