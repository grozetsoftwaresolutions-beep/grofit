import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import {
  validateHabitName,
  validateHabitDescription,
  calculateStreaks,
  getLocalCalendarDate,
  DEFAULT_TIMEZONE,
} from '@/lib/habits/domain';

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
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // 1. Fetch user profile for configured timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();

    const userTimezone = profile?.timezone || DEFAULT_TIMEZONE;
    const todayStr = getLocalCalendarDate(new Date(), userTimezone);

    // 2. Fetch habits
    let habitsQuery = supabase
      .from('habits')
      .select('id, name, description, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!includeArchived) {
      habitsQuery = habitsQuery.eq('is_active', true);
    }

    const { data: habits, error: habitsError } = await habitsQuery;
    if (habitsError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve habits.' } },
        { status: 500 }
      );
    }

    // 3. Fetch completion logs for these habits to calculate streaks
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id, completed_on')
      .eq('user_id', user.id);

    if (logsError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve completion history.' } },
        { status: 500 }
      );
    }

    // Group logs by habit_id
    const logsByHabit = new Map<string, string[]>();
    for (const log of logs || []) {
      const existing = logsByHabit.get(log.habit_id) || [];
      existing.push(log.completed_on);
      logsByHabit.set(log.habit_id, existing);
    }

    // 4. Map habits with calculated streaks
    const mapped = (habits || []).map((h) => {
      const habitDates = logsByHabit.get(h.id) || [];
      const { currentStreak, bestStreak, isCompletedToday } = calculateStreaks(habitDates, todayStr);

      return {
        id: h.id,
        name: h.name,
        description: h.description,
        isActive: h.is_active,
        currentStreak,
        bestStreak,
        isCompletedToday,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
      };
    });

    return NextResponse.json({
      data: mapped,
      meta: {
        timezone: userTimezone,
        today: todayStr,
      },
    });
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

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' } },
        { status: 400 }
      );
    }

    const fieldErrors: Record<string, string> = {};

    const nameRes = validateHabitName(body.name);
    if (!nameRes.valid) {
      fieldErrors.name = nameRes.error!;
    }

    const descRes = validateHabitDescription(body.description);
    if (!descRes.valid) {
      fieldErrors.description = descRes.error!;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid habit input.',
            fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: nameRes.value,
        description: descRes.value,
        is_active: true,
      })
      .select('id, name, description, is_active, created_at, updated_at')
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create habit.' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: inserted.id,
          name: inserted.name,
          description: inserted.description,
          isActive: inserted.is_active,
          currentStreak: 0,
          bestStreak: 0,
          isCompletedToday: false,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
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
