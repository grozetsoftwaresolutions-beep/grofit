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

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const supabaseUrl = env.LOCAL_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.LOCAL_SUPABASE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const userAEmail = env.LOCAL_TEST_USER_A_EMAIL || env.TEST_USER_A_EMAIL;
const userAPassword = env.LOCAL_TEST_USER_A_PASSWORD || env.TEST_USER_A_PASSWORD;
const userBEmail = env.LOCAL_TEST_USER_B_EMAIL || env.TEST_USER_B_EMAIL;
const userBPassword = env.LOCAL_TEST_USER_B_PASSWORD || env.TEST_USER_B_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);

let userAToken = '';
let userBToken = '';
let habitToDeleteId = '';

test('1. Authenticate Test Users A and B', async (t) => {
  if (!userAEmail || !userBEmail) {
    t.skip('Test credentials missing.');
    return;
  }

  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  });
  assert.ok(authA?.session, `User A sign in failed: ${errA?.message}`);
  userAToken = authA.session.access_token;

  const { data: authB, error: errB } = await supabase.auth.signInWithPassword({
    email: userBEmail,
    password: userBPassword,
  });
  assert.ok(authB?.session, `User B sign in failed: ${errB?.message}`);
  userBToken = authB.session.access_token;
});

test('2. DELETE /api/habits/[habitId] — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/f1000000-0000-0000-0000-000000000001`, {
    method: 'DELETE',
  });
  assert.equal(res.status, 401);
});

test('3. DELETE /api/habits/[habitId] — 400 Invalid UUID', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/not-a-valid-uuid`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 400);
});

test('4. DELETE /api/habits/[habitId] — 404 Non-existent habit', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 404);
});

test('5. User A creates habit, logs check-in, and successfully deletes it', async () => {
  // Create habit
  const createRes = await fetch(`${BASE_URL}/api/habits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Disposable Habit For Delete Test' }),
  });
  assert.equal(createRes.status, 201);
  const createJson = await createRes.json();
  habitToDeleteId = createJson.data.id;
  assert.ok(habitToDeleteId);

  // Log a check-in
  const logRes = await fetch(`${BASE_URL}/api/habits/${habitToDeleteId}/logs/2026-10-14`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(logRes.status, 200);

  // User B tries to delete User A's habit -> 404 access denied
  const userBDeleteRes = await fetch(`${BASE_URL}/api/habits/${habitToDeleteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(userBDeleteRes.status, 404);

  // User A deletes own habit -> 200 OK
  const deleteRes = await fetch(`${BASE_URL}/api/habits/${habitToDeleteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(deleteRes.status, 200);
  const deleteJson = await deleteRes.json();
  assert.equal(deleteJson.data.deleted, true);
  assert.equal(deleteJson.data.id, habitToDeleteId);

  // Subsequent GET returns it gone
  const getListRes = await fetch(`${BASE_URL}/api/habits?includeArchived=true`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(getListRes.status, 200);
  const listJson = await getListRes.json();
  const found = listJson.data.find((h) => h.id === habitToDeleteId);
  assert.equal(found, undefined, 'Deleted habit must no longer appear in habit list');
});
