import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { EXERCISE_VIDEO_MAP } from '../src/lib/workout/exercise-videos.ts';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateDbCredits() {
  console.log('Updating database exercises with verified video creator credits...');
  const { data: dbExercises, error } = await supabase.from('exercises').select('id, name, source_key, source_reference');
  if (error) throw error;

  let updatedCount = 0;
  for (const ex of dbExercises) {
    const video = EXERCISE_VIDEO_MAP[ex.source_key];
    if (video) {
      const newRef = `Creator: ${video.videoCredit} | ${video.videoUrl}`;
      const { error: updateErr } = await supabase
        .from('exercises')
        .update({
          source_reference: newRef,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ex.id);

      if (updateErr) {
        console.error(`Failed to update ${ex.name}:`, updateErr);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Successfully updated ${updatedCount} / ${dbExercises.length} exercises in Supabase with verified creator credit & video URL!`);
}

updateDbCredits();
