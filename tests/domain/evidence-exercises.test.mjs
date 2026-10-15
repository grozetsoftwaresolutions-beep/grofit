import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVIDENCE_BASED_EXERCISES,
  WORKOUT_MUSCLE_GROUPS,
  getTopRankedExercisesForMuscle,
} from '../../src/lib/workout/evidence-exercises.ts';

test('Evidence-Based Workout Library: Contains comprehensive catalogue', () => {
  assert.ok(EVIDENCE_BASED_EXERCISES.length >= 55, 'Should have at least 55 evidence-based exercises');
});

test('Evidence-Based Workout Library: Every muscle group has at least 5 top-ranked exercises', () => {
  const targetMuscles = [
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Quads',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Abs',
    'Forearms',
  ];

  for (const muscle of targetMuscles) {
    const list = getTopRankedExercisesForMuscle(muscle, 10);
    assert.ok(
      list.length >= 5,
      `Muscle group "${muscle}" must have at least 5 top-ranked exercises, found ${list.length}`
    );

    // Verify ranks 1 through 5 are present
    const ranks = list.map((e) => e.rank);
    for (let r = 1; r <= 5; r++) {
      assert.ok(ranks.includes(r), `Muscle "${muscle}" must contain rank #${r}`);
    }
  }
});

test('Evidence-Based Workout Library: Field completeness and validity', () => {
  for (const ex of EVIDENCE_BASED_EXERCISES) {
    assert.ok(ex.id, `Exercise ${ex.name} must have an ID`);
    assert.ok(ex.name, `Exercise must have a name`);
    assert.ok(ex.muscleGroup, `Exercise ${ex.name} must have a muscleGroup`);
    assert.ok(ex.targetHead, `Exercise ${ex.name} must specify targetHead`);
    assert.ok(ex.rank >= 1 && ex.rank <= 6, `Exercise ${ex.name} rank must be between 1 and 6`);
    assert.ok(ex.tier === 'S-Tier' || ex.tier === 'A-Tier', `Exercise ${ex.name} tier must be S-Tier or A-Tier`);
    assert.ok(ex.hypertrophyScore >= 90 && ex.hypertrophyScore <= 100, `Exercise ${ex.name} hypertrophyScore must be 90-100`);
    assert.ok(ex.biomechanicalAdvantage, `Exercise ${ex.name} must specify biomechanical advantage`);
    assert.ok(ex.evidenceRationale, `Exercise ${ex.name} must specify evidence rationale`);
    assert.ok(ex.scientificReference, `Exercise ${ex.name} must cite scientific research`);
    assert.ok(ex.recommendedSets >= 1 && ex.recommendedSets <= 20, `Exercise ${ex.name} recommendedSets must be 1-20`);
    assert.ok(ex.recommendedReps >= 1 && ex.recommendedReps <= 200, `Exercise ${ex.name} recommendedReps must be 1-200`);
    assert.ok(ex.recommendedRepRange, `Exercise ${ex.name} must specify recommendedRepRange`);
    assert.ok(Array.isArray(ex.executionCues) && ex.executionCues.length > 0, `Exercise ${ex.name} must have execution cues`);
  }
});

test('Evidence-Based Workout Library: Helper function getTopRankedExercisesForMuscle', () => {
  // Test All with limit 5
  const allTop5 = getTopRankedExercisesForMuscle('All', 5);
  assert.ok(allTop5.length > 0);
  assert.ok(allTop5.every((e) => e.rank <= 5));

  // Test singular/plural variations
  const shoulders = getTopRankedExercisesForMuscle('Shoulder', 5);
  const shouldersPlural = getTopRankedExercisesForMuscle('Shoulders', 5);
  assert.equal(shoulders.length, shouldersPlural.length);
  assert.ok(shoulders.length >= 5);

  const forearms = getTopRankedExercisesForMuscle('Forearm', 5);
  const forearmsPlural = getTopRankedExercisesForMuscle('Forearms', 5);
  assert.equal(forearms.length, forearmsPlural.length);
  assert.ok(forearms.length >= 5);

  // Test Legs umbrella
  const legs = getTopRankedExercisesForMuscle('Legs', 20);
  assert.ok(legs.length >= 15, 'Legs query should retrieve exercises across Quads, Hamstrings, Glutes, and Calves');
});

test('Evidence-Based Workout Library: WORKOUT_MUSCLE_GROUPS includes all 12 categories', () => {
  assert.equal(WORKOUT_MUSCLE_GROUPS.length, 12);
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('All'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Chest'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Back'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Shoulders'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Biceps'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Triceps'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Quads'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Hamstrings'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Glutes'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Calves'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Abs'));
  assert.ok(WORKOUT_MUSCLE_GROUPS.includes('Forearms'));
});

test('Evidence-Based Workout Library: Every exercise has a verified YouTube tutorial URL and creator credit', () => {
  assert.ok(EVIDENCE_BASED_EXERCISES.length > 0);
  for (const ex of EVIDENCE_BASED_EXERCISES) {
    assert.ok(
      typeof ex.videoUrl === 'string' && ex.videoUrl.startsWith('https://www.youtube.com/'),
      `Exercise ${ex.name} (${ex.sourceKey}) must have a valid YouTube videoUrl, got: ${ex.videoUrl}`
    );
    assert.ok(
      typeof ex.videoCredit === 'string' && ex.videoCredit.trim().length > 0,
      `Exercise ${ex.name} (${ex.sourceKey}) must have a creator videoCredit, got: ${ex.videoCredit}`
    );
  }
});

