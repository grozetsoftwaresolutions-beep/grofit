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

const supabaseUrl = env.LOCAL_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.LOCAL_SUPABASE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const userAEmail = env.LOCAL_TEST_USER_A_EMAIL || env.TEST_USER_A_EMAIL;
const userAPassword = env.LOCAL_TEST_USER_A_PASSWORD || env.TEST_USER_A_PASSWORD;
const userBEmail = env.LOCAL_TEST_USER_B_EMAIL || env.TEST_USER_B_EMAIL;
const userBPassword = env.LOCAL_TEST_USER_B_PASSWORD || env.TEST_USER_B_PASSWORD;

// Independent user-scoped clients (NEVER service role)
const clientAnon = createClient(supabaseUrl, supabaseKey);
const clientA = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
const clientB = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

let userAId = '';
let userBId = '';
let mealPlanAId = '';
let mealPlanItemId = '';
const ponniRiceId = 'f1000000-0000-0000-0000-000000000001';

test('1. Setup user-scoped Supabase client sessions', async (t) => {
  if (!userAEmail || !userBEmail) {
    t.skip('Test credentials missing. Skipping suite.');
    return;
  }

  // Check if Phase 6 schema is present
  const { error: probeErr } = await clientAnon.from('foods').select('id').limit(1);
  if (probeErr && (probeErr.code === '42P01' || probeErr.message?.includes('does not exist'))) {
    console.log('\n⚠️  [BLOCKED] Phase 6 schema (foods) is not applied on this database.');
    console.log('   Tests requiring Phase 6 schema will be skipped until migration is applied.\n');
    t.skip('Phase 6 schema not applied on database.');
    return;
  }

  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  });
  assert.ok(authA?.session, `User A sign in failed: ${errA?.message}`);
  userAId = authA.user.id;

  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: userBEmail,
    password: userBPassword,
  });
  assert.ok(authB?.session, `User B sign in failed: ${errB?.message}`);
  userBId = authB.user.id;
});

test('2. Direct RLS: User A inserts and reads own meal_plan and meal_plan_item', async () => {
  const { data: plan, error: pErr } = await clientA
    .from('meal_plans')
    .insert({
      user_id: userAId,
      name: 'User A RLS Meal Plan',
      target_kcal: 2000,
    })
    .select('id, user_id, name')
    .single();

  assert.ok(!pErr, `User A meal plan insert failed: ${pErr?.message}`);
  assert.equal(plan.user_id, userAId);
  mealPlanAId = plan.id;

  const { data: item, error: iErr } = await clientA
    .from('meal_plan_items')
    .insert({
      user_id: userAId,
      meal_plan_id: mealPlanAId,
      food_id: ponniRiceId,
      meal_slot: 'lunch',
      quantity: 150,
      quantity_unit: 'g',
      sort_order: 1,
    })
    .select('id, user_id, meal_plan_id, food_id')
    .single();

  assert.ok(!iErr, `User A meal plan item insert failed: ${iErr?.message}`);
  assert.equal(item.user_id, userAId);
  assert.equal(item.meal_plan_id, mealPlanAId);
  mealPlanItemId = item.id;
});

test('3. Direct RLS: User B cannot read User A meal plans or items', async () => {
  const { data: plans } = await clientB
    .from('meal_plans')
    .select('id')
    .eq('id', mealPlanAId);
  assert.equal(plans.length, 0, 'User B SELECT on User A meal plan must return 0 rows');

  const { data: items } = await clientB
    .from('meal_plan_items')
    .select('id')
    .eq('meal_plan_id', mealPlanAId);
  assert.equal(items.length, 0, 'User B SELECT on User A meal plan items must return 0 rows');
});

test('4. Direct RLS: User B cannot update or delete User A meal plan', async () => {
  await clientB
    .from('meal_plans')
    .update({ name: 'Hacked by User B' })
    .eq('id', mealPlanAId);
  // RLS suppresses update or returns no modified rows
  const { data: checkPlan } = await clientA
    .from('meal_plans')
    .select('name')
    .eq('id', mealPlanAId)
    .single();
  assert.equal(checkPlan.name, 'User A RLS Meal Plan', 'User A meal plan must not be modified by User B');

  await clientB
    .from('meal_plans')
    .delete()
    .eq('id', mealPlanAId);
  const { data: checkPlanAfterDelete } = await clientA
    .from('meal_plans')
    .select('id')
    .eq('id', mealPlanAId)
    .single();
  assert.ok(checkPlanAfterDelete, 'User A meal plan must not be deleted by User B');
});

test('5. Direct RLS: User B cannot attach an item to User A meal plan', async () => {
  // Attempt with user_id = userBId (composite FK violates ownership since mealPlanA belongs to userA)
  const { error: crossInsertErr } = await clientB
    .from('meal_plan_items')
    .insert({
      user_id: userBId,
      meal_plan_id: mealPlanAId,
      food_id: ponniRiceId,
      meal_slot: 'dinner',
      quantity: 100,
      quantity_unit: 'g',
      sort_order: 1,
    });
  assert.ok(crossInsertErr, 'Attaching item to another user plan must fail at database level');

  // Attempt with forged user_id = userAId (RLS with check auth.uid() = user_id blocks it)
  const { error: forgedErr } = await clientB
    .from('meal_plan_items')
    .insert({
      user_id: userAId,
      meal_plan_id: mealPlanAId,
      food_id: ponniRiceId,
      meal_slot: 'dinner',
      quantity: 100,
      quantity_unit: 'g',
      sort_order: 1,
    });
  assert.ok(forgedErr, 'Forged user_id on item insert must be blocked by RLS');
});

test('6. Direct RLS: Anonymous access is denied for meal plans and items', async () => {
  const { data: anonPlans } = await clientAnon
    .from('meal_plans')
    .select('id');
  assert.ok(anonPlans === null || anonPlans.length === 0, 'Anonymous users cannot read meal plans');

  const { error: anonInsertErr } = await clientAnon
    .from('meal_plans')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Anon Plan',
    });
  assert.ok(anonInsertErr, 'Anonymous users cannot create meal plans');
});

test('7. Curated foods table: Read-only for authenticated and anon users', async () => {
  // Both can read active foods
  const { data: foodsA, error: fErrA } = await clientA
    .from('foods')
    .select('id, name')
    .limit(5);
  assert.ok(!fErrA, 'User A must be able to read foods catalogue');
  assert.ok(foodsA.length > 0);

  // Authenticated users CANNOT insert new food
  const { error: insertFoodErr } = await clientA
    .from('foods')
    .insert({
      name: 'Unauthorized User Food',
      category: 'staples',
      reference_quantity: 100,
      reference_unit: 'g',
      source_name: 'Fabricated',
      source_reference: 'Fake',
    });
  assert.ok(insertFoodErr, 'Normal authenticated users must NOT be allowed to insert curated foods');

  // Authenticated users CANNOT update food
  await clientA
    .from('foods')
    .update({ name: 'Tampered Name' })
    .eq('id', ponniRiceId);
  // Either error or 0 rows modified
  const { data: ponniCheck } = await clientA
    .from('foods')
    .select('name')
    .eq('id', ponniRiceId)
    .single();
  assert.equal(ponniCheck.name, 'Cooked White Rice (Ponni)');
});

test('8. Referential Integrity: Deleting a curated food referenced by a meal plan is rejected (ON DELETE RESTRICT)', async (t) => {
  if (!userAId || !mealPlanItemId) {
    t.skip('Requires active meal plan item');
    return;
  }

  // Attempt to delete Ponni Rice while mealPlanItemId references it
  const { error: delFoodErr } = await clientA
    .from('foods')
    .delete()
    .eq('id', ponniRiceId);

  assert.ok(delFoodErr, 'Deleting referenced curated food must fail');

  // Check that food remains present
  const { data: foodCheck } = await clientA
    .from('foods')
    .select('id, name')
    .eq('id', ponniRiceId)
    .single();
  assert.ok(foodCheck, 'Curated food must remain intact in catalogue');
});

test('9. Cleanup: User A deletes meal plan, cascade removes item, food remains', async () => {
  const { error: delErr } = await clientA
    .from('meal_plans')
    .delete()
    .eq('id', mealPlanAId);
  assert.ok(!delErr, `User A meal plan delete failed: ${delErr?.message}`);

  const { data: checkItem } = await clientA
    .from('meal_plan_items')
    .select('id')
    .eq('id', mealPlanItemId);
  assert.equal(checkItem.length, 0, 'Cascade delete must remove meal plan items');

  const { data: checkFood } = await clientA
    .from('foods')
    .select('id')
    .eq('id', ponniRiceId)
    .single();
  assert.ok(checkFood, 'Referenced food must NOT be deleted');
});
