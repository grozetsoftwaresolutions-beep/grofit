import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  isValidUUID,
  validateSets,
  validateReps,
  validateSortOrder,
  validateVideoUrl,
  validateName,
} from '@/lib/workout/domain';

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

    const { sets, reps, sortOrder, videoUrl, exerciseName, name } = body as {
      sets?: unknown;
      reps?: unknown;
      sortOrder?: unknown;
      videoUrl?: unknown;
      exerciseName?: unknown;
      name?: unknown;
    };

    const updates: Record<string, unknown> = {};

    const rawName = exerciseName !== undefined ? exerciseName : name;
    if (rawName !== undefined) {
      const nameVal = validateName(rawName, 'Workout name');
      if (!nameVal.valid) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: nameVal.error || 'Invalid workout name.',
              fieldErrors: { exerciseName: nameVal.error || 'Invalid workout name.' },
            },
          },
          { status: 400 }
        );
      }
      updates.exercise_name_snapshot = nameVal.value;

      // Link exercise_id to existing or newly created custom exercise
      const { data: existingEx } = await supabase
        .from('exercises')
        .select('id, name')
        .ilike('name', nameVal.value)
        .limit(1)
        .maybeSingle();

      if (existingEx?.id) {
        updates.exercise_id = existingEx.id;
      } else {
        try {
          const adminClient = getAdminSupabaseClient();
          const { data: createdEx, error: createError } = await adminClient
            .from('exercises')
            .insert({
              name: nameVal.value,
              muscle_group: 'Full Body',
              source_reference: 'Custom Workout',
              is_active: true,
            })
            .select('id')
            .single();

          if (!createError && createdEx?.id) {
            updates.exercise_id = createdEx.id;
          }
        } catch (e) {
          console.error('Failed to auto-create exercise for renamed workout:', e);
        }
      }
    }

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

    if (videoUrl !== undefined) {
      if (videoUrl === null || videoUrl === '') {
        updates.video_url = null;
      } else {
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
        updates.video_url = videoVal.value;
      }
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
      .select('id, exercise_id, exercise_name_snapshot, video_url, sets, reps, sort_order, updated_at')
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
        videoUrl: updatedEntry.video_url,
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
