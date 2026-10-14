import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import {
  isValidUUID,
  validateWorkoutDate,
  validateCompletedSets,
  validateCompletedReps,
  validateLoadAndBodyweight,
  validateNotes,
} from '@/lib/workout-progress/domain';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await props.params;

    if (!isValidUUID(logId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'logId must be a valid UUID.' } },
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

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' } },
        { status: 400 }
      );
    }

    // Check if the log exists and belongs to the authenticated user
    const { data: existing, error: fetchError } = await supabase
      .from('workout_logs')
      .select(`
        id,
        exercise_id,
        logged_on,
        sets_completed,
        reps_completed,
        external_load,
        external_load_unit,
        is_bodyweight,
        notes,
        exercises:exercise_id (id, name, muscle_group)
      `)
      .eq('id', logId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Workout log not found or access denied.' } },
        { status: 404 }
      );
    }

    const fieldErrors: Record<string, string> = {};

    // Validate date if updated
    let targetLoggedOn = existing.logged_on;
    if (body.loggedOn !== undefined) {
      const dateRes = validateWorkoutDate(body.loggedOn);
      if (!dateRes.valid) {
        fieldErrors.loggedOn = dateRes.error!;
      } else {
        targetLoggedOn = dateRes.value;
      }
    }

    // Validate sets if updated
    let targetSets = existing.sets_completed;
    if (body.setsCompleted !== undefined) {
      const setsRes = validateCompletedSets(body.setsCompleted);
      if (!setsRes.valid) {
        fieldErrors.setsCompleted = setsRes.error!;
      } else {
        targetSets = setsRes.value;
      }
    }

    // Validate reps if updated
    let targetReps = existing.reps_completed;
    if (body.repsCompleted !== undefined) {
      const repsRes = validateCompletedReps(body.repsCompleted);
      if (!repsRes.valid) {
        fieldErrors.repsCompleted = repsRes.error!;
      } else {
        targetReps = repsRes.value;
      }
    }

    // Validate load & bodyweight
    const targetIsBodyweight =
      body.isBodyweight !== undefined ? Boolean(body.isBodyweight) : existing.is_bodyweight;
    const targetLoad =
      body.externalLoad !== undefined ? body.externalLoad : existing.external_load;
    const targetUnit =
      body.externalLoadUnit !== undefined ? body.externalLoadUnit : existing.external_load_unit;

    const loadRes = validateLoadAndBodyweight({
      externalLoad: targetLoad,
      externalLoadUnit: targetUnit,
      isBodyweight: targetIsBodyweight,
    });
    if (!loadRes.valid) {
      if (loadRes.fieldErrors) {
        Object.assign(fieldErrors, loadRes.fieldErrors);
      } else {
        fieldErrors.externalLoad = loadRes.error!;
      }
    }

    // Validate notes if updated
    let targetNotes = existing.notes;
    if (body.notes !== undefined) {
      const notesRes = validateNotes(body.notes);
      if (!notesRes.valid) {
        fieldErrors.notes = notesRes.error!;
      } else {
        targetNotes = notesRes.value;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid workout log updates.',
            fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('workout_logs')
      .update({
        logged_on: targetLoggedOn,
        sets_completed: targetSets,
        reps_completed: targetReps,
        external_load: loadRes.value.externalLoad,
        external_load_unit: loadRes.value.externalLoadUnit,
        is_bodyweight: loadRes.value.isBodyweight,
        notes: targetNotes,
      })
      .eq('id', logId)
      .eq('user_id', user.id)
      .select('id, exercise_id, logged_on, sets_completed, reps_completed, external_load, external_load_unit, is_bodyweight, notes, created_at, updated_at')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update workout log.' } },
        { status: 500 }
      );
    }

    const ex = existing.exercises as { name?: string; muscle_group?: string | null } | null;
    return NextResponse.json({
      data: {
        id: updated.id,
        exerciseId: updated.exercise_id,
        exerciseName: ex?.name || 'Unknown Exercise',
        muscleGroup: ex?.muscle_group || null,
        loggedOn: updated.logged_on,
        setsCompleted: updated.sets_completed,
        repsCompleted: updated.reps_completed,
        externalLoad: updated.external_load !== null ? Number(updated.external_load) : null,
        externalLoadUnit: updated.external_load_unit,
        isBodyweight: Boolean(updated.is_bodyweight),
        notes: updated.notes,
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
  props: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await props.params;

    if (!isValidUUID(logId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'logId must be a valid UUID.' } },
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
      .from('workout_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete workout log.' } },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Workout log not found or access denied.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Workout log deleted successfully.' });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
