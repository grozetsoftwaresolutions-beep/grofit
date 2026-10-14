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
let userAPlanId = '';
let userADayId = '';
let userAEntryId = '';
let templateId = '';
let canonicalExerciseId = '';

test('Authenticate Test Users A and B', async () => {
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

test('GET /api/workout-templates — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-templates`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error.code, 'UNAUTHENTICATED');
});

test('GET /api/workout-templates — 200 Authenticated list', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-templates`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length >= 1);
  const found = json.data.find(t => t.name.includes('Finalized Workout Split'));
  assert.ok(found, 'Finalized Workout Split should be in published templates');
  templateId = found.id;
});

test('GET /api/workout-templates/[templateId] — 200 Full details and source fidelity', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-templates/${templateId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.id, templateId);
  assert.equal(json.data.sourceReference, 'Finalized Workout.pdf');
  assert.equal(json.data.days.length, 6);

  // Day 1 has 8 entries, sets & reps null
  const day1 = json.data.days[0];
  assert.equal(day1.entries.length, 8);
  assert.equal(day1.entries[0].sets, null);
  assert.equal(day1.entries[0].reps, null);
  assert.ok(day1.entries[0].videoUrl.startsWith('https://youtube.com/shorts/'));

  // Day 2 has triceps with sets: 4
  const day2 = json.data.days[1];
  const skullCrushers = day2.entries.find(e => e.sourceLabel === 'skull crushers ×4');
  assert.ok(skullCrushers);
  assert.equal(skullCrushers.sets, 4);
});

test('GET /api/workout-templates — 200 Home Calisthenics Split retrieval & YouTube creator links', async () => {
  const homeTemplateId = 'a3000000-0000-0000-0000-000000000001';
  const res = await fetch(`${BASE_URL}/api/workout-templates/${homeTemplateId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.id, homeTemplateId);
  assert.equal(json.data.name, 'Evidence-Based Home Calisthenics Split (3-Day)');
  assert.equal(json.data.days.length, 3);

  // Day 1: Upper Body Push & Pull
  const day1 = json.data.days[0];
  assert.equal(day1.dayNumber, 1);
  assert.ok(day1.name.includes('Upper Body Push & Pull'));
  assert.equal(day1.warmups.length, 2);
  assert.equal(day1.entries.length, 6);

  // Day 1 contains Pull-ups and Push-ups
  const pullups = day1.entries.find((e) => e.sourceLabel.includes('Pull-Ups'));
  assert.ok(pullups, 'Day 1 must contain Pull-Ups');
  assert.ok(pullups.videoUrl.includes('youtube.com/watch?v='));
  assert.ok(pullups.sourcePrescriptionText.includes('FitnessFAQs'));

  const pushups = day1.entries.find((e) => e.sourceLabel.includes('Push-Ups'));
  assert.ok(pushups, 'Day 1 must contain Push-Ups');
  assert.ok(pushups.videoUrl.includes('youtube.com/watch?v='));
  assert.ok(pushups.sourcePrescriptionText.includes('Calisthenicmovement'));

  // Day 2: Lower Body & Core
  const day2 = json.data.days[1];
  assert.equal(day2.dayNumber, 2);
  assert.ok(day2.entries.length >= 5);
  for (const entry of day2.entries) {
    assert.ok(entry.videoUrl && entry.videoUrl.startsWith('https://www.youtube.com/watch?v='));
    assert.ok(entry.sourcePrescriptionText && entry.sourcePrescriptionText.includes('Creator:'));
  }

  // Day 3: Full Body Overload
  const day3 = json.data.days[2];
  assert.equal(day3.dayNumber, 3);
  assert.ok(day3.entries.length >= 5);
  for (const entry of day3.entries) {
    assert.ok(entry.videoUrl && entry.videoUrl.startsWith('https://www.youtube.com/watch?v='));
    assert.ok(entry.sourcePrescriptionText && entry.sourcePrescriptionText.includes('Creator:'));
  }
});

test('GET /api/workout-templates/[invalid] — 404 Not Found', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-templates/00000000-0000-0000-0000-000000000000`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 404);
});

test('GET /api/exercises — 200 Exercise Library', async () => {
  const res = await fetch(`${BASE_URL}/api/exercises`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.length >= 24);
  canonicalExerciseId = json.data[0].id;
});

test('POST /api/workout-plans — 201 Create Personal Plan', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'My Custom Hypertrophy Plan' }),
  });
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.data.name, 'My Custom Hypertrophy Plan');
  assert.ok(json.data.id);
  userAPlanId = json.data.id;
});

test('GET /api/workout-plans — 200 User A lists own plans', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-plans`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const found = json.data.find(p => p.id === userAPlanId);
  assert.ok(found);
});

test('PATCH /api/workout-plans/[planId] — 200 Rename plan', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Updated Custom Plan' }),
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.name, 'Updated Custom Plan');
});

test('POST /api/workout-plans/[planId]/days — 201 Add day', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}/days`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Leg Day Alpha', sortOrder: 0 }),
  });
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.data.name, 'Leg Day Alpha');
  userADayId = json.data.id;
});

test('POST /api/workout-plans/[planId]/days/[dayId]/entries — Validation & Creation', async () => {
  // Invalid sets (25 > 20)
  const badRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}/days/${userADayId}/entries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ exerciseId: canonicalExerciseId, sets: 25, reps: 10 }),
  });
  assert.equal(badRes.status, 400);

  // Valid sets & reps
  const goodRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}/days/${userADayId}/entries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ exerciseId: canonicalExerciseId, sets: 4, reps: 12 }),
  });
  assert.equal(goodRes.status, 201);
  const json = await goodRes.json();
  assert.equal(json.data.sets, 4);
  assert.equal(json.data.reps, 12);
  userAEntryId = json.data.id;
});

test('PATCH /api/workout-plans/[planId]/days/[dayId]/entries/[entryId] — 200 Update', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}/days/${userADayId}/entries/${userAEntryId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sets: 5, reps: 15 }),
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.sets, 5);
  assert.equal(json.data.reps, 15);
});

test('POST /api/workout-plans/[planId]/apply-template — Replace mode atomic transaction', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}/apply-template`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templateId, mode: 'replace' }),
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.status, 'success');
  assert.equal(json.data.daysApplied, 6);
  assert.equal(json.data.entriesApplied, 48);

  // Verify plan now contains exactly the 6 days and 48 entries
  const planRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  const planData = await planRes.json();
  assert.equal(planData.data.days.length, 6);
  const totalEntries = planData.data.days.reduce((acc, d) => acc + d.entries.length, 0);
  assert.equal(totalEntries, 48);
});

test('POST /api/workout-plans/[planId]/apply-template — Merge mode idempotency', async () => {
  // Merging already applied template should not duplicate entries
  const res = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}/apply-template`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templateId, mode: 'merge' }),
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.status, 'success');
  assert.equal(json.data.entriesApplied, 0); // 0 new entries because all already present

  // Verify plan still has exactly 6 days and 48 entries
  const planRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  const planData = await planRes.json();
  assert.equal(planData.data.days.length, 6);
  const totalEntries = planData.data.days.reduce((acc, d) => acc + d.entries.length, 0);
  assert.equal(totalEntries, 48);
});

test('RLS & Security: User B cannot view or modify User A plan', async () => {
  // User B tries to GET User A's plan
  const getRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(getRes.status, 404, 'User B should receive 404 when querying User A plan');

  // User B tries to PATCH User A's plan
  const patchRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userBToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Hacked Plan' }),
  });
  assert.equal(patchRes.status, 404, 'User B should not be able to update User A plan');

  // User B tries to apply template to User A's plan
  const applyRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}/apply-template`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userBToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templateId, mode: 'replace' }),
  });
  assert.equal(applyRes.status, 404, 'User B should not be able to modify User A plan via RPC');

  // User B tries to DELETE User A's plan
  const delRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(delRes.status, 404, 'User B should not be able to delete User A plan');
});

test('DELETE /api/workout-plans/[planId] — 204 Owner Deletes Plan', async () => {
  const res = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 204);

  // Plan no longer accessible
  const getRes = await fetch(`${BASE_URL}/api/workout-plans/${userAPlanId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(getRes.status, 404);
});
