import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();

    let dbQuery = supabase
      .from('workout_templates')
      .select('id, name, description, source_reference, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve workout templates.' } },
        { status: 500 }
      );
    }

    const mapped = (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      sourceReference: t.source_reference,
      sortOrder: t.sort_order,
    }));

    return NextResponse.json({ data: mapped });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
