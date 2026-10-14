import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID, validateSets, validateReps, validateSortOrder } from '@/lib/workout/domain';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ planId: string; dayId: string; entryId: string }> }
) {
  try {
    const { planId, dayId, entryId } = await props.params;

    if (!isValidUUID(planId) || !isValidUUID(dayId) || !isValidUUID(entryId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid identifier.' } },
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

    const { sets, reps, sortOrder } = body as {
      sets?: unknown;
      reps?: unknown;
      sortOrder?: unknown;
    };

    const updates: Record<string, unknown> = {};

    if (sets !== undefined) {
      const setsValidation = validateSets(sets);
      if (!setsValidation.valid) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: setsValidation.error || 'Invalid sets.',
              fieldErrors: { sets: setsValidation.error || 'Invalid sets.' },
            },
          },
          { status: 400 }
        );
      }
      updates.sets = setsValidation.value;
    }

    if (reps !== undefined) {
      const repsValidation = validateReps(reps);
      if (!repsValidation.valid) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: repsValidation.error || 'Invalid reps.',
              fieldErrors: { reps: repsValidation.error || 'Invalid reps.' },
            },
          },
          { status: 400 }
        );
      }
      updates.reps = repsValidation.value;
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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No valid fields provided for update.' } },
        { status: 400 }
      );
    }

    const { data: updatedEntry, error } = await supabase
      .from('workout_plan_entries')
      .update(updates)
      .eq('id', entryId)
      .eq('workout_plan_day_id', dayId)
      .eq('user_id', user.id)
      .select('id, exercise_id, exercise_name_snapshot, sets, reps, sort_order, updated_at')
      .single();

    if (error || !updatedEntry) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Exercise entry not found or not authorized.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: updatedEntry.id,
        exerciseId: updatedEntry.exercise_id,
        exerciseName: updatedEntry.exercise_name_snapshot,
        sets: updatedEntry.sets,
        reps: updatedEntry.reps,
        sortOrder: updatedEntry.sort_order,
        updatedAt: updatedEntry.updated_at,
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
  props: { params: Promise<{ planId: string; dayId: string; entryId: string }> }
) {
  try {
    const { planId, dayId, entryId } = await props.params;

    if (!isValidUUID(planId) || !isValidUUID(dayId) || !isValidUUID(entryId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid identifier.' } },
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
      .from('workout_plan_entries')
      .delete({ count: 'exact' })
      .eq('id', entryId)
      .eq('workout_plan_day_id', dayId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete exercise entry.' } },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Exercise entry not found or not authorized.' } },
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
