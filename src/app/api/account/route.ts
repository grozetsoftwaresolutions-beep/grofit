import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user || !user.email) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    interface DeleteAccountBody {
      confirmation?: unknown;
      password?: unknown;
      targetUserId?: unknown;
    }

    let body: DeleteAccountBody;
    try {
      body = (await request.json()) as DeleteAccountBody;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body.' } },
        { status: 400 }
      );
    }

    // 1. Validate explicit confirmation
    if (body.confirmation !== 'DELETE') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            fieldErrors: { confirmation: 'You must type DELETE in all uppercase to confirm deletion.' },
          },
        },
        { status: 400 }
      );
    }

    // 2. Validate password for re-authentication
    if (!body.password || typeof body.password !== 'string' || !body.password.trim()) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            fieldErrors: { password: 'Password is required for re-authentication.' },
          },
        },
        { status: 400 }
      );
    }

    // 3. Security: Reject unauthorized target user ID overrides
    if (body.targetUserId && body.targetUserId !== user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot initiate deletion for another user account.',
          },
        },
        { status: 403 }
      );
    }

    // 4. Re-authenticate caller using verified user's email and submitted password
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: body.password,
    });

    if (reauthError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Re-authentication failed. Incorrect account password.',
          },
        },
        { status: 401 }
      );
    }

    // 5. Server-side deletion via privileged Supabase admin client
    const adminClient = getAdminSupabaseClient();
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to complete server-side account deletion.',
          },
        },
        { status: 500 }
      );
    }

    // 6. Sign out caller session
    await supabase.auth.signOut();

    return NextResponse.json({
      data: {
        success: true,
        message: 'Account and associated personal records have been permanently deleted.',
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred during account deletion.' } },
      { status: 500 }
    );
  }
}
