import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID, validateHabitDate } from '@/lib/habits/domain';

export async function PUT(
  request: Request,
  props: { params: Promise<{ habitId: string; date: string }> }
) {
  try {
    const { habitId, date } = await props.params;

    if (!isValidUUID(habitId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'habitId must be a valid UUID.' } },
        { status: 400 }
      );
    }

    const dateRes = validateHabitDate(date);
    if (!dateRes.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: dateRes.error } },
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

    // 1. Verify habit ownership and active status
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

    if (!habit.is_active) {
      return NextResponse.json(
        { error: { code: 'UNPROCESSABLE_ENTITY', message: 'Cannot record completion for an archived habit.' } },
        { status: 422 }
      );
    }

    // 2. Insert or ignore completion record idempotently
    const { data: inserted, error: insertError } = await supabase
      .from('habit_logs')
      .upsert(
        {
          user_id: user.id,
          habit_id: habitId,
          completed_on: dateRes.value,
        },
        { onConflict: 'habit_id,completed_on' }
      )
      .select('id, habit_id, completed_on, created_at')
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to record habit completion.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: inserted.id,
        habitId: inserted.habit_id,
        completedOn: inserted.completed_on,
        completed: true,
        createdAt: inserted.created_at,
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
  props: { params: Promise<{ habitId: string; date: string }> }
) {
  try {
    const { habitId, date } = await props.params;

    if (!isValidUUID(habitId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'habitId must be a valid UUID.' } },
        { status: 400 }
      );
    }

    const dateRes = validateHabitDate(date);
    if (!dateRes.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: dateRes.error } },
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
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (habitError || !habit) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Habit not found or access denied.' } },
        { status: 404 }
      );
    }

    // Delete the completion log for this date
    const { error: deleteError } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_on', dateRes.value)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[DELETE habit log deleteError]:', deleteError);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to unmark habit completion.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Habit completion unmarked successfully.',
      data: {
        habitId,
        completedOn: dateRes.value,
        completed: false,
      },
    });
  } catch (err) {
    console.error('[DELETE habit log exception]:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
