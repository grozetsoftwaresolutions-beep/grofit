import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  isValidUUID,
  validateSets,
  validateReps,
  validateSortOrder,
  validateName,
  validateVideoUrl,
} from '@/lib/workout/domain';

export async function POST(
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

    // Verify day exists under plan and belongs to user
    const { data: day, error: dayError } = await supabase
      .from('workout_plan_days')
      .select('id')
      .eq('id', dayId)
      .eq('workout_plan_id', planId)
      .eq('user_id', user.id)
      .single();

    if (dayError || !day) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Plan day not found or not authorized.' } },
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

    const {
      exerciseId,
      customExerciseName,
      customName,
      name,
      muscleGroup,
      videoUrl,
      sets,
      reps,
      sortOrder,
    } = body as {
      exerciseId?: unknown;
      customExerciseName?: unknown;
      customName?: unknown;
      name?: unknown;
      muscleGroup?: unknown;
      videoUrl?: unknown;
      sets?: unknown;
      reps?: unknown;
      sortOrder?: unknown;
    };

    // Determine if user is adding a customized workout
    const rawCustomName = customExerciseName || customName || (!exerciseId && name);
    const isCustom = Boolean(typeof rawCustomName === 'string' && rawCustomName.trim().length > 0);

    let resolvedExerciseId: string | undefined;
    let resolvedExerciseName: string;
    let resolvedMuscleGroup: string | null = null;
    let resolvedVideoUrl: string | null = null;

    // Validate videoUrl if provided
    if (videoUrl !== undefined && videoUrl !== null && videoUrl !== '') {
      const videoVal = validateVideoUrl(videoUrl);
      if (!videoVal.valid) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: videoVal.error || 'Invalid video URL.',
              fieldErrors: { videoUrl: videoVal.error || 'Invalid video URL.' },
            },
          },
          { status: 400 }
        );
      }
      resolvedVideoUrl = videoVal.value;
    }

    if (isCustom) {
      const nameVal = validateName(rawCustomName, 'Workout name');
      if (!nameVal.valid) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: nameVal.error || 'Invalid workout name.',
              fieldErrors: { customExerciseName: nameVal.error || 'Invalid workout name.' },
            },
          },
          { status: 400 }
        );
      }

      resolvedExerciseName = nameVal.value;
      const targetMuscle = typeof muscleGroup === 'string' && muscleGroup.trim().length > 0
        ? muscleGroup.trim()
        : 'Full Body';
      resolvedMuscleGroup = targetMuscle;

      // Check if an exercise already exists with this name (case-insensitive)
      const { data: existingEx } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .ilike('name', nameVal.value)
        .limit(1)
        .maybeSingle();

      if (existingEx?.id) {
        resolvedExerciseId = existingEx.id;
        resolvedMuscleGroup = existingEx.muscle_group || targetMuscle;
      } else {
        // Create custom exercise row in exercises table so foreign keys in entries & progress logs succeed
        try {
          const adminClient = getAdminSupabaseClient();
          const { data: createdEx, error: createError } = await adminClient
            .from('exercises')
            .insert({
              name: nameVal.value,
              muscle_group: targetMuscle,
              source_reference: 'Custom Workout',
              is_active: true,
            })
            .select('id, name, muscle_group')
            .single();

          if (!createError && createdEx) {
            resolvedExerciseId = createdEx.id;
            resolvedMuscleGroup = createdEx.muscle_group;
          }
        } catch {
          // If adminClient is unavailable, fall back to any active exercise as FK anchor
        }

        if (!resolvedExerciseId) {
          const { data: anyEx } = await supabase
            .from('exercises')
            .select('id, muscle_group')
            .eq('is_active', true)
            .limit(1)
            .single();

          if (!anyEx) {
            return NextResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Unable to anchor exercise reference.' } },
              { status: 500 }
            );
          }
          resolvedExerciseId = anyEx.id;
        }
      }
    } else {
      // Standard curated exercise flow
      if (!isValidUUID(exerciseId)) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'A valid exercise ID or custom workout name is required.',
              fieldErrors: { exerciseId: 'A valid exercise ID or custom workout name is required.' },
            },
          },
          { status: 400 }
        );
      }

      // Verify exercise exists
      const { data: exercise, error: exError } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .eq('id', exerciseId)
        .eq('is_active', true)
        .single();

      if (exError || !exercise) {
        return NextResponse.json(
          { error: { code: 'RESOURCE_NOT_FOUND', message: 'Exercise not found or inactive.' } },
          { status: 404 }
        );
      }

      resolvedExerciseId = exercise.id;
      resolvedExerciseName = exercise.name;
      resolvedMuscleGroup = exercise.muscle_group;
    }

    // Validate sets & reps
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
        .from('workout_plan_entries')
        .select('sort_order')
        .eq('workout_plan_day_id', dayId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1);

      finalSortOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].sort_order + 1 : 0;
    }

    const { data: newEntry, error: insertError } = await supabase
      .from('workout_plan_entries')
      .insert({
        user_id: user.id,
        workout_plan_day_id: dayId,
        exercise_id: resolvedExerciseId,
        exercise_name_snapshot: resolvedExerciseName,
        source_label: isCustom ? 'Custom' : null,
        video_url: resolvedVideoUrl,
        sets: setsValidation.value,
        reps: repsValidation.value,
        sort_order: finalSortOrder,
      })
      .select('id, exercise_id, exercise_name_snapshot, source_label, video_url, sets, reps, sort_order, created_at, updated_at')
      .single();

    if (insertError || !newEntry) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create exercise entry.' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: newEntry.id,
          exerciseId: newEntry.exercise_id,
          exerciseName: newEntry.exercise_name_snapshot,
          muscleGroup: resolvedMuscleGroup,
          sourceLabel: newEntry.source_label,
          videoUrl: newEntry.video_url,
          sets: newEntry.sets,
          reps: newEntry.reps,
          sortOrder: newEntry.sort_order,
          createdAt: newEntry.created_at,
          updatedAt: newEntry.updated_at,
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

