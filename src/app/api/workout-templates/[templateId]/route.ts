import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID } from '@/lib/workout/domain';

export async function GET(
  request: Request,
  props: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await props.params;

    if (!isValidUUID(templateId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid template identifier.' } },
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

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('workout_templates')
      .select('id, name, description, source_reference, is_published, sort_order')
      .eq('id', templateId)
      .eq('is_published', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: { code: 'RESOURCE_NOT_FOUND', message: 'Workout template not found.' } },
        { status: 404 }
      );
    }

    // Fetch days
    const { data: days, error: daysError } = await supabase
      .from('template_days')
      .select('id, day_number, name, sort_order')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });

    if (daysError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve template days.' } },
        { status: 500 }
      );
    }

    const dayIds = (days || []).map((d) => d.id);

    // Fetch warmups
    let warmups: Array<{ id: string; template_day_id: string; name: string; description: string | null; sort_order: number }> = [];
    if (dayIds.length > 0) {
      const { data: warmupsData } = await supabase
        .from('warmups')
        .select('id, template_day_id, name, description, sort_order')
        .in('template_day_id', dayIds)
        .order('sort_order', { ascending: true });
      warmups = warmupsData || [];
    }

    // Fetch entries
    let entries: Array<{
      id: string;
      template_day_id: string;
      exercise_id: string;
      sort_order: number;
      sets: number | null;
      reps: number | null;
      source_label: string | null;
      video_url: string | null;
      source_prescription_text: string | null;
      exercises: { name: string; muscle_group: string | null } | null;
    }> = [];

    if (dayIds.length > 0) {
      const { data: entriesData } = await supabase
        .from('template_entries')
        .select(`
          id,
          template_day_id,
          exercise_id,
          sort_order,
          sets,
          reps,
          source_label,
          video_url,
          source_prescription_text,
          exercises (name, muscle_group)
        `)
        .in('template_day_id', dayIds)
        .order('sort_order', { ascending: true });
      entries = (entriesData as unknown as typeof entries) || [];
    }

    // Map into response shape
    const formattedDays = (days || []).map((day) => {
      const dayWarmups = warmups
        .filter((w) => w.template_day_id === day.id)
        .map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          sortOrder: w.sort_order,
        }));

      const dayEntries = entries
        .filter((e) => e.template_day_id === day.id)
        .map((e) => ({
          id: e.id,
          exerciseId: e.exercise_id,
          exerciseName: e.exercises?.name || e.source_label || 'Exercise',
          muscleGroup: e.exercises?.muscle_group || null,
          sets: e.sets,
          reps: e.reps,
          sourceLabel: e.source_label,
          videoUrl: e.video_url,
          sourcePrescriptionText: e.source_prescription_text,
          sortOrder: e.sort_order,
        }));

      return {
        id: day.id,
        dayNumber: day.day_number,
        name: day.name,
        sortOrder: day.sort_order,
        warmups: dayWarmups,
        entries: dayEntries,
      };
    });

    return NextResponse.json({
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        sourceReference: template.source_reference,
        sortOrder: template.sort_order,
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
