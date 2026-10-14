/**
 * Domain Logic for Workout Content and Personal Workout Plans
 * Adheres strictly to docs/05-domain-logic-reviewed.md and docs/08-database.md
 */

export interface ExerciseEntryInput {
  sets: number | null;
  reps: number | null;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

/**
 * Validates user-configurable sets according to DP-2 / Section 5.3:
 * Sets must be a whole number from 1 through 20.
 * May be null if unspecified in source or unset by user.
 */
export function validateSets(sets: unknown): { valid: boolean; value: number | null; error?: string } {
  if (sets === null || sets === undefined || sets === "") {
    return { valid: true, value: null };
  }

  const num = typeof sets === "string" ? Number(sets.trim()) : Number(sets);
  if (!Number.isInteger(num)) {
    return { valid: false, value: null, error: "Sets must be an integer between 1 and 20." };
  }

  if (num < 1 || num > 20) {
    return { valid: false, value: null, error: "Sets must be between 1 and 20." };
  }

  return { valid: true, value: num };
}

/**
 * Validates user-configurable repetitions according to DP-2 / Section 5.3:
 * Repetitions must be a whole number from 1 through 200.
 * May be null if unspecified in source or unset by user.
 */
export function validateReps(reps: unknown): { valid: boolean; value: number | null; error?: string } {
  if (reps === null || reps === undefined || reps === "") {
    return { valid: true, value: null };
  }

  const num = typeof reps === "string" ? Number(reps.trim()) : Number(reps);
  if (!Number.isInteger(num)) {
    return { valid: false, value: null, error: "Repetitions must be an integer between 1 and 200." };
  }

  if (num < 1 || num > 200) {
    return { valid: false, value: null, error: "Repetitions must be between 1 and 200." };
  }

  return { valid: true, value: num };
}

/**
 * Validates a plan or day name.
 * Must be non-empty and trimmed of leading/trailing whitespace.
 */
export function validateName(name: unknown, fieldName = "Name"): { valid: boolean; value: string; error?: string } {
  if (typeof name !== "string") {
    return { valid: false, value: "", error: `${fieldName} must be a valid text string.` };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, value: "", error: `${fieldName} cannot be empty.` };
  }

  if (trimmed.length > 100) {
    return { valid: false, value: "", error: `${fieldName} cannot exceed 100 characters.` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates sort order (must be non-negative integer).
 */
export function validateSortOrder(order: unknown): { valid: boolean; value: number; error?: string } {
  const num = typeof order === "string" ? Number(order.trim()) : Number(order);
  if (!Number.isInteger(num) || num < 0) {
    return { valid: false, value: 0, error: "Sort order must be a non-negative integer." };
  }
  return { valid: true, value: num };
}

/**
 * Validates apply-template mode: 'replace' | 'merge'.
 */
export function validateApplyTemplateMode(mode: unknown): { valid: boolean; value: "replace" | "merge"; error?: string } {
  if (mode !== "replace" && mode !== "merge") {
    return { valid: false, value: "replace", error: "Mode must be either 'replace' or 'merge'." };
  }
  return { valid: true, value: mode };
}

/**
 * Validates standard UUID format (32 hex digits separated by hyphens).
 */
export function isValidUUID(id: unknown): boolean {
  if (typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
