import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID, validateHabitDate } from '@/lib/habits/domain';

export async function GET(
  request: Request,
  props: { params: Promise<{ habitId: string }> }
) {
  try {
    const { habitId } = await props.params;

    if (!isValidUUID(habitId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'habitId must be a valid UUID.' } },
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

    // Verify habit ownership
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, name, is_active')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (habitError || !habit) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Habit not found or access denied.' } },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('habit_logs')
      .select('id, habit_id, completed_on, created_at')
      .eq('habit_id', habitId)
      .eq('user_id', user.id);

    if (from) {
      const fromRes = validateHabitDate(from);
      if (!fromRes.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: fromRes.error } },
          { status: 400 }
        );
      }
      query = query.gte('completed_on', fromRes.value);
    }

    if (to) {
      const toRes = validateHabitDate(to);
      if (!toRes.valid) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', message: toRes.error } },
          { status: 400 }
        );
      }
      query = query.lte('completed_on', toRes.value);
    }

    query = query.order('completed_on', { ascending: false });

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve habit completion logs.' } },
        { status: 500 }
      );
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      habitId: row.habit_id,
      completedOn: row.completed_on,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      data: mapped,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
