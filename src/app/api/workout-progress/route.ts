import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import {
  validateWorkoutLogInput,
  validateWorkoutDate,
  isValidUUID,
} from '@/lib/workout-progress/domain';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
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
        created_at,
        updated_at,
        exercises:exercise_id (id, name, muscle_group)
      `)
      .eq('user_id', user.id);

    if (exerciseId) {
      if (!isValidUUID(exerciseId)) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: 'exerciseId must be a valid UUID.' } },
          { status: 400 }
        );
      }
      query = query.eq('exercise_id', exerciseId);
    }

    if (from) {
      const fromValidation = validateWorkoutDate(from);
      if (!fromValidation.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: fromValidation.error } },
          { status: 400 }
        );
      }
      query = query.gte('logged_on', fromValidation.value);
    }

    if (to) {
      const toValidation = validateWorkoutDate(to);
      if (!toValidation.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: toValidation.error } },
          { status: 400 }
        );
      }
      query = query.lte('logged_on', toValidation.value);
    }

    // Order chronologically by workout date, then creation time
    query = query.order('logged_on', { ascending: true }).order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve workout progress history.' } },
        { status: 500 }
      );
    }

    const mapped = (data || []).map((row) => {
      const ex = row.exercises as { name?: string; muscle_group?: string | null } | null;
      return {
        id: row.id,
        exerciseId: row.exercise_id,
        exerciseName: ex?.name || 'Unknown Exercise',
        muscleGroup: ex?.muscle_group || null,
        loggedOn: row.logged_on,
        setsCompleted: row.sets_completed,
        repsCompleted: row.reps_completed,
        externalLoad: row.external_load !== null ? Number(row.external_load) : null,
        externalLoadUnit: row.external_load_unit,
        isBodyweight: Boolean(row.is_bodyweight),
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ data: mapped });
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' } },
        { status: 400 }
      );
    }

    const validation = validateWorkoutLogInput(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const logData = validation.data;

    // Verify that the canonical exercise exists
    const { data: exercise, error: exError } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .eq('id', logData.exerciseId)
      .maybeSingle();

    if (exError || !exercise) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Referenced exercise not found in catalogue.' } },
        { status: 404 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        exercise_id: logData.exerciseId,
        logged_on: logData.loggedOn,
        sets_completed: logData.setsCompleted,
        reps_completed: logData.repsCompleted,
        external_load: logData.externalLoad,
        external_load_unit: logData.externalLoadUnit,
        is_bodyweight: logData.isBodyweight,
        notes: logData.notes,
      })
      .select('id, exercise_id, logged_on, sets_completed, reps_completed, external_load, external_load_unit, is_bodyweight, notes, created_at, updated_at')
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to record workout progress.' } },
        { status: 500 }
      );
    }

    const responseData = {
      id: inserted.id,
      exerciseId: inserted.exercise_id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscle_group,
      loggedOn: inserted.logged_on,
      setsCompleted: inserted.sets_completed,
      repsCompleted: inserted.reps_completed,
      externalLoad: inserted.external_load !== null ? Number(inserted.external_load) : null,
      externalLoadUnit: inserted.external_load_unit,
      isBodyweight: Boolean(inserted.is_bodyweight),
      notes: inserted.notes,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    };

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
