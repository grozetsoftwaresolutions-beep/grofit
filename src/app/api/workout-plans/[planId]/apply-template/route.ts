import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { isValidUUID, validateApplyTemplateMode } from '@/lib/workout/domain';

export async function POST(
  request: Request,
  props: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await props.params;

    if (!isValidUUID(planId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid plan identifier.' } },
        { status: 400 }
      );
    }

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

    const { templateId, mode } = body as { templateId?: unknown; mode?: unknown };

    if (!isValidUUID(templateId)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A valid template ID is required.',
            fieldErrors: { templateId: 'A valid template ID is required.' },
          },
        },
        { status: 400 }
      );
    }

    const modeValidation = validateApplyTemplateMode(mode);
    if (!modeValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: modeValidation.error || 'Mode must be either replace or merge.',
            fieldErrors: { mode: modeValidation.error || 'Invalid mode.' },
          },
        },
        { status: 422 }
      );
    }

    // Call atomic PostgreSQL function apply_workout_template
    const { data, error } = await supabase.rpc('apply_workout_template', {
      p_plan_id: planId,
      p_template_id: templateId,
      p_mode: modeValidation.value,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('UNAUTHENTICATED')) {
        return NextResponse.json(
          { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
          { status: 401 }
        );
      }
      if (msg.includes('PLAN_NOT_FOUND')) {
        return NextResponse.json(
          { error: { code: 'RESOURCE_NOT_FOUND', message: 'Target workout plan not found or not authorized.' } },
          { status: 404 }
        );
      }
      if (msg.includes('TEMPLATE_NOT_FOUND')) {
        return NextResponse.json(
          { error: { code: 'RESOURCE_NOT_FOUND', message: 'Published workout template not found.' } },
          { status: 404 }
        );
      }
      if (msg.includes('INVALID_MODE')) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid apply-template mode.' } },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to apply workout template.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
