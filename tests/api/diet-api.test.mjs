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
let testPlanId = '';
let testItemId = '';
let ponniRiceId = 'f1000000-0000-0000-0000-000000000001';
let incompleteFoodId = 'f1000000-0000-0000-0000-000000000025';

test('1. Authenticate Test Users A and B', async (t) => {
  if (!userAEmail || !userBEmail) {
    t.skip('Test credentials missing. Skipping suite.');
    return;
  }

  // Check if Phase 6 schema is present
  const { error: probeErr } = await supabase.from('meal_plans').select('id').limit(1);
  if (probeErr && (probeErr.code === '42P01' || probeErr.message?.includes('does not exist'))) {
    console.log('\n⚠️  [BLOCKED] Phase 6 schema (meal_plans) is not applied on this database.');
    console.log('   Tests requiring Phase 6 schema will be skipped until migration is applied.\n');
    t.skip('Phase 6 schema not applied on database.');
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

test('2. GET /api/foods — Returns published food catalogue with source metadata', async () => {
  const res = await fetch(`${BASE_URL}/api/foods`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.data), 'Catalogue response must be an array');
  assert.ok(json.data.length >= 20, 'Catalogue must include at least 20 verified foods');

  const ponni = json.data.find((f) => f.id === ponniRiceId);
  assert.ok(ponni, 'Ponni boiled rice must be present in catalogue');
  assert.equal(ponni.name, 'Cooked White Rice (Ponni)');
  assert.equal(ponni.sourceName, 'IFCT_2017');
  assert.equal(ponni.referenceQuantity, 100);
  assert.equal(ponni.referenceUnit, 'g');
  assert.equal(ponni.energyKcal, 130);
  assert.equal(ponni.proteinG, 2.7);
  assert.equal(ponni.fibreG, 0.4);
});

test('3. GET /api/foods — Search and category filters', async () => {
  const resQuery = await fetch(`${BASE_URL}/api/foods?query=idli`);
  assert.equal(resQuery.status, 200);
  const jsonQuery = await resQuery.json();
  assert.ok(jsonQuery.data.length >= 1, 'Search query for idli must return matches');
  assert.ok(jsonQuery.data.some((f) => f.name.toLowerCase().includes('idli')));

  const resCat = await fetch(`${BASE_URL}/api/foods?category=dairy`);
  assert.equal(resCat.status, 200);
  const jsonCat = await resCat.json();
  assert.ok(jsonCat.data.length >= 1);
  assert.ok(jsonCat.data.every((f) => f.category === 'dairy'));
});

test('4. GET /api/foods/[foodId] — Full details and legitimate zero values preservation', async () => {
  const eggWhiteId = 'f1000000-0000-0000-0000-000000000017';
  const res = await fetch(`${BASE_URL}/api/foods/${eggWhiteId}`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.id, eggWhiteId);
  assert.equal(json.data.name, 'Boiled Egg White');
  assert.equal(json.data.sourceName, 'USDA_FDC');
  assert.equal(json.data.energyKcal, 52);
  assert.equal(json.data.fatG, 0.2); // valid low/zero preserved
  assert.equal(json.data.fibreG, 0.0); // legitimate zero preserved
});

test('5. Data-quality audit: Synthetic test fixtures are excluded from published catalogue', async () => {
  const res = await fetch(`${BASE_URL}/api/foods`);
  assert.equal(res.status, 200);
  const json = await res.json();
  const synthetic = json.data.find((f) => f.id === incompleteFoodId);
  assert.equal(synthetic, undefined, 'Synthetic test fixture must NOT be in published production catalogue');
});

test('6. GET /api/foods/[foodId] — Input validation on path ID', async () => {
  const resInvalid = await fetch(`${BASE_URL}/api/foods/invalid-uuid-format`);
  assert.equal(resInvalid.status, 400);

  const resNotFound = await fetch(`${BASE_URL}/api/foods/00000000-0000-0000-0000-999999999999`);
  assert.equal(resNotFound.status, 404);
});

test('7. POST /api/meal-plans — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized Plan' }),
  });
  assert.equal(res.status, 401);
});

test('8. POST /api/meal-plans — User A creates a valid personal meal plan', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Tamil Nadu Weight Loss Plan',
      targetKcal: 1800,
    }),
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.ok(json.data?.id);
  assert.equal(json.data.name, 'Tamil Nadu Weight Loss Plan');
  assert.equal(json.data.targetKcal, 1800);
  testPlanId = json.data.id;
});

test('9. POST /api/meal-plans — Input validation rejects empty names', async () => {
  const resEmpty = await fetch(`${BASE_URL}/api/meal-plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: '   ' }),
  });
  assert.equal(resEmpty.status, 400);
});

test('10. GET /api/meal-plans — User A lists personal plans', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.data));
  const plan = json.data.find((p) => p.id === testPlanId);
  assert.ok(plan, 'Created plan must be listed for owner');
});

test('11. POST /api/meal-plans/[id]/items — User A adds items with portion scaling', async () => {
  // Add 150g of Ponni rice to lunch (1.5x reference of 100g)
  const res = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      foodId: ponniRiceId,
      mealSlot: 'lunch',
      quantity: 150,
      quantityUnit: 'g',
      sortOrder: 1,
    }),
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.ok(json.data?.id);
  testItemId = json.data.id;
  assert.equal(json.data.mealSlot, 'lunch');
  assert.equal(json.data.quantity, 150);
  assert.equal(json.data.quantityUnit, 'g');
  assert.equal(json.data.scaledNutrients.energyKcal, 195); // 130 * 1.5 = 195
  assert.ok(
    json.data.scaledNutrients.proteinG === 4.1 || json.data.scaledNutrients.proteinG === 4.05,
    `Expected proteinG to be 4.1 (rounded) or 4.05, got ${json.data.scaledNutrients.proteinG}`
  );
});

test('12. POST /api/meal-plans/[id]/items — Validation rejects invalid portions and slots', async () => {
  const resNegative = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      foodId: ponniRiceId,
      mealSlot: 'lunch',
      quantity: -50,
      quantityUnit: 'g',
    }),
  });
  assert.equal(resNegative.status, 400);

  const resInvalidSlot = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      foodId: ponniRiceId,
      mealSlot: 'brunch_unsupported',
      quantity: 100,
      quantityUnit: 'g',
    }),
  });
  assert.equal(resInvalidSlot.status, 400);
});

test('13. GET /api/meal-plans/[id] — Calculates slot totals and target comparison', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(res.status, 200);
  const json = await res.json();

  assert.equal(json.data.id, testPlanId);
  assert.equal(json.data.items.length, 1);
  assert.equal(json.data.slotTotals.lunch.energyKcal, 195);
  assert.equal(json.data.dailyTotals.energyKcal, 195);
  assert.equal(json.data.targetComparison.canCompare, true);
  assert.equal(json.data.targetComparison.differenceKcal, -1605); // 195 - 1800 = -1605
  assert.equal(json.data.targetComparison.isExactToleranceClaimed, false);
});

test('14. Cross-user isolation: User B cannot view User A meal plan via API', async () => {
  const resForbidden = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  assert.equal(resForbidden.status, 404, 'User B must not see User A meal plan');
});

test('15. PATCH /api/meal-plans/[id]/items/[itemId] — User A updates portion', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}/items/${testItemId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quantity: 200,
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.quantity, 200);
});

test('16. PATCH /api/meal-plans/[id] — User A renames meal plan', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Tamil Nadu Fitness Meal Plan (Updated)',
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.name, 'Tamil Nadu Fitness Meal Plan (Updated)');
});

test('17. DELETE /api/meal-plans/[id]/items/[itemId] — Removes item without deleting shared food', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}/items/${testItemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.ok([200, 204].includes(res.status), `Expected 200 or 204, got ${res.status}`);

  // Verify referenced food is NOT deleted
  const foodCheck = await fetch(`${BASE_URL}/api/foods/${ponniRiceId}`);
  assert.equal(foodCheck.status, 200, 'Shared food catalogue record must remain intact');
});

test('18. DELETE /api/meal-plans/[id] — Deletes personal meal plan', async () => {
  const res = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.ok([200, 204].includes(res.status), `Expected 200 or 204, got ${res.status}`);

  // Subsequent fetch must return 404
  const resCheck = await fetch(`${BASE_URL}/api/meal-plans/${testPlanId}`, {
    headers: { Authorization: `Bearer ${userAToken}` },
  });
  assert.equal(resCheck.status, 404);
});
