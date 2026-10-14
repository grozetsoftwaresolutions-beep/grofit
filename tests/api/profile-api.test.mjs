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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const userAEmail = env.LOCAL_TEST_USER_A_EMAIL || env.TEST_USER_A_EMAIL;
const userAPassword = env.LOCAL_TEST_USER_A_PASSWORD || env.TEST_USER_A_PASSWORD;
const userBEmail = env.LOCAL_TEST_USER_B_EMAIL || env.TEST_USER_B_EMAIL;
const userBPassword = env.LOCAL_TEST_USER_B_PASSWORD || env.TEST_USER_B_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);

let userAToken = '';
let userBToken = '';
let userAId = '';
let userBId = '';

test('1. Setup authentication tokens for Test Users A and B', async (t) => {
  if (!userAEmail || !userBEmail) {
    t.skip('Test credentials missing. Skipping suite.');
    return;
  }

  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  });
  assert.ifError(errA);
  userAToken = authA.session.access_token;
  userAId = authA.user.id;

  const { data: authB, error: errB } = await supabase.auth.signInWithPassword({
    email: userBEmail,
    password: userBPassword,
  });
  assert.ifError(errB);
  userBToken = authB.session.access_token;
  userBId = authB.user.id;
});

test('2. GET /api/profile — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/profile`);
  assert.equal(res.status, 401);
});

test('3. GET /api/profile — User A retrieves own profile', async () => {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data);
  assert.equal(json.data.id, userAId);
  assert.equal(json.data.email, userAEmail);
  assert.ok(json.data.timezone);
});

test('4. Cross-user isolation: User B retrieves own profile and cannot view User A', async () => {
  const resB = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(resB.status, 200);
  const jsonB = await resB.json();
  assert.equal(jsonB.data.id, userBId);
  assert.equal(jsonB.data.email, userBEmail);
  assert.notEqual(jsonB.data.id, userAId, 'User B must never receive User A profile');
});

test('5. PATCH /api/profile — Input validation rejects invalid fields', async () => {
  // Empty JSON
  const resEmpty = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  assert.equal(resEmpty.status, 400);

  // Exceeds 100 chars
  const resTooLong = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayName: 'a'.repeat(101) }),
  });
  assert.equal(resTooLong.status, 400);

  // Invalid timezone
  const resInvalidTz = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timezone: 'Invalid/City_Nowhere' }),
  });
  assert.equal(resInvalidTz.status, 400);
});

test('6. PATCH /api/profile — User A successfully updates display_name and timezone', async () => {
  const updatedName = 'Tamil Nadu Athlete';
  const updatedTz = 'Asia/Kolkata';

  const res = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName: updatedName,
      timezone: updatedTz,
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.displayName, updatedName);
  assert.equal(json.data.timezone, updatedTz);

  // Verify persistence via GET
  const checkRes = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(checkRes.status, 200);
  const checkJson = await checkRes.json();
  assert.equal(checkJson.data.displayName, updatedName);
  assert.equal(checkJson.data.timezone, updatedTz);
});
