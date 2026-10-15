import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey === 'YOUR_ACTUAL_PUBLISHABLE_KEY') {
    if (!request.nextUrl.pathname.startsWith('/auth/login')) {
      return NextResponse.redirect(new URL('/auth/login?message=System unconfigured', request.url))
    }
    return NextResponse.next()
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Basic route protection
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isAppRoute = request.nextUrl.pathname.startsWith('/app');
  const isRootRoute = request.nextUrl.pathname === '/';

  // Helper to ensure refreshed session cookies are preserved on redirect
  const createRedirectResponse = (targetPath: string) => {
    const redirectResponse = NextResponse.redirect(new URL(targetPath, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  if (isAppRoute && !user) {
    return createRedirectResponse('/auth/login');
  }

  // Once authenticated, visiting /auth/* or the root landing page (/) redirects directly to dashboard (/app)
  if ((isAuthRoute || isRootRoute) && user) {
    return createRedirectResponse('/app');
  }

  return supabaseResponse;
}
