import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID, validateName, validateSortOrder } from '@/lib/workout/domain';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ planId: string; dayId: string }> }
) {
  try {
    const { planId, dayId } = await props.params;

    if (!isValidUUID(planId) || !isValidUUID(dayId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid plan or day identifier.' } },
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

    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
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
      updates.name = nameValidation.value;
    }

    if (sortOrder !== undefined) {
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
      updates.sort_order = sortValidation.value;
    }

    if (dayNumber !== undefined) {
      updates.day_number =
        typeof dayNumber === 'number' && Number.isInteger(dayNumber) && dayNumber > 0
          ? dayNumber
          : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No valid fields provided for update.' } },
        { status: 400 }
      );
    }

    const { data: updatedDay, error } = await supabase
      .from('workout_plan_days')
      .update(updates)
      .eq('id', dayId)
      .eq('workout_plan_id', planId)
      .eq('user_id', user.id)
      .select('id, name, sort_order, day_number, updated_at')
      .single();

    if (error || !updatedDay) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Plan day not found or not authorized.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: updatedDay.id,
        name: updatedDay.name,
        sortOrder: updatedDay.sort_order,
        dayNumber: updatedDay.day_number,
        updatedAt: updatedDay.updated_at,
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
  props: { params: Promise<{ planId: string; dayId: string }> }
) {
  try {
    const { planId, dayId } = await props.params;

    if (!isValidUUID(planId) || !isValidUUID(dayId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid plan or day identifier.' } },
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

    const { error, count } = await supabase
      .from('workout_plan_days')
      .delete({ count: 'exact' })
      .eq('id', dayId)
      .eq('workout_plan_id', planId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete plan day.' } },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Plan day not found or not authorized.' } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
