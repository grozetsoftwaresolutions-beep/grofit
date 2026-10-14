import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';

function isValidTimezone(tz: string): boolean {
  if (typeof tz !== 'string' || !tz.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, timezone, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user profile.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email ?? null,
        displayName: profile?.display_name ?? null,
        timezone: profile?.timezone ?? 'Asia/Kolkata',
        createdAt: profile?.created_at ?? null,
        updatedAt: profile?.updated_at ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    interface PatchProfileBody {
      displayName?: unknown;
      timezone?: unknown;
    }

    let body: PatchProfileBody;
    try {
      body = (await request.json()) as PatchProfileBody;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body.' } },
        { status: 400 }
      );
    }

    const updates: { display_name?: string | null; timezone?: string } = {};

    if (body.displayName !== undefined) {
      if (typeof body.displayName !== 'string') {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { displayName: 'Display name must be a string.' } } },
          { status: 400 }
        );
      }
      const trimmed = body.displayName.trim();
      if (trimmed.length > 100) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { displayName: 'Display name cannot exceed 100 characters.' } } },
          { status: 400 }
        );
      }
      updates.display_name = trimmed.length > 0 ? trimmed : null;
    }

    if (body.timezone !== undefined) {
      if (typeof body.timezone !== 'string' || !isValidTimezone(body.timezone)) {
        return NextResponse.json(
          { error: { code: 'INVALID_INPUT', fieldErrors: { timezone: 'Invalid IANA timezone identifier.' } } },
          { status: 400 }
        );
      }
      updates.timezone = body.timezone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'No valid update fields provided.' } },
        { status: 400 }
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id, display_name, timezone, created_at, updated_at')
      .single();

    if (updateErr || !updated) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email ?? null,
        displayName: updated.display_name,
        timezone: updated.timezone,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
