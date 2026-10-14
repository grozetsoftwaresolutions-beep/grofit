import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// Initialize in-memory PGlite PostgreSQL instance
let db;
const userAId = 'a1111111-1111-1111-1111-111111111111';
const userBId = 'b2222222-2222-2222-2222-222222222222';
const ponniRiceId = 'f1000000-0000-0000-0000-000000000001';
const eggWhiteId = 'f1000000-0000-0000-0000-000000000017';
let testPlanAId = '';
let testItemAId = '';

test.before(async () => {
  db = new PGlite();

  // Create base Supabase roles and auth schema
  await db.exec(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
      END IF;
    END $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Insert mock test users A and B
    INSERT INTO auth.users (id, email) VALUES
      ('${userAId}', 'testuser-a@local.dev'),
      ('${userBId}', 'testuser-b@local.dev')
    ON CONFLICT (id) DO NOTHING;

    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
      SELECT COALESCE(current_setting('request.jwt.claim.role', true), 'anon');
    $$ LANGUAGE sql STABLE;
  `);

  // Apply complete migration chain in sequence
  const migrations = [
    '20261010000000_initial_schema.sql',
    '20261013000000_phase3_workout_content.sql',
    '20261013120000_phase4_workout_progress.sql',
    '20261013140000_phase5_habit_tracker.sql',
    '20261014000000_phase6_diet_foods.sql'
  ];

  for (const mig of migrations) {
    const filePath = resolve(process.cwd(), 'supabase', 'migrations', mig);
    const sql = readFileSync(filePath, 'utf-8');
    await db.exec(sql);
  }
});

test('1. Migration Chain: Phase 6 tables exist with correct columns and types', async () => {
  const tablesRes = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('foods', 'meal_plans', 'meal_plan_items')
    ORDER BY table_name;
  `);
  const names = tablesRes.rows.map(r => r.table_name);
  assert.deepEqual(names, ['foods', 'meal_plan_items', 'meal_plans']);
});

test('2. Schema Constraints: Primary keys, composite unique constraint, and composite foreign key', async () => {
  // Check composite unique constraint on meal_plans(id, user_id)
  const uqRes = await db.query(`
    SELECT conname, contype 
    FROM pg_constraint 
    WHERE conname = 'uq_meal_plans_id_user';
  `);
  assert.equal(uqRes.rows.length, 1);
  assert.equal(uqRes.rows[0].contype, 'u'); // unique

  // Check composite FK on meal_plan_items(meal_plan_id, user_id)
  const fkRes = await db.query(`
    SELECT conname, confdeltype 
    FROM pg_constraint 
    WHERE conname = 'fk_meal_plan_items_plan_owner';
  `);
  assert.equal(fkRes.rows.length, 1);
  assert.equal(fkRes.rows[0].confdeltype, 'c'); // 'c' = CASCADE

  // Check food_id foreign key with RESTRICT
  const foodFkRes = await db.query(`
    SELECT confdeltype 
    FROM pg_constraint 
    WHERE conrelid = 'public.meal_plan_items'::regclass 
      AND confrelid = 'public.foods'::regclass;
  `);
  assert.equal(foodFkRes.rows.length, 1);
  assert.equal(foodFkRes.rows[0].confdeltype, 'r'); // 'r' = RESTRICT
});

test('3. Row Level Security: RLS is enabled on all Phase 6 tables', async () => {
  const rlsRes = await db.query(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname IN ('foods', 'meal_plans', 'meal_plan_items')
    ORDER BY relname;
  `);
  assert.equal(rlsRes.rows.length, 3);
  for (const row of rlsRes.rows) {
    assert.equal(row.relrowsecurity, true, `RLS must be enabled on ${row.relname}`);
  }
});

test('4. Seed Data: Exactly 24 verified production food records exist', async () => {
  const countRes = await db.query(`SELECT COUNT(*)::int as count FROM public.foods;`);
  assert.equal(countRes.rows[0].count, 24, 'Production food catalogue must contain exactly 24 records');

  // Verify all 24 are active
  const activeRes = await db.query(`SELECT COUNT(*)::int as count FROM public.foods WHERE is_active = true;`);
  assert.equal(activeRes.rows[0].count, 24);
});

test('5. Data Quality: Synthetic Kashayam fixture is ABSENT from production database', async () => {
  const synthRes = await db.query(`
    SELECT COUNT(*)::int as count 
    FROM public.foods 
    WHERE id = 'f1000000-0000-0000-0000-000000000025' 
       OR name ILIKE '%Kashayam%';
  `);
  assert.equal(synthRes.rows[0].count, 0, 'Synthetic test fixture must NOT exist in production seeds');
});

test('6. Provenance & Analytical Precision: IFCT 2017 & USDA FDC counts and zero/null preservation', async () => {
  const ifctRes = await db.query(`SELECT COUNT(*)::int as count FROM public.foods WHERE source_name = 'IFCT_2017';`);
  assert.equal(ifctRes.rows[0].count, 21, 'Must have 21 IFCT 2017 records');

  const usdaRes = await db.query(`SELECT COUNT(*)::int as count FROM public.foods WHERE source_name = 'USDA_FDC';`);
  assert.equal(usdaRes.rows[0].count, 3, 'Must have 3 USDA FDC fallback records');

  // Verify Boiled Egg White preserves legitimate zeroes
  const eggRes = await db.query(`
    SELECT name, energy_kcal, fat_g, fibre_g 
    FROM public.foods 
    WHERE id = '${eggWhiteId}';
  `);
  assert.equal(eggRes.rows.length, 1);
  assert.equal(Number(eggRes.rows[0].energy_kcal), 52);
  assert.equal(Number(eggRes.rows[0].fat_g), 0.2);
  assert.equal(Number(eggRes.rows[0].fibre_g), 0.0, 'Legitimate 0.0g fibre must be preserved as 0, not null');

  // Verify Ponni Rice nutrients
  const riceRes = await db.query(`
    SELECT name, energy_kcal, protein_g, carbohydrates_g, fat_g, fibre_g, match_status
    FROM public.foods 
    WHERE id = '${ponniRiceId}';
  `);
  assert.equal(riceRes.rows.length, 1);
  assert.equal(Number(riceRes.rows[0].energy_kcal), 130);
  assert.equal(Number(riceRes.rows[0].protein_g), 2.7);
  assert.equal(riceRes.rows[0].match_status, 'exact');
});

test('7. Composite Ownership Constraint: Cross-user item insertion is rejected', async () => {
  // Step A: User A creates a meal plan
  const planRes = await db.query(`
    INSERT INTO public.meal_plans (user_id, name, target_kcal)
    VALUES ('${userAId}', 'User A Meal Plan', 2000)
    RETURNING id;
  `);
  testPlanAId = planRes.rows[0].id;
  assert.ok(testPlanAId);

  // Step B: User A adds an item to User A's meal plan -> SUCCESS
  const itemRes = await db.query(`
    INSERT INTO public.meal_plan_items (user_id, meal_plan_id, food_id, meal_slot, quantity, quantity_unit, sort_order)
    VALUES ('${userAId}', '${testPlanAId}', '${ponniRiceId}', 'lunch', 150, 'g', 1)
    RETURNING id;
  `);
  testItemAId = itemRes.rows[0].id;
  assert.ok(testItemAId);

  // Step C: User B attempts to attach an item to User A's meal plan (user_id = userB, meal_plan_id = testPlanAId)
  // Must FAIL due to composite foreign key fk_meal_plan_items_plan_owner
  let crossInsertFailed = false;
  try {
    await db.query(`
      INSERT INTO public.meal_plan_items (user_id, meal_plan_id, food_id, meal_slot, quantity, quantity_unit, sort_order)
      VALUES ('${userBId}', '${testPlanAId}', '${ponniRiceId}', 'lunch', 100, 'g', 1);
    `);
  } catch (err) {
    crossInsertFailed = true;
    assert.match(err.message, /fk_meal_plan_items_plan_owner/i);
  }
  assert.ok(crossInsertFailed, 'Composite foreign key must reject cross-user item insertion');
});

test('8. Cascading Deletion: Deleting a meal plan cascades to its child items', async () => {
  // Verify item exists before deletion
  const beforeCount = await db.query(`
    SELECT COUNT(*)::int as count 
    FROM public.meal_plan_items 
    WHERE id = '${testItemAId}';
  `);
  assert.equal(beforeCount.rows[0].count, 1);

  // Delete parent meal plan
  await db.query(`DELETE FROM public.meal_plans WHERE id = '${testPlanAId}';`);

  // Verify child item was automatically cascaded
  const afterCount = await db.query(`
    SELECT COUNT(*)::int as count 
    FROM public.meal_plan_items 
    WHERE id = '${testItemAId}';
  `);
  assert.equal(afterCount.rows[0].count, 0, 'Child items must be CASCADE deleted when meal plan is deleted');
});

test('9. Referential Integrity: Deleting a curated food referenced by a meal plan is RESTRICTED', async () => {
  // Create a new meal plan and item referencing Ponni rice
  const pRes = await db.query(`
    INSERT INTO public.meal_plans (user_id, name, target_kcal)
    VALUES ('${userAId}', 'Curated Food Protection Test', 1800)
    RETURNING id;
  `);
  const planId = pRes.rows[0].id;

  await db.query(`
    INSERT INTO public.meal_plan_items (user_id, meal_plan_id, food_id, meal_slot, quantity, quantity_unit)
    VALUES ('${userAId}', '${planId}', '${ponniRiceId}', 'lunch', 100, 'g');
  `);

  // Attempt to delete Ponni rice from foods catalogue -> Must FAIL due to ON DELETE RESTRICT
  let deleteFoodFailed = false;
  try {
    await db.query(`DELETE FROM public.foods WHERE id = '${ponniRiceId}';`);
  } catch (err) {
    deleteFoodFailed = true;
    assert.match(err.message, /violates.*foreign key constraint/i);
  }
  assert.ok(deleteFoodFailed, 'Deleting a curated food referenced by any meal plan must be REJECTED');

  // Clean up test plan
  await db.query(`DELETE FROM public.meal_plans WHERE id = '${planId}';`);
});

test('10. Direct RLS: User B cannot view, modify, or delete User A meal plan', async () => {
  // Create meal plan for User A
  const pRes = await db.query(`
    INSERT INTO public.meal_plans (user_id, name, target_kcal)
    VALUES ('${userAId}', 'Private User A Plan', 2100)
    RETURNING id;
  `);
  const planAId = pRes.rows[0].id;

  // Switch session context to User B
  await db.exec(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${userBId}';
    SET "request.jwt.claim.role" = 'authenticated';
  `);

  // User B queries meal_plans -> RLS must return 0 rows for User A's plan
  const userBSelect = await db.query(`
    SELECT * FROM public.meal_plans WHERE id = '${planAId}';
  `);
  assert.equal(userBSelect.rows.length, 0, 'User B SELECT on User A meal plan must return 0 rows under RLS');

  // User B attempts to UPDATE User A's plan -> RLS suppresses or modifies 0 rows
  const updateRes = await db.query(`
    UPDATE public.meal_plans 
    SET name = 'Hacked Name' 
    WHERE id = '${planAId}'
    RETURNING id;
  `);
  assert.equal(updateRes.rows.length, 0, 'User B UPDATE on User A plan must modify 0 rows');

  // User B attempts to DELETE User A's plan -> RLS suppresses or deletes 0 rows
  const deleteRes = await db.query(`
    DELETE FROM public.meal_plans 
    WHERE id = '${planAId}'
    RETURNING id;
  `);
  assert.equal(deleteRes.rows.length, 0, 'User B DELETE on User A plan must delete 0 rows');

  // Reset to postgres role to verify plan is unchanged
  await db.exec(`SET ROLE postgres; RESET "request.jwt.claim.sub"; RESET "request.jwt.claim.role";`);
  const checkRes = await db.query(`SELECT name FROM public.meal_plans WHERE id = '${planAId}';`);
  assert.equal(checkRes.rows[0].name, 'Private User A Plan', 'Plan name must remain untouched');

  // Cleanup
  await db.query(`DELETE FROM public.meal_plans WHERE id = '${planAId}';`);
});

test('11. Direct RLS: Anonymous access is denied for meal plans and items', async () => {
  // Set session to anon role
  await db.exec(`
    SET ROLE anon;
    SET "request.jwt.claim.sub" = '';
    SET "request.jwt.claim.role" = 'anon';
  `);

  // Anon SELECT on meal_plans -> Permission denied by GRANT
  let anonSelectFailed = false;
  try {
    await db.query(`SELECT * FROM public.meal_plans;`);
  } catch (err) {
    anonSelectFailed = true;
    assert.match(err.message, /permission denied/i);
  }
  assert.ok(anonSelectFailed, 'Anon SELECT on meal_plans must fail with permission denied');

  // Anon INSERT on meal_plans -> Permission denied by GRANT or RLS
  let anonInsertFailed = false;
  try {
    await db.query(`
      INSERT INTO public.meal_plans (user_id, name) 
      VALUES ('${userAId}', 'Anon Plan');
    `);
  } catch (err) {
    anonInsertFailed = true;
    assert.match(err.message, /permission denied/i);
  }
  assert.ok(anonInsertFailed, 'Anon INSERT on meal_plans must fail with permission denied');

  // Reset role
  await db.exec(`SET ROLE postgres; RESET "request.jwt.claim.sub"; RESET "request.jwt.claim.role";`);
});

test('12. Curated Foods: Read-only for authenticated and anon, modifications blocked', async () => {
  // Set session to authenticated (User A)
  await db.exec(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${userAId}';
    SET "request.jwt.claim.role" = 'authenticated';
  `);

  // Can SELECT foods
  const selectFoods = await db.query(`SELECT id, name FROM public.foods LIMIT 5;`);
  assert.equal(selectFoods.rows.length, 5, 'Authenticated users must be able to read active foods');

  // CANNOT INSERT into foods (GRANT SELECT only)
  let insertFoodFailed = false;
  try {
    await db.query(`
      INSERT INTO public.foods (name, category, reference_quantity, reference_unit, source_name, source_reference)
      VALUES ('Unauthorized Food', 'staples', 100, 'g', 'IFCT_2017', 'Fake');
    `);
  } catch (err) {
    insertFoodFailed = true;
    assert.match(err.message, /permission denied/i);
  }
  assert.ok(insertFoodFailed, 'Ordinary authenticated users must NOT be allowed to insert curated foods');

  // CANNOT UPDATE foods
  let updateFoodFailed = false;
  try {
    await db.query(`
      UPDATE public.foods SET name = 'Tampered' WHERE id = '${ponniRiceId}';
    `);
  } catch (err) {
    updateFoodFailed = true;
    assert.match(err.message, /permission denied/i);
  }
  assert.ok(updateFoodFailed, 'Ordinary authenticated users must NOT be allowed to update curated foods');

  // Reset role
  await db.exec(`SET ROLE postgres; RESET "request.jwt.claim.sub"; RESET "request.jwt.claim.role";`);
});
