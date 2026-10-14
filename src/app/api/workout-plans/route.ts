import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { validateName } from '@/lib/workout/domain';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .select('id, name, source_template_id, source_template_name_snapshot, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve workout plans.' } },
        { status: 500 }
      );
    }

    const mapped = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      sourceTemplateId: p.source_template_id,
      sourceTemplateNameSnapshot: p.source_template_name_snapshot,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON payload.' } },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Request body must be an object.' } },
        { status: 400 }
      );
    }

    const { name } = body as { name?: unknown };
    const nameValidation = validateName(name, 'Plan name');
    if (!nameValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: nameValidation.error || 'Invalid plan name.',
            fieldErrors: { name: nameValidation.error || 'Invalid plan name.' },
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: nameValidation.value,
      })
      .select('id, name, source_template_id, source_template_name_snapshot, created_at, updated_at')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create workout plan.' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: data.id,
          name: data.name,
          sourceTemplateId: data.source_template_id,
          sourceTemplateNameSnapshot: data.source_template_name_snapshot,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
