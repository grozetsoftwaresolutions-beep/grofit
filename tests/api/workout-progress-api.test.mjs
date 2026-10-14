import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load test environment variables safely
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let userAToken = '';
let userBToken = '';
let exerciseId = '';
let testLogId = '';
let bodyweightLogId = '';

test('1. Authenticate Test Users A and B', async () => {
  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_A_EMAIL,
    password: env.TEST_USER_A_PASSWORD,
  });
  assert.ok(authA?.session, `User A sign in failed: ${errA?.message}`);
  userAToken = authA.session.access_token;

  const { data: authB, error: errB } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_B_EMAIL,
    password: env.TEST_USER_B_PASSWORD,
  });
  assert.ok(authB?.session, `User B sign in failed: ${errB?.message}`);
  userBToken = authB.session.access_token;
});

test('2. GET /api/workout-progress — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-progress`);
  assert.equal(res.status, 401);
});

test('3. Fetch canonical exercise for progress tracking', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.length > 0);
  exerciseId = json.data[0].id;
  assert.ok(exerciseId);
});

test('4. POST /api/workout-progress — Record valid external load entry', async () => {
  const payload = {
    exerciseId,
    loggedOn: '2026-10-12',
    setsCompleted: 4,
    repsCompleted: 10,
    externalLoad: 30,
    externalLoadUnit: 'kg',
    isBodyweight: false,
    notes: 'Strong set with good pause at bottom',
  };

  const res = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.ok(json.data?.id);
  assert.equal(json.data.exerciseId, exerciseId);
  assert.equal(json.data.loggedOn, '2026-10-12');
  assert.equal(json.data.setsCompleted, 4);
  assert.equal(json.data.repsCompleted, 10);
  assert.equal(json.data.externalLoad, 30);
  assert.equal(json.data.externalLoadUnit, 'kg');
  assert.equal(json.data.isBodyweight, false);
  assert.equal(json.data.notes, 'Strong set with good pause at bottom');

  testLogId = json.data.id;
});

test('5. GET /api/workout-progress — User A retrieves exercise progress history', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-progress?exerciseId=${exerciseId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.data));
  const found = json.data.find((l) => l.id === testLogId);
  assert.ok(found, 'Recorded log should appear in progress history');
  assert.equal(found.externalLoad, 30);
});

test('6. PATCH /api/workout-progress/[logId] — User A edits own log', async () => {
  const updatePayload = {
    setsCompleted: 5,
    repsCompleted: 8,
    externalLoad: 35,
    externalLoadUnit: 'kg',
    notes: 'Increased weight for 5th set',
  };

  const res = await fetch(`${BASE_URL}/api/workout-progress/${testLogId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.setsCompleted, 5);
  assert.equal(json.data.repsCompleted, 8);
  assert.equal(json.data.externalLoad, 35);
  assert.equal(json.data.notes, 'Increased weight for 5th set');
});

test('7. POST /api/workout-progress — Validates and rejects malformed inputs', async () => {
  // Invalid calendar date
  const resBadDate = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, loggedOn: '2026-02-31' }),
  });
  assert.equal(resBadDate.status, 400);

  // Sets > 20
  const resBadSets = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, loggedOn: '2026-10-12', setsCompleted: 25 }),
  });
  assert.equal(resBadSets.status, 400);

  // Reps > 200
  const resBadReps = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, loggedOn: '2026-10-12', repsCompleted: 250 }),
  });
  assert.equal(resBadReps.status, 400);

  // External load <= 0
  const resZeroLoad = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, loggedOn: '2026-10-12', externalLoad: 0, externalLoadUnit: 'kg' }),
  });
  assert.equal(resZeroLoad.status, 400);

  // External load without unit
  const resNoUnit = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, loggedOn: '2026-10-12', externalLoad: 50, externalLoadUnit: null }),
  });
  assert.equal(resNoUnit.status, 400);

  // Bodyweight with external load
  const resBwWithLoad = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, loggedOn: '2026-10-12', isBodyweight: true, externalLoad: 20 }),
  });
  assert.equal(resBwWithLoad.status, 400);

  // Bodyweight with unit
  const resBwWithUnit = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, loggedOn: '2026-10-12', isBodyweight: true, externalLoadUnit: 'kg' }),
  });
  assert.equal(resBwWithUnit.status, 400);
});

test('8. POST /api/workout-progress — Record valid bodyweight session', async () => {
  const payload = {
    exerciseId,
    loggedOn: '2026-10-13',
    setsCompleted: 3,
    repsCompleted: 15,
    isBodyweight: true,
    externalLoad: null,
    externalLoadUnit: null,
    notes: 'Bodyweight pullups to failure',
  };

  const res = await fetch(`${BASE_URL}/api/workout-progress`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.data.isBodyweight, true);
  assert.equal(json.data.externalLoad, null);
  assert.equal(json.data.externalLoadUnit, null);
  bodyweightLogId = json.data.id;
});

test('9. RLS & Isolation: User B cannot access or modify User A logs', async () => {
  // User B queries workout-progress for exercise
  const resList = await fetch(`${BASE_URL}/api/workout-progress?exerciseId=${exerciseId}`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(resList.status, 200);
  const listJson = await resList.json();
  const leaked = listJson.data.some((l) => l.id === testLogId || l.id === bodyweightLogId);
  assert.equal(leaked, false, 'User B must not see User A logs');

  // User B attempts to PATCH User A log
  const resPatch = await fetch(`${BASE_URL}/api/workout-progress/${testLogId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userBToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ setsCompleted: 1 }),
  });
  assert.equal(resPatch.status, 404, 'User B must be denied updating User A log');

  // User B attempts to DELETE User A log
  const resDel = await fetch(`${BASE_URL}/api/workout-progress/${testLogId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(resDel.status, 404, 'User B must be denied deleting User A log');
});

test('10. Historical Integrity: Workout progress survives personal plan changes and deletion', async () => {
  // 1. User A creates a personal plan
  const planRes = await fetch(`${BASE_URL}/api/workout-plans`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Plan For Progress Survival Test' }),
  });
  assert.equal(planRes.status, 201);
  const planJson = await planRes.json();
  const planId = planJson.data.id;

  // 2. Add a day
  const dayRes = await fetch(`${BASE_URL}/api/workout-plans/${planId}/days`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Day 1', sortOrder: 0 }),
  });
  assert.equal(dayRes.status, 201);
  const dayJson = await dayRes.json();
  const dayId = dayJson.data.id;

  // 3. Add exercise entry
  const entryRes = await fetch(`${BASE_URL}/api/workout-plans/${planId}/days/${dayId}/entries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, sets: 3, reps: 10, sortOrder: 0 }),
  });
  assert.equal(entryRes.status, 201);
  const entryJson = await entryRes.json();
  const entryId = entryJson.data.id;

  // 4. Delete the exercise entry from the plan
  const delEntryRes = await fetch(
    `${BASE_URL}/api/workout-plans/${planId}/days/${dayId}/entries/${entryId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    }
  );
  assert.ok([200, 204].includes(delEntryRes.status));

  // 5. Delete the entire personal plan
  const delPlanRes = await fetch(`${BASE_URL}/api/workout-plans/${planId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(delPlanRes.status, 204);

  // 6. Verify that workout progress history for the exercise remains intact!
  const progressCheckRes = await fetch(
    `${BASE_URL}/api/workout-progress?exerciseId=${exerciseId}`,
    {
      headers: { Authorization: `Bearer ${userAToken}` },
    }
  );
  assert.equal(progressCheckRes.status, 200);
  const progressJson = await progressCheckRes.json();
  const preservedLog = progressJson.data.find((l) => l.id === testLogId);
  assert.ok(preservedLog, 'Historical workout log MUST survive personal plan deletion!');
});

test('11. Cleanup test logs', async () => {
  if (testLogId) {
    const res1 = await fetch(`${BASE_URL}/api/workout-progress/${testLogId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(res1.status, 200);
  }

  if (bodyweightLogId) {
    const res2 = await fetch(`${BASE_URL}/api/workout-progress/${bodyweightLogId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(res2.status, 200);
  }
});
