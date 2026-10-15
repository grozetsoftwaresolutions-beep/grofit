import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Route protection logic mirror from src/lib/supabase/middleware.ts
 */
function evaluateRouteProtection(pathname, hasUser) {
  const isAuthRoute = pathname.startsWith('/auth');
  const isAppRoute = pathname.startsWith('/app');
  const isRootRoute = pathname === '/';

  if (isAppRoute && !hasUser) {
    return { action: 'redirect', destination: '/auth/login' };
  }

  // Once authenticated, visiting /auth/* or root (/) redirects directly to dashboard (/app)
  if ((isAuthRoute || isRootRoute) && hasUser) {
    return { action: 'redirect', destination: '/app' };
  }

  return { action: 'next' };
}

test('Unauthenticated client visiting root landing page (/) sees landing page', () => {
  const result = evaluateRouteProtection('/', false);
  assert.equal(result.action, 'next', 'Unauthenticated client should be allowed to view root landing page');
});

test('Authenticated client visiting root landing page (/) is redirected directly to /app', () => {
  const result = evaluateRouteProtection('/', true);
  assert.equal(result.action, 'redirect');
  assert.equal(result.destination, '/app', 'Authenticated client must redirect to dashboard (/app)');
});

test('Authenticated client visiting /auth/login or /auth/signup is redirected to /app', () => {
  const loginResult = evaluateRouteProtection('/auth/login', true);
  assert.equal(loginResult.action, 'redirect');
  assert.equal(loginResult.destination, '/app');

  const signupResult = evaluateRouteProtection('/auth/signup', true);
  assert.equal(signupResult.action, 'redirect');
  assert.equal(signupResult.destination, '/app');
});

test('Unauthenticated client visiting /app is redirected to /auth/login', () => {
  const appResult = evaluateRouteProtection('/app', false);
  assert.equal(appResult.action, 'redirect');
  assert.equal(appResult.destination, '/auth/login');

  const subRouteResult = evaluateRouteProtection('/app/workout-plans', false);
  assert.equal(subRouteResult.action, 'redirect');
  assert.equal(subRouteResult.destination, '/auth/login');
});

test('Authenticated client accessing /app or subroutes is allowed through', () => {
  const appResult = evaluateRouteProtection('/app', true);
  assert.equal(appResult.action, 'next');

  const subRouteResult = evaluateRouteProtection('/app/diet-foods', true);
  assert.equal(subRouteResult.action, 'next');
});

test('Signed-out client after signing out can visit / and sees landing page again', () => {
  // Simulating user signed out: hasUser is now false
  const result = evaluateRouteProtection('/', false);
  assert.equal(result.action, 'next', 'After sign-out, visiting root allows client to see landing page again');
});
