import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const content = fs.readFileSync('src/lib/workout/seed-data.ts', 'utf8');

const finalizedRegex = /exerciseSourceKey:\s*"([^"]+)",[\s\S]*?videoUrl:\s*"([^"]+)",[\s\S]*?videoCredit:\s*"([^"]+)"/g;
let m;
const known = new Set();
while ((m = finalizedRegex.exec(content)) !== null) {
  known.add(m[1]);
}
const caliRegex = /exerciseSourceKey:\s*"([^"]+)"[\s\S]*?videoUrl:\s*"([^"]+)"[\s\S]*?sourcePrescriptionText:\s*"Creator:\s*([^|"]+)/g;
while ((m = caliRegex.exec(content)) !== null) {
  known.add(m[1]);
}

async function findRemaining() {
  const { data: dbExercises, error } = await supabase.from('exercises').select('*').order('muscle_group, name');
  if (error) throw error;
  
  const remaining = dbExercises.filter(e => !known.has(e.source_key));
  console.log(`Remaining exercises to find: ${remaining.length}`);
  
  const byMuscle = {};
  for (const ex of remaining) {
    byMuscle[ex.muscle_group] = byMuscle[ex.muscle_group] || [];
    byMuscle[ex.muscle_group].push(ex);
  }
  
  for (const [mg, list] of Object.entries(byMuscle)) {
    console.log(`\n=== ${mg} (${list.length}) ===`);
    list.forEach(e => console.log(`- ${e.name} [key: ${e.source_key}]`));
  }
}

findRemaining();
