import test from "node:test";
import assert from "node:assert/strict";
import {
  SOURCED_6DAY_TEMPLATE,
  CANONICAL_EXERCISES
} from "../../src/lib/workout/seed-data.ts";

test("Source fidelity: 6-day split structure matches Finalized Workout.pdf", () => {
  assert.equal(SOURCED_6DAY_TEMPLATE.days.length, 6);
  assert.equal(SOURCED_6DAY_TEMPLATE.sourceReference, "Finalized Workout.pdf");
  assert.equal(SOURCED_6DAY_TEMPLATE.isPublished, true);

  const dayNames = SOURCED_6DAY_TEMPLATE.days.map(d => d.name);
  assert.deepEqual(dayNames, [
    "1.MONDAY - [BACK] [BICEPS] [FOREARM]",
    "2.TUESDAY - [CHEST] [TRICEPS] [ABS]",
    "3.WEDNESDAY - [SHOULDER] [LEG]",
    "4.THURSDAY - [BACK] [BICEPS] [FOREARM]",
    "5.FRIDAY - [CHEST] [TRICEPS] [ABS]",
    "6.SATURDAY - [SHOULDER] [LEG]"
  ]);

  // Day numbers are 1 to 6
  SOURCED_6DAY_TEMPLATE.days.forEach((day, index) => {
    assert.equal(day.dayNumber, index + 1);
    assert.equal(day.sortOrder, index);
  });
});

test("Source fidelity: Day 1 & Day 4 (Back/Biceps/Forearm) exercises and warmups", () => {
  for (const dayIndex of [0, 3]) {
    const day = SOURCED_6DAY_TEMPLATE.days[dayIndex];
    assert.equal(day.warmups.length, 1);
    assert.equal(day.warmups[0].name, "pull ups");
    assert.equal(day.warmups[0].description, "pull ups 5 reps");

    assert.equal(day.entries.length, 8);
    const expectedLabels = [
      "barbell row",
      "lat pull down",
      "lat focused row",
      "close grip lat pulldown",
      "dumbell hammer curl",
      "incline dumbell curl",
      "wrist curl",
      "reverse wrist curl"
    ];
    assert.deepEqual(day.entries.map(e => e.sourceLabel), expectedLabels);

    // All Day 1 sets and reps must be null (omitted in source PDF)
    day.entries.forEach(e => {
      assert.equal(e.sets, null, `Sets should be null for ${e.sourceLabel}`);
      assert.equal(e.reps, null, `Reps should be null for ${e.sourceLabel}`);
      assert.ok(e.videoUrl.startsWith("https://youtube.com/shorts/"));
    });
  }
});

test("Source fidelity: Day 2 & Day 5 (Chest/Triceps/Abs) exercises, warmups, and prescriptions", () => {
  for (const dayIndex of [1, 4]) {
    const day = SOURCED_6DAY_TEMPLATE.days[dayIndex];
    assert.equal(day.warmups.length, 2);
    assert.equal(day.warmups[0].name, "pushups");
    assert.equal(day.warmups[0].description, "10 rep");
    assert.equal(day.warmups[1].name, "pec fly");
    assert.equal(day.warmups[1].description, "10 rep (5kg)");

    assert.equal(day.entries.length, 8);
    const expectedLabels = [
      "incline dumbell press",
      "flat dumbell press",
      "pec fly machine",
      "skull crushers ×4",
      "Cable pushdown ×4",
      "overhead tricep extension",
      "crunches",
      "plank"
    ];
    assert.deepEqual(day.entries.map(e => e.sourceLabel), expectedLabels);

    // Verified triceps sets: 4, reps: null
    const skullCrushers = day.entries.find(e => e.sourceLabel === "skull crushers ×4");
    assert.equal(skullCrushers.sets, 4);
    assert.equal(skullCrushers.reps, null);
    assert.equal(skullCrushers.sourcePrescriptionText, "×4");

    const cablePushdown = day.entries.find(e => e.sourceLabel === "Cable pushdown ×4");
    assert.equal(cablePushdown.sets, 4);
    assert.equal(cablePushdown.reps, null);
    assert.equal(cablePushdown.sourcePrescriptionText, "×4");

    // Other exercises must remain unset (null)
    const inclineDumbellPress = day.entries.find(e => e.sourceLabel === "incline dumbell press");
    assert.equal(inclineDumbellPress.sets, null);
    assert.equal(inclineDumbellPress.reps, null);
  }
});

test("Source fidelity: Day 3 & Day 6 (Shoulder/Leg) exercises and warmups", () => {
  for (const dayIndex of [2, 5]) {
    const day = SOURCED_6DAY_TEMPLATE.days[dayIndex];
    assert.equal(day.warmups.length, 2);
    assert.equal(day.warmups[0].name, "shoulder press");
    assert.equal(day.warmups[0].description, "10 rep (2.5kg)");
    assert.equal(day.warmups[1].name, "lateral rises");
    assert.equal(day.warmups[1].description, "5 rep (2.5kg)");

    assert.equal(day.entries.length, 8);
    const expectedLabels = [
      "Shoulder press",
      "lateral rises",
      "Face pull",
      "squats",
      "leg press",
      "leg extension",
      "hamstring curls",
      "calves"
    ];
    assert.deepEqual(day.entries.map(e => e.sourceLabel), expectedLabels);

    // All Day 3 sets and reps must be null (omitted in source PDF)
    day.entries.forEach(e => {
      assert.equal(e.sets, null, `Sets should be null for ${e.sourceLabel}`);
      assert.equal(e.reps, null, `Reps should be null for ${e.sourceLabel}`);
      assert.ok(e.videoUrl.startsWith("https://youtube.com/shorts/"));
    });
  }
});

test("Source fidelity: Canonical exercises count and distinct muscle groups", () => {
  assert.equal(CANONICAL_EXERCISES.length, 24);
  const muscleGroups = new Set(CANONICAL_EXERCISES.map(e => e.muscleGroup));
  assert.ok(muscleGroups.has("Back"));
  assert.ok(muscleGroups.has("Biceps"));
  assert.ok(muscleGroups.has("Forearm"));
  assert.ok(muscleGroups.has("Chest"));
  assert.ok(muscleGroups.has("Triceps"));
  assert.ok(muscleGroups.has("Abs"));
  assert.ok(muscleGroups.has("Shoulder"));
  assert.ok(muscleGroups.has("Legs"));
});
