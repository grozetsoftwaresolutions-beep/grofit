import test from "node:test";
import assert from "node:assert/strict";
import {
  validateSets,
  validateReps,
  validateName,
  validateSortOrder,
  validateApplyTemplateMode,
  isValidUUID,
  normalizeVideoUrl,
  validateVideoUrl
} from "../../src/lib/workout/domain.ts";

test("validateSets respects domain rules (DP-2 / Section 5.3)", () => {
  // Unset / nullable values must remain null (DP-3)
  assert.deepEqual(validateSets(null), { valid: true, value: null });
  assert.deepEqual(validateSets(undefined), { valid: true, value: null });
  assert.deepEqual(validateSets(""), { valid: true, value: null });

  // Valid integers between 1 and 20
  assert.deepEqual(validateSets(1), { valid: true, value: 1 });
  assert.deepEqual(validateSets(4), { valid: true, value: 4 });
  assert.deepEqual(validateSets(20), { valid: true, value: 20 });
  assert.deepEqual(validateSets(" 3 "), { valid: true, value: 3 });

  // Out of bounds / invalid inputs
  assert.equal(validateSets(0).valid, false);
  assert.equal(validateSets(-1).valid, false);
  assert.equal(validateSets(21).valid, false);
  assert.equal(validateSets(100).valid, false);
  assert.equal(validateSets(3.5).valid, false);
  assert.equal(validateSets("abc").valid, false);
  assert.equal(validateSets(NaN).valid, false);
  assert.equal(validateSets(Infinity).valid, false);
});

test("validateReps respects domain rules (DP-2 / Section 5.3)", () => {
  // Unset / nullable values must remain null (DP-3)
  assert.deepEqual(validateReps(null), { valid: true, value: null });
  assert.deepEqual(validateReps(undefined), { valid: true, value: null });
  assert.deepEqual(validateReps(""), { valid: true, value: null });

  // Valid integers between 1 and 200
  assert.deepEqual(validateReps(1), { valid: true, value: 1 });
  assert.deepEqual(validateReps(12), { valid: true, value: 12 });
  assert.deepEqual(validateReps(200), { valid: true, value: 200 });
  assert.deepEqual(validateReps(" 10 "), { valid: true, value: 10 });

  // Out of bounds / invalid inputs
  assert.equal(validateReps(0).valid, false);
  assert.equal(validateReps(-5).valid, false);
  assert.equal(validateReps(201).valid, false);
  assert.equal(validateReps(12.5).valid, false);
  assert.equal(validateReps("xyz").valid, false);
  assert.equal(validateReps(NaN).valid, false);
  assert.equal(validateReps(Infinity).valid, false);
});

test("validateName validates strings and trims properly", () => {
  assert.deepEqual(validateName("  Push Day  "), { valid: true, value: "Push Day" });
  assert.equal(validateName("").valid, false);
  assert.equal(validateName("    ").valid, false);
  assert.equal(validateName(null).valid, false);
  assert.equal(validateName(123).valid, false);

  const longName = "a".repeat(101);
  assert.equal(validateName(longName).valid, false);
});

test("validateSortOrder validates non-negative integers", () => {
  assert.deepEqual(validateSortOrder(0), { valid: true, value: 0 });
  assert.deepEqual(validateSortOrder(5), { valid: true, value: 5 });
  assert.deepEqual(validateSortOrder(" 2 "), { valid: true, value: 2 });
  assert.equal(validateSortOrder(-1).valid, false);
  assert.equal(validateSortOrder(1.5).valid, false);
  assert.equal(validateSortOrder("abc").valid, false);
});

test("validateApplyTemplateMode accepts only replace and merge", () => {
  assert.deepEqual(validateApplyTemplateMode("replace"), { valid: true, value: "replace" });
  assert.deepEqual(validateApplyTemplateMode("merge"), { valid: true, value: "merge" });
  assert.equal(validateApplyTemplateMode("delete").valid, false);
  assert.equal(validateApplyTemplateMode("").valid, false);
  assert.equal(validateApplyTemplateMode(null).valid, false);
});

test("isValidUUID validates UUID v4 strings", () => {
  assert.equal(isValidUUID("c1000000-0000-4000-a000-000000000001"), true);
  assert.equal(isValidUUID("not-a-uuid"), false);
  assert.equal(isValidUUID(""), false);
  assert.equal(isValidUUID(null), false);
  assert.equal(isValidUUID(12345), false);
});

test("normalizeVideoUrl adds https scheme and trims whitespace", () => {
  assert.equal(normalizeVideoUrl(null), null);
  assert.equal(normalizeVideoUrl(""), null);
  assert.equal(normalizeVideoUrl("   "), null);
  assert.equal(normalizeVideoUrl("https://www.youtube.com/watch?v=123"), "https://www.youtube.com/watch?v=123");
  assert.equal(normalizeVideoUrl("http://www.youtube.com/watch?v=123"), "http://www.youtube.com/watch?v=123");
  assert.equal(normalizeVideoUrl("youtu.be/abc"), "https://youtu.be/abc");
  assert.equal(normalizeVideoUrl("www.youtube.com/watch?v=abc"), "https://www.youtube.com/watch?v=abc");
});

test("validateVideoUrl validates URLs properly and enforces limits", () => {
  assert.deepEqual(validateVideoUrl(null), { valid: true, value: null });
  assert.deepEqual(validateVideoUrl(""), { valid: true, value: null });
  assert.deepEqual(validateVideoUrl("  "), { valid: true, value: null });
  assert.deepEqual(validateVideoUrl("https://youtube.com/shorts/abc"), { valid: true, value: "https://youtube.com/shorts/abc" });
  assert.deepEqual(validateVideoUrl("youtu.be/xyz"), { valid: true, value: "https://youtu.be/xyz" });

  // Excessive length (> 500 chars)
  const tooLong = "https://youtube.com/watch?v=" + "a".repeat(500);
  assert.equal(validateVideoUrl(tooLong).valid, false);

  // Non-string
  assert.equal(validateVideoUrl(12345).valid, false);
});
