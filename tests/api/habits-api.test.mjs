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
let habitId = '';

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

test('2. GET /api/habits — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/habits`);
  assert.equal(res.status, 401);
});

test('3. POST /api/habits — User A creates a valid habit', async () => {
  const payload = {
    name: 'Morning Hydration',
    description: 'Drink 500ml water upon waking',
  };

  const res = await fetch(`${BASE_URL}/api/habits`, {
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
  assert.equal(json.data.name, 'Morning Hydration');
  assert.equal(json.data.description, 'Drink 500ml water upon waking');
  assert.equal(json.data.isActive, true);
  assert.equal(json.data.currentStreak, 0);
  assert.equal(json.data.bestStreak, 0);

  habitId = json.data.id;
});

test('4. POST /api/habits — Validates input and rejects empty names', async () => {
  const res = await fetch(`${BASE_URL}/api/habits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '   ' }),
  });
  assert.equal(res.status, 400);

  const resTooLong = await fetch(`${BASE_URL}/api/habits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'a'.repeat(101) }),
  });
  assert.equal(resTooLong.status, 400);
});

test('5. GET /api/habits — User A lists habits', async () => {
  const res = await fetch(`${BASE_URL}/api/habits`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.data));
  const found = json.data.find((h) => h.id === habitId);
  assert.ok(found);
  assert.ok(json.meta?.timezone);
});

test('6. PATCH /api/habits/[habitId] — User A edits habit name and description', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/${habitId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hydration 1L',
      description: 'Drink 1L water with electrolytes',
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.name, 'Hydration 1L');
  assert.equal(json.data.description, 'Drink 1L water with electrolytes');
});

test('7. PUT /api/habits/[habitId]/logs/[date] — Marks date complete idempotently', async () => {
  // First completion request
  const res1 = await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-12`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res1.status, 200);
  const json1 = await res1.json();
  assert.equal(json1.data.completed, true);
  assert.equal(json1.data.completedOn, '2026-10-12');

  // Repeated request (idempotency test)
  const res2 = await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-12`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res2.status, 200);
});

test('8. DELETE /api/habits/[habitId]/logs/[date] — Unmarks completion', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-12`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);

  // Check logs to confirm removal
  const checkRes = await fetch(`${BASE_URL}/api/habits/${habitId}/logs`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(checkRes.status, 200);
  const checkJson = await checkRes.json();
  const exists = checkJson.data.some((l) => l.completedOn === '2026-10-12');
  assert.equal(exists, false);
});

test('9. Streak calculation: Consecutive completions update current and best streak', async () => {
  // Mark 2026-10-10, 2026-10-11, 2026-10-12, 2026-10-13 (4 consecutive days)
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-10`, { method: 'PUT', headers: { Authorization: `Bearer ${userAToken}` } });
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-11`, { method: 'PUT', headers: { Authorization: `Bearer ${userAToken}` } });
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-12`, { method: 'PUT', headers: { Authorization: `Bearer ${userAToken}` } });
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-13`, { method: 'PUT', headers: { Authorization: `Bearer ${userAToken}` } });

  const res = await fetch(`${BASE_URL}/api/habits`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  const json = await res.json();
  const habit = json.data.find((h) => h.id === habitId);
  assert.ok(habit);
  assert.ok(habit.currentStreak >= 1, `Current streak should be active: ${habit.currentStreak}`);
  assert.equal(habit.bestStreak, 4, `Best streak should be 4: ${habit.bestStreak}`);
});

test('10. Archive Habit: Preserves completion history and rejects new logs', async () => {
  // Archive habit
  const archiveRes = await fetch(`${BASE_URL}/api/habits/${habitId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: false }),
  });
  assert.equal(archiveRes.status, 200);

  // History is preserved
  const historyRes = await fetch(`${BASE_URL}/api/habits/${habitId}/logs`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(historyRes.status, 200);
  const historyJson = await historyRes.json();
  assert.equal(historyJson.data.length, 4, 'History records must be preserved when archived');

  // Attempting to complete an archived habit returns 422
  const tryLogRes = await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-14`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(tryLogRes.status, 422);

  // Reactivate habit
  const reactivateRes = await fetch(`${BASE_URL}/api/habits/${habitId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: true }),
  });
  assert.equal(reactivateRes.status, 200);
});

test('11. User Isolation & Security: User B cannot access or modify User A habit', async () => {
  // User B tries to view User A habit logs -> 404
  const resLogs = await fetch(`${BASE_URL}/api/habits/${habitId}/logs`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(resLogs.status, 404);

  // User B tries to update User A habit -> 404
  const resPatch = await fetch(`${BASE_URL}/api/habits/${habitId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userBToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacked Habit' }),
  });
  assert.equal(resPatch.status, 404);

  // User B tries to mark completion for User A habit -> 404
  const resPut = await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-13`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(resPut.status, 404);
});

test('12. Cleanup test habit and logs', async () => {
  // Delete logs first
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-10`, { method: 'DELETE', headers: { Authorization: `Bearer ${userAToken}` } });
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-11`, { method: 'DELETE', headers: { Authorization: `Bearer ${userAToken}` } });
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-12`, { method: 'DELETE', headers: { Authorization: `Bearer ${userAToken}` } });
  await fetch(`${BASE_URL}/api/habits/${habitId}/logs/2026-10-13`, { method: 'DELETE', headers: { Authorization: `Bearer ${userAToken}` } });
});
