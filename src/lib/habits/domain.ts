/**
 * Domain Logic for Habit Tracker and Streak Calculations (Phase 5)
 * Strictly adheres to docs/05-domain-logic-reviewed.md (Section 7)
 * and docs/08-database.md (Section 9).
 */

export interface HabitInput {
  name: string;
  description?: string | null;
}

export interface ValidatedHabitData {
  name: string;
  description: string | null;
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  isCompletedToday: boolean;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Validates a UUID string.
 */
export function isValidUUID(id: unknown): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/**
 * Validates a habit name.
 * Must be non-empty and between 1 and 100 characters after trimming.
 */
export function validateHabitName(name: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof name !== 'string') {
    return { valid: false, value: '', error: 'Habit name must be a text string.' };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, value: '', error: 'Habit name cannot be empty.' };
  }

  if (trimmed.length > 100) {
    return { valid: false, value: '', error: 'Habit name cannot exceed 100 characters.' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates optional habit description.
 * Trims text, max 500 characters.
 */
export function validateHabitDescription(
  desc: unknown
): { valid: boolean; value: string | null; error?: string } {
  if (desc === null || desc === undefined || desc === '') {
    return { valid: true, value: null };
  }

  if (typeof desc !== 'string') {
    return { valid: false, value: null, error: 'Description must be a text string.' };
  }

  const trimmed = desc.trim();
  if (trimmed.length === 0) {
    return { valid: true, value: null };
  }

  if (trimmed.length > 500) {
    return { valid: false, value: null, error: 'Description cannot exceed 500 characters.' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates calendar date (YYYY-MM-DD).
 */
export function validateHabitDate(dateStr: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof dateStr !== 'string') {
    return { valid: false, value: '', error: 'Date must be a text string.' };
  }

  const trimmed = dateStr.trim();
  if (!ISO_DATE_REGEX.test(trimmed)) {
    return { valid: false, value: '', error: 'Date must follow the format YYYY-MM-DD.' };
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1900 || year > 2100) {
    return { valid: false, value: '', error: 'Date year must be between 1900 and 2100.' };
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { valid: false, value: '', error: 'Date is not a valid calendar day.' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates whether a timezone identifier is a supported IANA timezone.
 */
export function isValidIANATimezone(tz: unknown): boolean {
  if (typeof tz !== 'string' || !tz.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the calendar date string (YYYY-MM-DD) for a given instant in the specified timezone.
 * Defaults to 'Asia/Kolkata'.
 */
export function getLocalCalendarDate(date: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): string {
  const safeTimezone = isValidIANATimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Offsets a YYYY-MM-DD calendar date string by a number of days using UTC calendar arithmetic.
 */
export function addDays(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates current streak according to Section 7.5:
 * 1. If today is completed, use today as endpoint.
 * 2. Otherwise, if yesterday is completed, use yesterday as endpoint (today may still be in progress).
 * 3. Otherwise, current streak is 0.
 * 4. From endpoint, count consecutive dates backwards while present in completedDates.
 * 5. Does not count future dates.
 */
export function calculateCurrentStreak(completedDates: string[], todayStr: string): number {
  if (!completedDates || completedDates.length === 0) return 0;

  // Filter out any invalid dates or accidental future dates
  const dateSet = new Set(
    completedDates.filter((d) => d <= todayStr && ISO_DATE_REGEX.test(d))
  );

  const yesterdayStr = addDays(todayStr, -1);

  let endpoint: string | null = null;
  if (dateSet.has(todayStr)) {
    endpoint = todayStr;
  } else if (dateSet.has(yesterdayStr)) {
    endpoint = yesterdayStr;
  } else {
    return 0;
  }

  let streak = 0;
  let cursor = endpoint;

  while (dateSet.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/**
 * Calculates best (longest) streak across entire history according to Section 7.6:
 * 1. Deduplicate completion dates.
 * 2. Sort chronologically ascending.
 * 3. Compare each date with previous: if exactly 1 calendar day later, extend run.
 * 4. Gaps reset run length to 1.
 * 5. Returns maximum run length.
 */
export function calculateBestStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;

  const validDates = Array.from(new Set(completedDates.filter((d) => ISO_DATE_REGEX.test(d)))).sort();
  if (validDates.length === 0) return 0;

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < validDates.length; i++) {
    const expected = addDays(validDates[i - 1], 1);
    if (validDates[i] === expected) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
  }

  return maxStreak;
}

/**
 * Calculates all streak metrics for a habit.
 */
export function calculateStreaks(completedDates: string[], todayStr: string): StreakResult {
  const currentStreak = calculateCurrentStreak(completedDates, todayStr);
  const bestStreak = calculateBestStreak(completedDates);
  const isCompletedToday = completedDates.includes(todayStr);

  return {
    currentStreak,
    bestStreak,
    isCompletedToday,
  };
}
