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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;

// Create independent user-scoped clients (ordinary sessions, publishable key, NEVER service role)
const clientAnon = createClient(supabaseUrl, supabaseKey);
const clientA = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
const clientB = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

let userAId = '';
let userBId = '';
let exerciseId = '';
let userARowId = '';

test('1. Setup user-scoped Supabase client sessions', async () => {
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: env.TEST_USER_A_EMAIL,
    password: env.TEST_USER_A_PASSWORD,
  });
  assert.ok(authA?.session, `User A sign in failed: ${errA?.message}`);
  userAId = authA.user.id;

  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: env.TEST_USER_B_EMAIL,
    password: env.TEST_USER_B_PASSWORD,
  });
  assert.ok(authB?.session, `User B sign in failed: ${errB?.message}`);
  userBId = authB.user.id;
  assert.notEqual(userBId, userAId, 'User A and User B must have distinct user IDs');

  const { data: exercises, error: exErr } = await clientA
    .from('exercises')
    .select('id')
    .limit(1);
  assert.ok(!exErr && exercises?.length > 0);
  exerciseId = exercises[0].id;
});

test('2. Direct RLS: User A inserts and reads own workout_log', async () => {
  const { data, error } = await clientA
    .from('workout_logs')
    .insert({
      user_id: userAId,
      exercise_id: exerciseId,
      logged_on: '2026-10-10',
      sets_completed: 4,
      reps_completed: 12,
      external_load: 40,
      external_load_unit: 'kg',
      is_bodyweight: false,
      notes: 'Direct RLS test log',
    })
    .select('id, user_id, external_load')
    .single();

  assert.ok(!error, `User A insert failed: ${error?.message}`);
  assert.ok(data?.id);
  assert.equal(data.user_id, userAId);
  userARowId = data.id;

  const { data: readData, error: readErr } = await clientA
    .from('workout_logs')
    .select('id, external_load')
    .eq('id', userARowId)
    .single();

  assert.ok(!readErr);
  assert.equal(readData.id, userARowId);
});

test('3. Direct RLS: User B is blocked from reading User A row', async () => {
  const { data, error } = await clientB
    .from('workout_logs')
    .select('id')
    .eq('id', userARowId);

  // In Supabase RLS, SELECT query on unauthorized row returns empty array [] with 0 rows
  assert.ok(!error);
  assert.equal(data.length, 0, 'User B SELECT must return 0 rows for User A row');
});

test('4. Direct RLS: User B is blocked from updating User A row', async () => {
  const { data, error } = await clientB
    .from('workout_logs')
    .update({ notes: 'Tampered by User B' })
    .eq('id', userARowId)
    .select();

  // RLS blocks update; 0 rows affected
  assert.ok(!error);
  assert.equal(data?.length || 0, 0, 'User B UPDATE must affect 0 rows on User A row');
});

test('5. Direct RLS: User B is blocked from inserting row with User A identity', async () => {
  const { data, error } = await clientB
    .from('workout_logs')
    .insert({
      user_id: userAId, // Forged identity
      exercise_id: exerciseId,
      logged_on: '2026-10-11',
      is_bodyweight: true,
    })
    .select();

  // RLS WITH CHECK policy (auth.uid() = user_id) must reject the insert
  assert.ok(error, 'User B insert with userAId MUST be rejected by RLS');
  assert.equal(data, null);
});

test('6. Direct RLS: User B is blocked from deleting User A row', async () => {
  const { data, error } = await clientB
    .from('workout_logs')
    .delete()
    .eq('id', userARowId)
    .select();

  // RLS blocks delete; 0 rows affected
  assert.ok(!error);
  assert.equal(data?.length || 0, 0, 'User B DELETE must affect 0 rows on User A row');
});

test('7. Direct RLS: Anonymous access to workout_logs is denied', async () => {
  const { data: anonSelect, error: anonSelectErr } = await clientAnon
    .from('workout_logs')
    .select('id');

  // Anonymous access has no permission or returns empty/denied
  assert.ok(anonSelectErr || anonSelect?.length === 0);

  const { error: anonInsertErr } = await clientAnon
    .from('workout_logs')
    .insert({
      user_id: userAId,
      exercise_id: exerciseId,
      logged_on: '2026-10-10',
      is_bodyweight: true,
    });

  assert.ok(anonInsertErr, 'Anonymous insert must be denied');
});

test('8. Cleanup direct RLS test row by owner (User A)', async () => {
  const { error } = await clientA
    .from('workout_logs')
    .delete()
    .eq('id', userARowId);

  assert.ok(!error, `User A delete failed: ${error?.message}`);
});
