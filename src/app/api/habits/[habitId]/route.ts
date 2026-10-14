import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import {
  isValidUUID,
  validateHabitName,
  validateHabitDescription,
} from '@/lib/habits/domain';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ habitId: string }> }
) {
  try {
    const { habitId } = await props.params;

    if (!isValidUUID(habitId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'habitId must be a valid UUID.' } },
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

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' } },
        { status: 400 }
      );
    }

    // Verify habit ownership
    const { data: existing, error: fetchError } = await supabase
      .from('habits')
      .select('id, name, description, is_active, created_at, updated_at')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Habit not found or access denied.' } },
        { status: 404 }
      );
    }

    const fieldErrors: Record<string, string> = {};
    let targetName = existing.name;
    let targetDescription = existing.description;
    let targetIsActive = existing.is_active;

    if (body.name !== undefined) {
      const nameRes = validateHabitName(body.name);
      if (!nameRes.valid) {
        fieldErrors.name = nameRes.error!;
      } else {
        targetName = nameRes.value;
      }
    }

    if (body.description !== undefined) {
      const descRes = validateHabitDescription(body.description);
      if (!descRes.valid) {
        fieldErrors.description = descRes.error!;
      } else {
        targetDescription = descRes.value;
      }
    }

    if (body.isActive !== undefined) {
      targetIsActive = Boolean(body.isActive);
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid habit updates.',
            fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('habits')
      .update({
        name: targetName,
        description: targetDescription,
        is_active: targetIsActive,
      })
      .eq('id', habitId)
      .eq('user_id', user.id)
      .select('id, name, description, is_active, created_at, updated_at')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update habit.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        isActive: updated.is_active,
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

export async function DELETE(
  request: Request,
  props: { params: Promise<{ habitId: string }> }
) {
  try {
    const { habitId } = await props.params;

    if (!isValidUUID(habitId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'habitId must be a valid UUID.' } },
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

    // Verify habit ownership
    const { data: existing, error: fetchError } = await supabase
      .from('habits')
      .select('id, name')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Habit not found or access denied.' } },
        { status: 404 }
      );
    }

    // Delete habit (cascades to habit_logs via database foreign key)
    const { error: deleteError } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete habit.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: existing.id,
        name: existing.name,
        deleted: true,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
