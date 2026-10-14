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
let habitAId = '';

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
});

test('2. Direct RLS: User A inserts and reads own habit and habit_log', async () => {
  const { data: habit, error: hErr } = await clientA
    .from('habits')
    .insert({
      user_id: userAId,
      name: 'Direct RLS Habit',
      description: 'RLS boundary verification',
      is_active: true,
    })
    .select('id, user_id, name')
    .single();

  assert.ok(!hErr, `User A habit insert failed: ${hErr?.message}`);
  assert.equal(habit.user_id, userAId);
  habitAId = habit.id;

  const { data: log, error: lErr } = await clientA
    .from('habit_logs')
    .insert({
      user_id: userAId,
      habit_id: habitAId,
      completed_on: '2026-10-10',
    })
    .select('id, habit_id, completed_on')
    .single();

  assert.ok(!lErr, `User A habit_log insert failed: ${lErr?.message}`);
  assert.equal(log.habit_id, habitAId);
});

test('3. Direct RLS: User B is blocked from reading User A habit and logs', async () => {
  const { data: habits } = await clientB
    .from('habits')
    .select('id')
    .eq('id', habitAId);
  assert.equal(habits.length, 0, 'User B SELECT on User A habit must return 0 rows');

  const { data: logs } = await clientB
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitAId);
  assert.equal(logs.length, 0, 'User B SELECT on User A habit_logs must return 0 rows');
});

test('4. Direct RLS: User B is blocked from updating User A habit', async () => {
  const { data } = await clientB
    .from('habits')
    .update({ name: 'Tampered by User B' })
    .eq('id', habitAId)
    .select();
  assert.equal(data?.length || 0, 0, 'User B UPDATE must affect 0 rows on User A habit');
});

test('5. Direct RLS: User B is blocked from inserting habit with User A identity', async () => {
  const { data, error } = await clientB
    .from('habits')
    .insert({
      user_id: userAId, // Forged identity
      name: 'Forged Habit',
    })
    .select();

  assert.ok(error, 'User B insert with userAId MUST be rejected by RLS WITH CHECK');
  assert.equal(data, null);
});

test('6. Direct RLS: User B is blocked from creating a log for User A habit', async () => {
  const { data, error } = await clientB
    .from('habit_logs')
    .insert({
      user_id: userBId,
      habit_id: habitAId, // Child refers to User A habit
      completed_on: '2026-10-11',
    })
    .select();

  // Blocked by composite foreign key fk_habit_logs_habit (habit_id, user_id) REFERENCES habits(id, user_id)
  assert.ok(error, 'User B log for User A habit must fail parent-child foreign key constraint');
  assert.equal(data, null);
});

test('7. Database constraint: Duplicate (habit_id, completed_on) is rejected', async () => {
  const { data, error } = await clientA
    .from('habit_logs')
    .insert({
      user_id: userAId,
      habit_id: habitAId,
      completed_on: '2026-10-10', // Already logged in test 2
    })
    .select();

  assert.ok(error, 'Duplicate (habit_id, completed_on) must violate unique constraint');
  assert.equal(data, null);
});

test('8. Direct RLS: Anonymous access to habits and habit_logs is denied', async () => {
  const { data: anonHabits, error: anonHErr } = await clientAnon
    .from('habits')
    .select('id');
  assert.ok(anonHErr || anonHabits?.length === 0);

  const { data: anonLogs, error: anonLErr } = await clientAnon
    .from('habit_logs')
    .select('id');
  assert.ok(anonLErr || anonLogs?.length === 0);
});

test('9. Cleanup direct RLS test habit and logs by owner (User A)', async () => {
  const { error } = await clientA
    .from('habits')
    .delete()
    .eq('id', habitAId);
  assert.ok(!error, `User A cleanup failed: ${error?.message}`);
});
