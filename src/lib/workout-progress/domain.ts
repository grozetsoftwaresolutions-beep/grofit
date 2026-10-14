/**
 * Domain Logic for Workout Progress Tracking (Phase 4)
 * Strictly adheres to docs/05-domain-logic-reviewed.md (Section 3 & Section 6)
 * and docs/08-database.md (Section 8).
 */

export type LoadUnit = 'kg' | 'lbs';

export interface WorkoutLogInput {
  exerciseId: string;
  loggedOn: string;
  setsCompleted?: number | null;
  repsCompleted?: number | null;
  externalLoad?: number | null;
  externalLoadUnit?: LoadUnit | null;
  isBodyweight?: boolean;
  notes?: string | null;
}

export interface ValidatedWorkoutLogData {
  exerciseId: string;
  loggedOn: string;
  setsCompleted: number | null;
  repsCompleted: number | null;
  externalLoad: number | null;
  externalLoadUnit: LoadUnit | null;
  isBodyweight: boolean;
  notes: string | null;
}

export interface ValidationOutcome<T> {
  valid: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Canonical conversion constants from Section 3.3
export const LBS_TO_KG_MULTIPLIER = 0.45359237;

/**
 * Validates a UUID string.
 */
export function isValidUUID(id: unknown): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/**
 * Validates a calendar workout date (YYYY-MM-DD).
 * Rejects invalid calendar dates (e.g. 2026-02-31, 2026-13-45) and non-string inputs.
 */
export function validateWorkoutDate(dateStr: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof dateStr !== 'string') {
    return { valid: false, value: '', error: 'Workout date must be a valid text string.' };
  }

  const trimmed = dateStr.trim();
  if (!ISO_DATE_REGEX.test(trimmed)) {
    return { valid: false, value: '', error: 'Workout date must follow the format YYYY-MM-DD.' };
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1900 || year > 2100) {
    return { valid: false, value: '', error: 'Workout date year must be between 1900 and 2100.' };
  }

  // Verify calendar validity by constructing date in UTC
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { valid: false, value: '', error: 'Workout date is not a valid calendar day.' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates completed sets count.
 * Nullable. If provided, must be a whole number from 1 through 20.
 */
export function validateCompletedSets(sets: unknown): { valid: boolean; value: number | null; error?: string } {
  if (sets === null || sets === undefined || sets === '') {
    return { valid: true, value: null };
  }

  const num = typeof sets === 'string' ? Number(sets.trim()) : Number(sets);
  if (!Number.isInteger(num)) {
    return { valid: false, value: null, error: 'Completed sets must be an integer between 1 and 20.' };
  }

  if (num < 1 || num > 20) {
    return { valid: false, value: null, error: 'Completed sets must be between 1 and 20.' };
  }

  return { valid: true, value: num };
}

/**
 * Validates completed repetitions count.
 * Nullable. If provided, must be a whole number from 1 through 200.
 */
export function validateCompletedReps(reps: unknown): { valid: boolean; value: number | null; error?: string } {
  if (reps === null || reps === undefined || reps === '') {
    return { valid: true, value: null };
  }

  const num = typeof reps === 'string' ? Number(reps.trim()) : Number(reps);
  if (!Number.isInteger(num)) {
    return { valid: false, value: null, error: 'Completed repetitions must be an integer between 1 and 200.' };
  }

  if (num < 1 || num > 200) {
    return { valid: false, value: null, error: 'Completed repetitions must be between 1 and 200.' };
  }

  return { valid: true, value: num };
}

/**
 * Validates external load, unit, and bodyweight classification combination.
 * Follows exact domain rules in Section 6.2 and database check constraints in Section 8.3:
 *
 * Case 1: Bodyweight
 * - is_bodyweight = true
 * - external_load = null
 * - external_load_unit = null
 *
 * Case 2: External Load
 * - is_bodyweight = false
 * - external_load > 0 (finite, positive, non-zero)
 * - external_load_unit in ('kg', 'lbs')
 *
 * Case 3: No External Load
 * - is_bodyweight = false
 * - external_load = null
 * - external_load_unit = null
 */
export function validateLoadAndBodyweight(input: {
  externalLoad: unknown;
  externalLoadUnit: unknown;
  isBodyweight: unknown;
}): {
  valid: boolean;
  value: {
    externalLoad: number | null;
    externalLoadUnit: LoadUnit | null;
    isBodyweight: boolean;
  };
  error?: string;
  fieldErrors?: Record<string, string>;
} {
  const isBodyweight = Boolean(input.isBodyweight);
  const rawLoad = input.externalLoad;
  const rawUnit = input.externalLoadUnit;

  const hasLoad = rawLoad !== null && rawLoad !== undefined && rawLoad !== '';
  const hasUnit = rawUnit !== null && rawUnit !== undefined && rawUnit !== '';

  if (isBodyweight) {
    if (hasLoad) {
      return {
        valid: false,
        value: { externalLoad: null, externalLoadUnit: null, isBodyweight: true },
        error: 'Bodyweight entries must not have an external load.',
        fieldErrors: { externalLoad: 'Bodyweight exercises cannot have an external load recorded.' },
      };
    }
    if (hasUnit) {
      return {
        valid: false,
        value: { externalLoad: null, externalLoadUnit: null, isBodyweight: true },
        error: 'Bodyweight entries must not specify a load unit.',
        fieldErrors: { externalLoadUnit: 'Load unit cannot be specified for bodyweight exercises.' },
      };
    }

    return {
      valid: true,
      value: { externalLoad: null, externalLoadUnit: null, isBodyweight: true },
    };
  }

  if (hasLoad) {
    const num = typeof rawLoad === 'string' ? Number(rawLoad.trim()) : Number(rawLoad);
    if (!Number.isFinite(num) || num <= 0) {
      return {
        valid: false,
        value: { externalLoad: null, externalLoadUnit: null, isBodyweight: false },
        error: 'External load must be a finite number greater than zero.',
        fieldErrors: { externalLoad: 'External load must be greater than zero.' },
      };
    }

    if (!hasUnit || (rawUnit !== 'kg' && rawUnit !== 'lbs')) {
      return {
        valid: false,
        value: { externalLoad: null, externalLoadUnit: null, isBodyweight: false },
        error: 'External load requires a supported unit ("kg" or "lbs").',
        fieldErrors: { externalLoadUnit: 'Unit must be either "kg" or "lbs".' },
      };
    }

    return {
      valid: true,
      value: {
        externalLoad: Math.round(num * 100) / 100,
        externalLoadUnit: rawUnit as LoadUnit,
        isBodyweight: false,
      },
    };
  }

  // No external load and not bodyweight
  if (hasUnit) {
    return {
      valid: false,
      value: { externalLoad: null, externalLoadUnit: null, isBodyweight: false },
      error: 'A load unit cannot be provided without an external load.',
      fieldErrors: { externalLoadUnit: 'Cannot specify unit without an external load value.' },
    };
  }

  return {
    valid: true,
    value: { externalLoad: null, externalLoadUnit: null, isBodyweight: false },
  };
}

/**
 * Validates optional notes text.
 * Max 500 characters, trimmed. Plain text only.
 */
export function validateNotes(notes: unknown): { valid: boolean; value: string | null; error?: string } {
  if (notes === null || notes === undefined || notes === '') {
    return { valid: true, value: null };
  }

  if (typeof notes !== 'string') {
    return { valid: false, value: null, error: 'Notes must be text.' };
  }

  const trimmed = notes.trim();
  if (trimmed.length === 0) {
    return { valid: true, value: null };
  }

  if (trimmed.length > 500) {
    return { valid: false, value: null, error: 'Notes cannot exceed 500 characters.' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Converts external load between kg and lbs using canonical constants.
 */
export function convertWeight(value: number, from: LoadUnit, to: LoadUnit): number {
  if (from === to) return value;
  if (from === 'lbs' && to === 'kg') {
    return value * LBS_TO_KG_MULTIPLIER;
  }
  if (from === 'kg' && to === 'lbs') {
    return value / LBS_TO_KG_MULTIPLIER;
  }
  return value;
}

/**
 * Validates a complete workout log creation or update payload.
 */
export function validateWorkoutLogInput(input: unknown): ValidationOutcome<ValidatedWorkoutLogData> {
  if (!input || typeof input !== 'object') {
    return {
      valid: false,
      error: { code: 'INVALID_INPUT', message: 'Request body must be a valid JSON object.' },
    };
  }

  const obj = input as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  // Exercise ID
  if (!obj.exerciseId || !isValidUUID(obj.exerciseId)) {
    fieldErrors.exerciseId = 'A valid canonical exercise ID is required.';
  }

  // Logged On
  const dateResult = validateWorkoutDate(obj.loggedOn);
  if (!dateResult.valid) {
    fieldErrors.loggedOn = dateResult.error!;
  }

  // Sets Completed
  const setsResult = validateCompletedSets(obj.setsCompleted);
  if (!setsResult.valid) {
    fieldErrors.setsCompleted = setsResult.error!;
  }

  // Reps Completed
  const repsResult = validateCompletedReps(obj.repsCompleted);
  if (!repsResult.valid) {
    fieldErrors.repsCompleted = repsResult.error!;
  }

  // Load and Bodyweight
  const loadResult = validateLoadAndBodyweight({
    externalLoad: obj.externalLoad,
    externalLoadUnit: obj.externalLoadUnit,
    isBodyweight: obj.isBodyweight,
  });
  if (!loadResult.valid) {
    if (loadResult.fieldErrors) {
      Object.assign(fieldErrors, loadResult.fieldErrors);
    } else {
      fieldErrors.externalLoad = loadResult.error!;
    }
  }

  // Notes
  const notesResult = validateNotes(obj.notes);
  if (!notesResult.valid) {
    fieldErrors.notes = notesResult.error!;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid workout log data.',
        fieldErrors,
      },
    };
  }

  return {
    valid: true,
    data: {
      exerciseId: obj.exerciseId as string,
      loggedOn: dateResult.value,
      setsCompleted: setsResult.value,
      repsCompleted: repsResult.value,
      externalLoad: loadResult.value.externalLoad,
      externalLoadUnit: loadResult.value.externalLoadUnit,
      isBodyweight: loadResult.value.isBodyweight,
      notes: notesResult.value,
    },
  };
}
