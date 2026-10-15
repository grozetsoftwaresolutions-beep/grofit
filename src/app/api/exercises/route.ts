import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';
import { EVIDENCE_BASED_EXERCISES, EXERCISE_VIDEO_MAP } from '@/lib/workout/evidence-exercises';

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
    const muscleGroup = searchParams.get('muscleGroup')?.trim();
    const topRankedOnly = searchParams.get('topRankedOnly') === 'true';

    let dbQuery = supabase
      .from('exercises')
      .select('id, name, description, muscle_group, source_reference, source_key')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    if (muscleGroup && muscleGroup !== 'All') {
      if (muscleGroup.toLowerCase() === 'legs') {
        dbQuery = dbQuery.in('muscle_group', ['Legs', 'Quads', 'Hamstrings', 'Glutes', 'Calves']);
      } else if (muscleGroup.toLowerCase() === 'shoulders' || muscleGroup.toLowerCase() === 'shoulder') {
        dbQuery = dbQuery.in('muscle_group', ['Shoulder', 'Shoulders']);
      } else if (muscleGroup.toLowerCase() === 'forearms' || muscleGroup.toLowerCase() === 'forearm') {
        dbQuery = dbQuery.in('muscle_group', ['Forearm', 'Forearms']);
      } else {
        dbQuery = dbQuery.ilike('muscle_group', muscleGroup);
      }
    }

    const { data, error } = await dbQuery;

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve exercises.' } },
        { status: 500 }
      );
    }

    // Index evidence-based exercises by ID and sourceKey/normalized name
    const evidenceMapById = new Map(EVIDENCE_BASED_EXERCISES.map((e) => [e.id, e]));
    const evidenceMapByName = new Map(
      EVIDENCE_BASED_EXERCISES.map((e) => [e.name.toLowerCase().trim(), e])
    );

    let mapped = (data || []).map((e) => {
      const evidence = evidenceMapById.get(e.id) || evidenceMapByName.get(e.name.toLowerCase().trim());
      const video = (e.source_key && EXERCISE_VIDEO_MAP[e.source_key]) || (evidence?.videoUrl ? { videoUrl: evidence.videoUrl, videoCredit: evidence.videoCredit } : null);
      return {
        id: e.id,
        name: e.name,
        description: e.description,
        muscleGroup: evidence ? evidence.muscleGroup : e.muscle_group,
        sourceReference: e.source_reference,
        sourceKey: e.source_key,
        videoUrl: video?.videoUrl ?? null,
        videoCredit: video?.videoCredit ?? null,
        rank: evidence?.rank ?? null,
        tier: evidence?.tier ?? null,
        targetHead: evidence?.targetHead ?? null,
        hypertrophyScore: evidence?.hypertrophyScore ?? null,
        biomechanicalAdvantage: evidence?.biomechanicalAdvantage ?? null,
        evidenceRationale: evidence?.evidenceRationale ?? null,
        scientificReference: evidence?.scientificReference ?? null,
        recommendedSets: evidence?.recommendedSets ?? null,
        recommendedReps: evidence?.recommendedReps ?? null,
        recommendedRepRange: evidence?.recommendedRepRange ?? null,
        executionCues: evidence?.executionCues ?? null,
      };
    });

    if (topRankedOnly) {
      mapped = mapped.filter((item) => item.rank !== null && item.rank <= 5);
    }

    // Sort by rank ascending (ranked items first #1 to #5, then unranked by name)
    mapped.sort((a, b) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ data: mapped });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

