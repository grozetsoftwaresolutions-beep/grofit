import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
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

const testEnv = parseEnvFile('.env.test.local');
const localEnv = parseEnvFile('.env.local');
const env = { ...localEnv, ...testEnv };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const USER_A_EMAIL = env.TEST_USER_A_EMAIL;
const USER_A_PASSWORD = env.TEST_USER_A_PASSWORD;
const USER_B_EMAIL = env.TEST_USER_B_EMAIL;
const USER_B_PASSWORD = env.TEST_USER_B_PASSWORD;
const APP_URL = 'http://localhost:3000';

async function getUserSessionCookie(email = USER_A_EMAIL, password = USER_A_PASSWORD) {
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to authenticate test user: ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  // Supabase SSR uses cookies like sb-{project-ref}-auth-token
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  const cookieKey = `sb-${projectRef}-auth-token`;
  
  // Format cookie value according to Supabase SSR
  const authPayload = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: tokenData.user,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600
  });

  const cookieHeader = `${cookieKey}=${encodeURIComponent(authPayload)}; Path=/; HttpOnly`;
  return { cookieHeader, accessToken, userId: tokenData.user.id };
}

test('POST /api/calorie-calculator/calculate — 401 Unauthenticated', async () => {
  const res = await fetch(`${APP_URL}/api/calorie-calculator/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ageYears: 25,
      height: { value: 180, unit: 'cm' },
      weight: { value: 90, unit: 'kg' },
      bmrVariant: 'plus_5',
      activityLevel: 'moderately_active',
      goal: 'maintain'
    })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error?.code, 'UNAUTHORIZED');
});

test('POST /api/calorie-calculator/calculate — 200 Reference Calculation (Authenticated)', async () => {
  const { cookieHeader, accessToken } = await getUserSessionCookie();

  const payload = {
    ageYears: 25,
    height: { value: 180, unit: 'cm' },
    weight: { value: 90, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'moderately_active',
    goal: 'maintain'
  };

  const res = await fetch(`${APP_URL}/api/calorie-calculator/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data);
  assert.equal(json.data.status, 'calculated');
  assert.equal(json.data.bmrKcalPerDay, 1905);
  assert.equal(json.data.maintenanceKcalPerDay, 2950);
  assert.equal(json.data.targetKcalPerDay, 2950);
  assert.equal(json.data.units.energy, 'kcal/day');
  assert.equal(json.data.method, 'mifflin_st_jeor');
  assert.equal(json.data.estimateDisclaimer, 'This is an estimate, not an individualized medical prescription.');
});

test('POST /api/calorie-calculator/calculate — 422 Underage Restriction (Authenticated)', async () => {
  const { cookieHeader, accessToken } = await getUserSessionCookie();

  const payload = {
    ageYears: 17,
    height: { value: 180, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'moderately_active',
    goal: 'maintain'
  };

  const res = await fetch(`${APP_URL}/api/calorie-calculator/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 422);
  const json = await res.json();
  assert.equal(json.error?.code, 'UNDERAGE_NOT_ELIGIBLE');
  assert.match(json.error?.message, /18 and older/);
});

test('POST /api/calorie-calculator/calculate — 400 Out of Bounds Validation (Authenticated)', async () => {
  const { cookieHeader, accessToken } = await getUserSessionCookie();

  // Out of bounds height: 300 cm
  const payload = {
    ageYears: 30,
    height: { value: 300, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
    bmrVariant: 'plus_5',
    activityLevel: 'moderately_active',
    goal: 'maintain'
  };

  const res = await fetch(`${APP_URL}/api/calorie-calculator/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error?.code, 'HEIGHT_OUT_OF_BOUNDS');
});

test('POST /api/calorie-calculator/calculate — 200 Safety Guardrail Target Withheld (< 1200 kcal/day)', async () => {
  const { cookieHeader, accessToken } = await getUserSessionCookie();

  // Low weight, low height, older, -161, sedentary, lose (-15%)
  const payload = {
    ageYears: 70,
    height: { value: 110, unit: 'cm' },
    weight: { value: 30, unit: 'kg' },
    bmrVariant: 'minus_161',
    activityLevel: 'sedentary',
    goal: 'lose'
  };

  const res = await fetch(`${APP_URL}/api/calorie-calculator/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data);
  assert.equal(json.data.status, 'target_withheld');
  assert.equal(json.data.targetKcalPerDay, null);
  assert.equal(json.data.reasonCode, 'TARGET_BELOW_APPROVED_MINIMUM');
  assert.match(json.data.message, /below the application safety guardrail/);
});

test('No unintended database writes or profile updates', async () => {
  const { accessToken, userId } = await getUserSessionCookie(USER_B_EMAIL, USER_B_PASSWORD);

  // 1. Fetch user profile before calculation
  const beforeRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const beforeProfiles = await beforeRes.json();
  const profileBefore = beforeProfiles[0];

  // 2. Perform calculation
  await fetch(`${APP_URL}/api/calorie-calculator/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      ageYears: 25,
      height: { value: 180, unit: 'cm' },
      weight: { value: 90, unit: 'kg' },
      bmrVariant: 'plus_5',
      activityLevel: 'moderately_active',
      goal: 'maintain'
    })
  });

  // 3. Fetch user profile after calculation
  const afterRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const afterProfiles = await afterRes.json();
  const profileAfter = afterProfiles[0];

  assert.equal(profileAfter.id, profileBefore.id);
  assert.equal(profileAfter.display_name, profileBefore.display_name);
  assert.equal(profileAfter.updated_at, profileBefore.updated_at);
  assert.equal(profileAfter.created_at, profileBefore.created_at);
});

