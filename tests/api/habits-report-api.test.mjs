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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let userAToken = '';
let userBToken = '';

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

test('2. GET /api/habits/report — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/report`);
  assert.equal(res.status, 401);
  const json = await res.json();
  assert.equal(json.error.code, 'UNAUTHENTICATED');
});

test('3. GET /api/habits/report — 200 Default 1m range', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/report`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data);
  assert.equal(json.data.rangeKey, '1m');
  assert.equal(json.data.totalDays, 30);
  assert.match(json.data.period, /Last Month/);
  assert.ok(json.data.summary);
  assert.ok(typeof json.data.summary.totalHabits === 'number');
  assert.ok(Array.isArray(json.data.habits));
});

test('4. GET /api/habits/report?range=3m — 200 3 months range', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/report?range=3m`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.rangeKey, '3m');
  assert.equal(json.data.totalDays, 90);
  assert.match(json.data.period, /3 Months/);
});

test('5. GET /api/habits/report?range=6m — 200 6 months range', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/report?range=6m`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.rangeKey, '6m');
  assert.equal(json.data.totalDays, 180);
  assert.match(json.data.period, /6 Months/);
});

test('6. GET /api/habits/report?range=1y — 200 1 year range', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/report?range=1y`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.rangeKey, '1y');
  assert.equal(json.data.totalDays, 365);
  assert.match(json.data.period, /1 Year/);
});

test('7. User Isolation: User B report isolates their own habits', async () => {
  const res = await fetch(`${BASE_URL}/api/habits/report?range=1m`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data);
  // User B's report should not leak User A's data
  assert.notEqual(json.data.clientName, env.TEST_USER_A_EMAIL);
});
