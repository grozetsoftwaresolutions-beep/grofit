import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID, validateName } from '@/lib/workout/domain';

export async function GET(
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

    // Verify ownership and get plan
    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .select('id, name, source_template_id, source_template_name_snapshot, created_at, updated_at')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Workout plan not found.' } },
        { status: 404 }
      );
    }

    // Get days for this plan
    const { data: days, error: daysError } = await supabase
      .from('workout_plan_days')
      .select('id, day_number, name, sort_order, source_template_day_id')
      .eq('workout_plan_id', planId)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (daysError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve plan days.' } },
        { status: 500 }
      );
    }

    const dayIds = (days || []).map((d) => d.id);

    // Get entries for these days
    let entries: Array<{
      id: string;
      workout_plan_day_id: string;
      exercise_id: string;
      exercise_name_snapshot: string;
      source_template_entry_id: string | null;
      source_label: string | null;
      video_url: string | null;
      source_sets: number | null;
      source_reps: number | null;
      source_prescription_text: string | null;
      sets: number | null;
      reps: number | null;
      sort_order: number;
      exercises: { muscle_group: string | null } | null;
    }> = [];

    if (dayIds.length > 0) {
      const { data: entriesData, error: entriesError } = await supabase
        .from('workout_plan_entries')
        .select(`
          id,
          workout_plan_day_id,
          exercise_id,
          exercise_name_snapshot,
          source_template_entry_id,
          source_label,
          video_url,
          source_sets,
          source_reps,
          source_prescription_text,
          sets,
          reps,
          sort_order,
          exercises (muscle_group)
        `)
        .in('workout_plan_day_id', dayIds)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (entriesError) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve plan entries.' } },
          { status: 500 }
        );
      }
      entries = (entriesData as unknown as typeof entries) || [];
    }

    // Map response structure
    const formattedDays = (days || []).map((day) => {
      const dayEntries = entries
        .filter((e) => e.workout_plan_day_id === day.id)
        .map((e) => ({
          id: e.id,
          exerciseId: e.exercise_id,
          exerciseName: e.exercise_name_snapshot,
          muscleGroup: e.exercises?.muscle_group || null,
          sourceTemplateEntryId: e.source_template_entry_id,
          sourceLabel: e.source_label,
          videoUrl: e.video_url,
          sourceSets: e.source_sets,
          sourceReps: e.source_reps,
          sourcePrescriptionText: e.source_prescription_text,
          sets: e.sets,
          reps: e.reps,
          sortOrder: e.sort_order,
        }));

      return {
        id: day.id,
        dayNumber: day.day_number,
        name: day.name,
        sortOrder: day.sort_order,
        sourceTemplateDayId: day.source_template_day_id,
        entries: dayEntries,
      };
    });

    return NextResponse.json({
      data: {
        id: plan.id,
        name: plan.name,
        sourceTemplateId: plan.source_template_id,
        sourceTemplateNameSnapshot: plan.source_template_name_snapshot,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
        days: formattedDays,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { name } = body as { name?: unknown };
    const nameValidation = validateName(name, 'Plan name');
    if (!nameValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: nameValidation.error || 'Invalid plan name.',
            fieldErrors: { name: nameValidation.error || 'Invalid plan name.' },
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .update({ name: nameValidation.value })
      .eq('id', planId)
      .eq('user_id', user.id)
      .select('id, name, source_template_id, source_template_name_snapshot, created_at, updated_at')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Workout plan not found or not authorized.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        sourceTemplateId: data.source_template_id,
        sourceTemplateNameSnapshot: data.source_template_name_snapshot,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
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

    const { error, count } = await supabase
      .from('workout_plans')
      .delete({ count: 'exact' })
      .eq('id', planId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete workout plan.' } },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Workout plan not found or not authorized.' } },
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
