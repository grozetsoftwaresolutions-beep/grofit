import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

const testEnv = parseEnvFile(resolve(process.cwd(), '.env.test.local'));
const localEnv = parseEnvFile(resolve(process.cwd(), '.env.local'));
const env = { ...localEnv, ...testEnv };

const BASE_URL = 'http://localhost:3000';
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY
);

let userToken = '';

test('Authenticate Test User A for Exercise Evidence API', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_A_EMAIL,
    password: env.TEST_USER_A_PASSWORD,
  });
  assert.ok(data?.session, `Sign in failed: ${error?.message}`);
  userToken = data.session.access_token;
});

test('GET /api/exercises — Returns enriched evidence-based metadata', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 60, `Should contain at least 60 exercises, got ${json.data.length}`);

  // Find a known evidence-based exercise
  const inclinePress = json.data.find((e) => e.name.toLowerCase().includes('incline dumbell press') || e.name.toLowerCase().includes('incline dumbbell press'));
  assert.ok(inclinePress, 'Incline dumbbell press should be in response');
  assert.equal(inclinePress.rank, 1);
  assert.equal(inclinePress.tier, 'S-Tier');
  assert.ok(inclinePress.hypertrophyScore >= 95);
  assert.ok(inclinePress.targetHead);
  assert.ok(inclinePress.biomechanicalAdvantage);
  assert.ok(inclinePress.evidenceRationale);
  assert.ok(inclinePress.recommendedSets >= 1);
  assert.ok(inclinePress.recommendedReps >= 1);
});

test('GET /api/exercises?topRankedOnly=true — Returns only exercises with rank <= 5', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises?topRankedOnly=true`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.length >= 50, 'Should return at least 50 top-ranked exercises across all 11 muscles');
  for (const ex of json.data) {
    assert.ok(ex.rank !== null && ex.rank <= 5, `Exercise ${ex.name} must have rank <= 5, got ${ex.rank}`);
  }
});

test('GET /api/exercises?muscleGroup=Chest — Returns at least 5 top-ranked chest exercises', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises?muscleGroup=Chest`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.length >= 5, `Should return at least 5 chest exercises, got ${json.data.length}`);
  const rank1 = json.data.find((e) => e.rank === 1);
  assert.ok(rank1, 'Chest must have a rank #1 exercise');
  assert.ok(rank1.name.toLowerCase().includes('incline'));
});

test('GET /api/exercises?muscleGroup=Biceps — Returns at least 5 top-ranked bicep exercises', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises?muscleGroup=Biceps`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.length >= 5, `Should return at least 5 bicep exercises, got ${json.data.length}`);
  const rank1 = json.data.find((e) => e.rank === 1);
  assert.ok(rank1, 'Biceps must have a rank #1 exercise');
  assert.ok(rank1.name.toLowerCase().includes('incline'));
});

test('GET /api/exercises?muscleGroup=Triceps — Returns at least 5 top-ranked tricep exercises', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises?muscleGroup=Triceps`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.length >= 5, `Should return at least 5 tricep exercises, got ${json.data.length}`);
  const rank1 = json.data.find((e) => e.rank === 1);
  assert.ok(rank1, 'Triceps must have a rank #1 exercise');
  assert.ok(rank1.name.toLowerCase().includes('overhead'));
});

test('GET /api/exercises?muscleGroup=Legs — Returns multi-muscle leg exercises', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises?muscleGroup=Legs`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.length >= 15, `Legs query should retrieve at least 15 exercises across quad/ham/glute/calf`);
});
