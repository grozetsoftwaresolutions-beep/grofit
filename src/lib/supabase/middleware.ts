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

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return supabaseResponse;
}
