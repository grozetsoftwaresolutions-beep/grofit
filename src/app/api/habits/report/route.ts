import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import {
  calculateStreaks,
  getLocalCalendarDate,
  addDays,
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
    const rangeParam = (searchParams.get('range') || '1m').toLowerCase().trim();

    // 1. Fetch user profile for configured timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone, display_name')
      .eq('id', user.id)
      .maybeSingle();

    const userTimezone = profile?.timezone || DEFAULT_TIMEZONE;
    const clientName = profile?.display_name || user.email?.split('@')[0] || 'Client';
    const todayStr = getLocalCalendarDate(new Date(), userTimezone);

    // 2. Determine timeframe boundaries
    let daysOffset = 30;
    let periodKey = '1m';
    let periodLabel = 'Last Month (30 Days)';

    if (rangeParam === '3m' || rangeParam === '3month' || rangeParam === '3_months') {
      daysOffset = 90;
      periodKey = '3m';
      periodLabel = 'Last 3 Months (90 Days)';
    } else if (rangeParam === '6m' || rangeParam === '6month' || rangeParam === '6_months') {
      daysOffset = 180;
      periodKey = '6m';
      periodLabel = 'Last 6 Months (180 Days)';
    } else if (rangeParam === '1y' || rangeParam === '1yr' || rangeParam === '1year' || rangeParam === '1_year') {
      daysOffset = 365;
      periodKey = '1y';
      periodLabel = 'Last 1 Year (365 Days)';
    } else {
      daysOffset = 30;
      periodKey = '1m';
      periodLabel = 'Last Month (30 Days)';
    }

    const toDate = todayStr;
    const fromDate = addDays(todayStr, -daysOffset + 1);

    // 3. Fetch all habits for the user
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, description, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (habitsError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve habits.' } },
        { status: 500 }
      );
    }

    // 4. Fetch all completion logs for streak and period calculations
    const { data: allLogs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id, completed_on')
      .eq('user_id', user.id);

    if (logsError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve habit logs.' } },
        { status: 500 }
      );
    }

    // Map logs by habit ID
    const logsByHabit = new Map<string, string[]>();
    for (const log of allLogs || []) {
      const dates = logsByHabit.get(log.habit_id) || [];
      dates.push(log.completed_on);
      logsByHabit.set(log.habit_id, dates);
    }

    // Helper to format month YYYY-MM into label e.g. "Sep 2026"
    const formatMonthLabel = (ym: string) => {
      const [yearStr, monthStr] = ym.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(monthStr, 10) - 1;
      return `${monthNames[monthIndex] || ym} ${yearStr}`;
    };

    // 5. Build per-habit report metrics
    let totalCompletionsInPeriod = 0;
    const activeHabitRates: number[] = [];

    const habitReports = (habits || []).map((h) => {
      const allDates = logsByHabit.get(h.id) || [];
      const { currentStreak, bestStreak } = calculateStreaks(allDates, todayStr);

      // Filter completions inside [fromDate, toDate]
      const periodDates = allDates.filter((d) => d >= fromDate && d <= toDate);
      const completedDays = periodDates.length;
      totalCompletionsInPeriod += completedDays;

      const completionRate = daysOffset > 0 ? Math.round((completedDays / daysOffset) * 1000) / 10 : 0;

      if (h.is_active) {
        activeHabitRates.push(completionRate);
      }

      // Group by month
      const monthCountMap = new Map<string, number>();
      for (const d of periodDates) {
        const ym = d.substring(0, 7);
        monthCountMap.set(ym, (monthCountMap.get(ym) || 0) + 1);
      }

      const monthlyBreakdown = Array.from(monthCountMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, count]) => ({
          month,
          label: formatMonthLabel(month),
          completed: count,
        }));

      return {
        id: h.id,
        name: h.name,
        description: h.description,
        isActive: h.is_active,
        totalDays: daysOffset,
        completedDays,
        completionRate,
        currentStreak,
        bestStreak,
        monthlyBreakdown,
        completedDates: periodDates,
      };
    });

    // 6. Overall summary
    const activeHabitReports = habitReports.filter((h) => h.isActive);
    const avgConsistency =
      activeHabitRates.length > 0
        ? Math.round(
            (activeHabitRates.reduce((acc, r) => acc + r, 0) / activeHabitRates.length) * 10
          ) / 10
        : 0;

    // Top habit
    const topHabit =
      activeHabitReports.length > 0
        ? [...activeHabitReports].sort((a, b) => b.completionRate - a.completionRate)[0]
        : null;

    // Needs attention habit
    const needsAttentionHabit =
      activeHabitReports.length > 0
        ? [...activeHabitReports].sort((a, b) => a.completionRate - b.completionRate)[0]
        : null;

    return NextResponse.json({
      data: {
        clientName,
        period: periodLabel,
        rangeKey: periodKey,
        from: fromDate,
        to: toDate,
        totalDays: daysOffset,
        summary: {
          totalHabits: habitReports.length,
          activeHabits: activeHabitReports.length,
          totalCompletions: totalCompletionsInPeriod,
          averageConsistency: avgConsistency,
          topHabit: topHabit
            ? {
                id: topHabit.id,
                name: topHabit.name,
                completionRate: topHabit.completionRate,
                completedDays: topHabit.completedDays,
              }
            : null,
          needsAttentionHabit: needsAttentionHabit
            ? {
                id: needsAttentionHabit.id,
                name: needsAttentionHabit.name,
                completionRate: needsAttentionHabit.completionRate,
                completedDays: needsAttentionHabit.completedDays,
              }
            : null,
        },
        habits: habitReports,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while generating habit report.' } },
      { status: 500 }
    );
  }
}
