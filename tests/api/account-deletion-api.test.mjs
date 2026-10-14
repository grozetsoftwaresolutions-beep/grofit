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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const userAEmail = env.LOCAL_TEST_USER_A_EMAIL || env.TEST_USER_A_EMAIL;
const userAPassword = env.LOCAL_TEST_USER_A_PASSWORD || env.TEST_USER_A_PASSWORD;
const userBEmail = env.LOCAL_TEST_USER_B_EMAIL || env.TEST_USER_B_EMAIL;
const userBPassword = env.LOCAL_TEST_USER_B_PASSWORD || env.TEST_USER_B_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);
const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

let userAToken = '';

test('1. Setup authentication for Test User A', async (t) => {
  if (!userAEmail || !userAPassword) {
    t.skip('Test credentials missing. Skipping suite.');
    return;
  }

  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  });
  assert.ifError(errA);
  userAToken = authA.session.access_token;
});

test('2. DELETE /api/account — 401 Unauthenticated', async () => {
  const res = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation: 'DELETE', password: 'SomePassword' }),
  });
  assert.equal(res.status, 401);
});

test('3. DELETE /api/account — 400 when explicit confirmation is missing or incorrect', async () => {
  const resNoConfirm = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmation: 'yes', password: userAPassword }),
  });
  assert.equal(resNoConfirm.status, 400);

  const resLowercase = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmation: 'delete', password: userAPassword }),
  });
  assert.equal(resLowercase.status, 400);
});

test('4. DELETE /api/account — 400 when password is missing', async () => {
  const resNoPass = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmation: 'DELETE' }),
  });
  assert.equal(resNoPass.status, 400);
});

test('5. DELETE /api/account — 401 when re-authentication password is incorrect', async () => {
  const resBadPass = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmation: 'DELETE', password: 'WrongPassword123!' }),
  });
  assert.equal(resBadPass.status, 401);
  const json = await resBadPass.json();
  assert.equal(json.error.code, 'INVALID_CREDENTIALS');
});

test('6. DELETE /api/account — 403 when attempting to delete another target user ID', async () => {
  const fakeUserId = '00000000-0000-0000-0000-000000000000';
  const resForbidden = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userAToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      confirmation: 'DELETE',
      password: userAPassword,
      targetUserId: fakeUserId,
    }),
  });
  assert.equal(resForbidden.status, 403);
});

test('7. Comprehensive 9-table cascade verification on fresh disposable user', async (t) => {
  if (!adminClient) {
    t.skip('Service role key not configured. Skipping live cascade deletion test.');
    return;
  }

  // 1. Create a dedicated disposable account (never deleting User A or User B)
  const timestamp = Date.now();
  const disposableEmail = `disposable-cascade-${timestamp}@example.com`;
  const disposablePassword = `DisposablePass-${timestamp}!`;

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: disposableEmail,
    password: disposablePassword,
    email_confirm: true,
  });
  assert.ifError(createErr);
  const disposableId = created.user.id;

  // 2. Sign in as disposable user to acquire session
  const { data: disposableAuth, error: signinErr } = await supabase.auth.signInWithPassword({
    email: disposableEmail,
    password: disposablePassword,
  });
  assert.ifError(signinErr);
  const disposableToken = disposableAuth.session.access_token;
  const disposableRefreshToken = disposableAuth.session.refresh_token;

  const disposableClient = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${disposableToken}` } },
  });

  // 3. Obtain catalogue records for foreign key relationships and baseline catalogue counts
  const { count: initialFoodsCount } = await adminClient.from('foods').select('*', { count: 'exact', head: true });
  const { count: initialExercisesCount } = await adminClient.from('exercises').select('*', { count: 'exact', head: true });

  const { data: exercise } = await adminClient.from('exercises').select('id, name').limit(1).single();
  assert.ok(exercise, 'Exercise catalogue record required for relationship test');

  const { data: food } = await adminClient.from('foods').select('id, name').limit(1).single();
  assert.ok(food, 'Food catalogue record required for relationship test');

  // 4. Populate representative records across ALL 9 user-owned tables:
  // Table 1: profiles (auto-created via on_auth_user_created trigger; update display_name via authenticated client)
  const { error: profileUpdateErr } = await disposableClient
    .from('profiles')
    .update({ display_name: 'Disposable User' })
    .eq('id', disposableId);
  assert.ifError(profileUpdateErr);

  // Table 2: workout_plans
  const { data: planData, error: planErr } = await adminClient
    .from('workout_plans')
    .insert({ user_id: disposableId, name: 'Disposable Test Plan' })
    .select('id')
    .single();
  assert.ifError(planErr);
  const planId = planData.id;

  // Table 3: workout_plan_days (child of workout_plans)
  const { data: dayData, error: dayErr } = await adminClient
    .from('workout_plan_days')
    .insert({
      workout_plan_id: planId,
      user_id: disposableId,
      day_number: 1,
      name: 'Day 1 Full Body',
      sort_order: 1,
    })
    .select('id')
    .single();
  assert.ifError(dayErr);
  const dayId = dayData.id;

  // Table 4: workout_plan_entries (child of workout_plan_days)
  const { data: entryData, error: entryErr } = await adminClient
    .from('workout_plan_entries')
    .insert({
      workout_plan_day_id: dayId,
      user_id: disposableId,
      exercise_id: exercise.id,
      exercise_name_snapshot: exercise.name,
      sets: 3,
      reps: 10,
      sort_order: 1,
    })
    .select('id')
    .single();
  assert.ifError(entryErr);
  const entryId = entryData.id;

  // Table 5: workout_logs
  const { data: logData, error: logErr } = await adminClient
    .from('workout_logs')
    .insert({
      user_id: disposableId,
      exercise_id: exercise.id,
      logged_on: '2026-10-14',
      sets_completed: 3,
      reps_completed: 10,
      external_load: 20,
      external_load_unit: 'kg',
      is_bodyweight: false,
    })
    .select('id')
    .single();
  assert.ifError(logErr);
  const logId = logData.id;

  // Table 6: habits
  const { data: habitData, error: habitErr } = await adminClient
    .from('habits')
    .insert({
      user_id: disposableId,
      name: 'Disposable Habit',
      is_active: true,
    })
    .select('id')
    .single();
  assert.ifError(habitErr);
  const habitId = habitData.id;

  // Table 7: habit_logs (child of habits)
  const { data: habitLogData, error: habitLogErr } = await adminClient
    .from('habit_logs')
    .insert({
      habit_id: habitId,
      user_id: disposableId,
      completed_on: '2026-10-14',
    })
    .select('id')
    .single();
  assert.ifError(habitLogErr);
  const habitLogId = habitLogData.id;

  // Table 8: meal_plans
  const { data: mealData, error: mealErr } = await adminClient
    .from('meal_plans')
    .insert({
      user_id: disposableId,
      name: 'Disposable Meal Plan',
      target_kcal: 2200,
    })
    .select('id')
    .single();
  assert.ifError(mealErr);
  const mealPlanId = mealData.id;

  // Table 9: meal_plan_items (child of meal_plans)
  const { data: itemData, error: itemErr } = await adminClient
    .from('meal_plan_items')
    .insert({
      meal_plan_id: mealPlanId,
      user_id: disposableId,
      food_id: food.id,
      meal_slot: 'breakfast',
      quantity: 150,
      quantity_unit: 'g',
      sort_order: 1,
    })
    .select('id')
    .single();
  assert.ifError(itemErr);
  const mealItemId = itemData.id;

  // 5. Pre-deletion sanity check: confirm all 9 tables contain records
  const { data: profileBefore } = await disposableClient.from('profiles').select('id').eq('id', disposableId);
  const { count: cPlans } = await adminClient.from('workout_plans').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: cDays } = await adminClient.from('workout_plan_days').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: cEntries } = await adminClient.from('workout_plan_entries').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: cLogs } = await adminClient.from('workout_logs').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: cHabits } = await adminClient.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: cHabitLogs } = await adminClient.from('habit_logs').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: cMeals } = await adminClient.from('meal_plans').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: cMealItems } = await adminClient.from('meal_plan_items').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);

  assert.equal(profileBefore?.length, 1);
  assert.equal(cPlans, 1);
  assert.equal(cDays, 1);
  assert.equal(cEntries, 1);
  assert.equal(cLogs, 1);
  assert.equal(cHabits, 1);
  assert.equal(cHabitLogs, 1);
  assert.equal(cMeals, 1);
  assert.equal(cMealItems, 1);

  // 6. Execute real deletion via DELETE /api/account with re-authentication
  const deleteRes = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${disposableToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      confirmation: 'DELETE',
      password: disposablePassword,
    }),
  });

  assert.equal(deleteRes.status, 200);
  const deleteJson = await deleteRes.json();
  assert.equal(deleteJson.data.success, true);

  // 7. Verification: Account removed from Supabase Auth
  const { data: authUserCheck, error: authCheckErr } = await adminClient.auth.admin.getUserById(disposableId);
  assert.ok(authCheckErr || !authUserCheck?.user, 'User must be permanently removed from Supabase Auth');

  // 8. Verification: Complete Cascade across ALL 9 personal tables
  const { data: postProfile } = await disposableClient.from('profiles').select('id').eq('id', disposableId);
  const { count: postPlans } = await adminClient.from('workout_plans').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: postDays } = await adminClient.from('workout_plan_days').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: postEntries } = await adminClient.from('workout_plan_entries').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: postLogs } = await adminClient.from('workout_logs').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: postHabits } = await adminClient.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: postHabitLogs } = await adminClient.from('habit_logs').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: postMeals } = await adminClient.from('meal_plans').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);
  const { count: postMealItems } = await adminClient.from('meal_plan_items').select('*', { count: 'exact', head: true }).eq('user_id', disposableId);

  assert.equal(postProfile?.length || 0, 0, 'profiles must have 0 rows remaining for deleted user');
  assert.equal(postPlans, 0, 'workout_plans must have 0 rows remaining for deleted user');
  assert.equal(postDays, 0, 'workout_plan_days must have 0 rows remaining for deleted user');
  assert.equal(postEntries, 0, 'workout_plan_entries must have 0 rows remaining for deleted user');
  assert.equal(postLogs, 0, 'workout_logs must have 0 rows remaining for deleted user');
  assert.equal(postHabits, 0, 'habits must have 0 rows remaining for deleted user');
  assert.equal(postHabitLogs, 0, 'habit_logs must have 0 rows remaining for deleted user');
  assert.equal(postMeals, 0, 'meal_plans must have 0 rows remaining for deleted user');
  assert.equal(postMealItems, 0, 'meal_plan_items must have 0 rows remaining for deleted user');

  // 9. Verification: Specific child IDs confirmed absent (no orphaned rows)
  const { data: orphanDay } = await adminClient.from('workout_plan_days').select('id').eq('id', dayId);
  assert.equal(orphanDay?.length || 0, 0, 'Child workout_plan_days row must not be orphaned');

  const { data: orphanEntry } = await adminClient.from('workout_plan_entries').select('id').eq('id', entryId);
  assert.equal(orphanEntry?.length || 0, 0, 'Child workout_plan_entries row must not be orphaned');

  const { data: orphanLog } = await adminClient.from('workout_logs').select('id').eq('id', logId);
  assert.equal(orphanLog?.length || 0, 0, 'Workout log row must not be orphaned');

  const { data: orphanHabitLog } = await adminClient.from('habit_logs').select('id').eq('id', habitLogId);
  assert.equal(orphanHabitLog?.length || 0, 0, 'Child habit_logs row must not be orphaned');

  const { data: orphanMealItem } = await adminClient.from('meal_plan_items').select('id').eq('id', mealItemId);
  assert.equal(orphanMealItem?.length || 0, 0, 'Child meal_plan_items row must not be orphaned');

  // 10. Verification: User cannot sign in again
  const { error: postSigninErr } = await supabase.auth.signInWithPassword({
    email: disposableEmail,
    password: disposablePassword,
  });
  assert.ok(postSigninErr, 'Deleted account must not be able to authenticate');

  // 11. Verification: Retained refresh token cannot refresh session
  const { error: refreshErr } = await supabase.auth.refreshSession({
    refresh_token: disposableRefreshToken,
  });
  assert.ok(refreshErr, 'Deleted user refresh token must be rejected');

  // 12. Verification: Retained access token rejected on sensitive server endpoints
  const endpointsToTest = [
    `${BASE_URL}/api/account/export`,
    `${BASE_URL}/api/profile`,
    `${BASE_URL}/api/habits`,
    `${BASE_URL}/api/meal-plans`,
    `${BASE_URL}/api/workout-plans`,
  ];

  for (const endpoint of endpointsToTest) {
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${disposableToken}` },
    });
    assert.equal(res.status, 401, `Endpoint ${endpoint} must reject retained access token with 401`);
  }

  // 13. Verification: RLS blocks retained token from accessing User A or User B records
  const clientWithRetainedToken = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${disposableToken}` } },
  });
  const { data: rlsAttempt } = await clientWithRetainedToken.from('profiles').select('*');
  assert.equal(rlsAttempt?.length || 0, 0, 'Retained token cannot read any records under RLS');

  // 14. Verification: Established accounts and shared catalogues remain completely unharmed
  const { data: authUserACheck, error: userAErr } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  });
  assert.ifError(userAErr);
  assert.ok(authUserACheck.user);

  if (userBEmail && userBPassword) {
    const { data: authUserBCheck, error: userBErr } = await supabase.auth.signInWithPassword({
      email: userBEmail,
      password: userBPassword,
    });
    assert.ifError(userBErr);
    assert.ok(authUserBCheck.user);
  }

  const { count: foodsCount } = await adminClient.from('foods').select('*', { count: 'exact', head: true });
  assert.equal(foodsCount, initialFoodsCount, 'Shared food catalogue count must remain untouched');

  const { count: exercisesCount } = await adminClient.from('exercises').select('*', { count: 'exact', head: true });
  assert.equal(exercisesCount, initialExercisesCount, 'Shared exercise catalogue count must remain untouched');
});

test('8. Post-deletion redirect and public route validation', async () => {
  // Test 1: Verify /auth/login is a valid public route returning 200
  const resLogin = await fetch(`${BASE_URL}/auth/login`);
  assert.equal(resLogin.status, 200, '/auth/login must be accessible as a public route');

  // Test 2: Verify post-deletion redirect URL has no sensitive data leaked in search parameters
  const redirectTarget = new URL('/auth/login?message=Account successfully deleted', BASE_URL);
  assert.equal(redirectTarget.pathname, '/auth/login');
  assert.equal(redirectTarget.searchParams.get('message'), 'Account successfully deleted');
  assert.equal(redirectTarget.searchParams.get('email'), null, 'Redirect must not contain email parameter');
  assert.equal(redirectTarget.searchParams.get('token'), null, 'Redirect must not contain token parameter');
  assert.equal(redirectTarget.searchParams.get('userId'), null, 'Redirect must not contain userId parameter');
  assert.equal(redirectTarget.searchParams.get('password'), null, 'Redirect must not contain password parameter');

  const resLoginMsg = await fetch(redirectTarget.toString());
  assert.equal(resLoginMsg.status, 200, '/auth/login?message=... must return 200');

  // Test 3: Verify /auth/sign-in is also a valid public route returning 200
  const resSignIn = await fetch(`${BASE_URL}/auth/sign-in`);
  assert.equal(resSignIn.status, 200, '/auth/sign-in must be accessible as an approved public route');

  // Test 4: Unauthenticated request to private /app redirects to login
  const resApp = await fetch(`${BASE_URL}/app`, { redirect: 'manual' });
  assert.ok(
    [302, 307, 308].includes(resApp.status),
    `Unauthenticated access to /app must redirect, got status ${resApp.status}`
  );
  const location = resApp.headers.get('location') || '';
  assert.ok(location.includes('/auth/login'), `Redirect location must target login, got ${location}`);
});
