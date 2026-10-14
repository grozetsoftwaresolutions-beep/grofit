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

test('2. GET /api/account/export — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/account/export`);
  assert.equal(res.status, 401);
});

test('3. GET /api/account/export — User A downloads versioned JSON export with proper headers', async () => {
  const res = await fetch(`${BASE_URL}/api/account/export`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });

  assert.equal(res.status, 200);

  // Verify Headers
  const contentType = res.headers.get('content-type') || '';
  const contentDisposition = res.headers.get('content-disposition') || '';
  const cacheControl = res.headers.get('cache-control') || '';

  assert.ok(contentType.includes('application/json'), `Expected json content-type, got ${contentType}`);
  assert.ok(contentDisposition.includes('attachment'), 'Must be attachment');
  assert.ok(contentDisposition.includes('fitness-data-export-'), 'Filename must follow pattern');
  assert.ok(cacheControl.includes('no-store'), 'Cache-Control must contain no-store');

  const json = await res.json();

  // Verify Versioned Metadata
  assert.ok(json.metadata);
  assert.equal(json.metadata.exportFormat, 'tamil-nadu-fitness-companion-export');
  assert.equal(json.metadata.version, '1.0.0');
  assert.equal(json.metadata.userId, userAId);
  assert.ok(!isNaN(Date.parse(json.metadata.exportedAt)));

  // Verify Required Sections Exist
  assert.ok(json.profile !== undefined);
  assert.ok(Array.isArray(json.workoutPlans));
  assert.ok(Array.isArray(json.workoutLogs));
  assert.ok(Array.isArray(json.habits));
  assert.ok(Array.isArray(json.mealPlans));

  // Security: Ensure no credentials or service keys leaked
  const rawString = JSON.stringify(json);
  assert.ok(!rawString.includes('password'), 'Export must not contain password fields');
  assert.ok(!rawString.includes('service_role'), 'Export must not contain service_role keys');
  assert.ok(!rawString.includes(userAPassword), 'Password secret must never be in export');
});

test('4. Cross-User Isolation: User A export contains no User B records, and vice versa', async () => {
  // 1. Fetch User A export
  const resA = await fetch(`${BASE_URL}/api/account/export`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(resA.status, 200);
  const jsonA = await resA.json();

  // 2. Fetch User B export
  const resB = await fetch(`${BASE_URL}/api/account/export`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(resB.status, 200);
  const jsonB = await resB.json();

  assert.equal(jsonA.metadata.userId, userAId);
  assert.equal(jsonB.metadata.userId, userBId);

  // Check habits isolation
  const habitIdsA = new Set(jsonA.habits.map((h) => h.id));
  const habitIdsB = new Set(jsonB.habits.map((h) => h.id));
  for (const id of habitIdsA) {
    assert.ok(!habitIdsB.has(id), `User B export unexpectedly contained User A habit ID: ${id}`);
  }

  // Check meal plans isolation
  const mealPlanIdsA = new Set(jsonA.mealPlans.map((m) => m.id));
  const mealPlanIdsB = new Set(jsonB.mealPlans.map((m) => m.id));
  for (const id of mealPlanIdsA) {
    assert.ok(!mealPlanIdsB.has(id), `User B export unexpectedly contained User A meal plan ID: ${id}`);
  }
});

test('5. Empty account export succeeds cleanly with empty collections', async (t) => {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    t.skip('Service role key not configured. Skipping empty account test.');
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const timestamp = Date.now();
  const disposableEmail = `disposable-export-empty-${timestamp}@example.com`;
  const disposablePassword = `DisposableExport-${timestamp}!`;

  // 1. Create fresh empty account
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: disposableEmail,
    password: disposablePassword,
    email_confirm: true,
  });
  assert.ifError(createErr);
  const disposableId = created.user.id;

  try {
    // 2. Sign in as disposable user
    const { data: disposableAuth, error: signinErr } = await supabase.auth.signInWithPassword({
      email: disposableEmail,
      password: disposablePassword,
    });
    assert.ifError(signinErr);
    const token = disposableAuth.session.access_token;

    // 3. Export data for empty user
    const res = await fetch(`${BASE_URL}/api/account/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(res.status, 200);
    const cacheControl = res.headers.get('cache-control') || '';
    assert.ok(cacheControl.includes('no-store'), 'Must include no-store');

    const json = await res.json();
    assert.equal(json.metadata.userId, disposableId);
    assert.equal(json.metadata.version, '1.0.0');

    // Collections must be valid empty arrays, not null or missing
    assert.deepEqual(json.workoutPlans, []);
    assert.deepEqual(json.workoutLogs, []);
    assert.deepEqual(json.habits, []);
    assert.deepEqual(json.mealPlans, []);

    // Memory calculator inputs must never be fabricated into saved profile
    if (json.profile) {
      assert.equal(json.profile.age, undefined, 'Must not fabricate age in profile export');
      assert.equal(json.profile.weight, undefined, 'Must not fabricate weight in profile export');
      assert.equal(json.profile.height, undefined, 'Must not fabricate height in profile export');
      assert.equal(json.profile.bmr, undefined, 'Must not fabricate bmr in profile export');
      assert.equal(json.profile.tdee, undefined, 'Must not fabricate tdee in profile export');
    }
  } finally {
    // Clean up disposable test user
    await adminClient.auth.admin.deleteUser(disposableId);
  }
});

test('6. Exported data schema fidelity: structure and contextual nutrient basis', async () => {
  const res = await fetch(`${BASE_URL}/api/account/export`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();

  // Validate meal plan items nutrient context
  for (const plan of json.mealPlans) {
    assert.ok(plan.id);
    assert.ok(plan.name);
    for (const item of plan.items) {
      assert.ok(item.id);
      assert.ok(item.foodId);
      assert.ok(typeof item.quantity === 'number');
      assert.ok(item.quantityUnit);
      if (item.referenceFoodBasis) {
        assert.ok(typeof item.referenceFoodBasis.referenceQuantity === 'number');
        assert.ok(item.referenceFoodBasis.referenceUnit);
      }
    }
  }

  // Validate workout plan structure
  for (const plan of json.workoutPlans) {
    assert.ok(plan.id);
    assert.ok(plan.name);
    assert.ok(Array.isArray(plan.days));
    for (const day of plan.days) {
      assert.ok(day.id);
      assert.ok(Array.isArray(day.entries));
      for (const entry of day.entries) {
        assert.ok(entry.id);
        assert.ok(entry.exerciseId);
      }
    }
  }

  // Validate habit logs
  for (const habit of json.habits) {
    assert.ok(habit.id);
    assert.ok(habit.name);
    assert.ok(Array.isArray(habit.completedDates));
  }
});
