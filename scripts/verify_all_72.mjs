import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export const EXERCISE_VIDEO_MAP = {
  // 1. Back
  ex_barbell_row: {
    videoUrl: 'https://www.youtube.com/shorts/HRo7m_Dfpxw',
    videoCredit: 'DeltaBolic',
  },
  ex_lat_pull_down: {
    videoUrl: 'https://www.youtube.com/watch?v=O94yEoGXtBY',
    videoCredit: 'Jeff Nippard',
  },
  ex_lat_focused_row: {
    videoUrl: 'https://www.youtube.com/shorts/q8E9XaizZpY',
    videoCredit: 'DeltaBolic',
  },
  ex_close_grip_lat_pulldown: {
    videoUrl: 'https://www.youtube.com/watch?v=hkZWmvkbNNQ',
    videoCredit: 'ThriveTraining',
  },
  ex_chest_supported_tbar_row: {
    videoUrl: 'https://www.youtube.com/watch?v=_FrrYQxA6kc',
    videoCredit: 'Renaissance Periodization',
  },
  ex_single_arm_cable_lat_row: {
    videoUrl: 'https://www.youtube.com/shorts/yIvvQc2Z6uM',
    videoCredit: 'DeltaBolic',
  },
  ex_straight_arm_cable_pulldown: {
    videoUrl: 'https://www.youtube.com/shorts/zECTZHrvuMg',
    videoCredit: 'DeltaBolic',
  },
  ex_pullups_overhand: {
    videoUrl: 'https://www.youtube.com/watch?v=MhokcbRLP5w',
    videoCredit: 'FitnessFAQs',
  },
  ex_inverted_rows: {
    videoUrl: 'https://www.youtube.com/watch?v=z4RJcgEKRSQ',
    videoCredit: 'FitnessFAQs',
  },

  // 2. Chest
  ex_incline_dumbell_press: {
    videoUrl: 'https://www.youtube.com/watch?v=GHcAIiL9J_Y',
    videoCredit: 'Renaissance Periodization',
  },
  ex_flat_dumbell_press: {
    videoUrl: 'https://www.youtube.com/watch?v=QsYre__-aro',
    videoCredit: 'Jeremy Ethier',
  },
  ex_pec_fly_machine: {
    videoUrl: 'https://www.youtube.com/shorts/a9vQ_hwIksU',
    videoCredit: 'DeltaBolic',
  },
  ex_barbell_bench_press: {
    videoUrl: 'https://www.youtube.com/watch?v=vcBig73ojpE',
    videoCredit: 'Jeff Nippard',
  },
  ex_seated_cable_fly: {
    videoUrl: 'https://www.youtube.com/watch?v=kEDraCFRgrI',
    videoCredit: 'Renaissance Periodization',
  },
  ex_weighted_chest_dips: {
    videoUrl: 'https://www.youtube.com/shorts/Fnfb0Ukc_34',
    videoCredit: 'FitnessFAQs',
  },
  ex_pushups_standard: {
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    videoCredit: 'Calisthenicmovement',
  },

  // 3. Biceps
  ex_dumbell_hammer_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=8XLxfXROrTo',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_incline_dumbell_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=soxrZlIl35U',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_bayesian_cable_curl: {
    videoUrl: 'https://www.youtube.com/shorts/S9MD8ur5YCA',
    videoCredit: 'DeltaBolic',
  },
  ex_preacher_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=fuK3nFvwgXk',
    videoCredit: 'Renaissance Periodization',
  },
  ex_spider_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=CITtSuda0Fg',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_standing_ez_bar_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=zG2xJ0Q5QtI',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_chinups_underhand: {
    videoUrl: 'https://www.youtube.com/watch?v=UfhT0OSUU0w',
    videoCredit: 'Calisthenicmovement',
  },

  // 4. Triceps
  ex_skull_crushers: {
    videoUrl: 'https://www.youtube.com/watch?v=8t2a93BjDec',
    videoCredit: 'Renaissance Periodization',
  },
  ex_cable_pushdown: {
    videoUrl: 'https://www.youtube.com/watch?v=lIqJXGQYyvM',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_overhead_tricep_extension: {
    videoUrl: 'https://www.youtube.com/watch?v=IaJWPqP-Bjo',
    videoCredit: 'Renaissance Periodization',
  },
  ex_close_grip_bench_press: {
    videoUrl: 'https://www.youtube.com/watch?v=UYJsFzqdgK4',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_weighted_parallel_dips: {
    videoUrl: 'https://www.youtube.com/watch?v=T1L4smOP0L8',
    videoCredit: 'FitnessFAQs',
  },
  ex_single_arm_cross_cable_pushdown: {
    videoUrl: 'https://www.youtube.com/watch?v=hM5iZ880zzk',
    videoCredit: 'N1 Education',
  },
  ex_bodyweight_dips: {
    videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    videoCredit: 'Calisthenicmovement',
  },

  // 5. Forearms
  ex_wrist_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=2wPpcJBe03o',
    videoCredit: 'Renaissance Periodization',
  },
  ex_reverse_wrist_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=FW7URAaC-vE',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_wrist_roller_behind_back: {
    videoUrl: 'https://www.youtube.com/shorts/cLnjWmBq4JA',
    videoCredit: 'DeltaBolic',
  },
  ex_farmers_walk: {
    videoUrl: 'https://www.youtube.com/watch?v=Tgi5SNDbBZQ',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_reverse_ez_bar_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=didEQUuieRQ',
    videoCredit: 'Scott Herman Fitness',
  },

  // 6. Shoulders
  ex_shoulder_press: {
    videoUrl: 'https://www.youtube.com/watch?v=GFblCmuEE18',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_lateral_rises: {
    videoUrl: 'https://www.youtube.com/watch?v=n5dsI9qQXwY',
    videoCredit: 'Renaissance Periodization',
  },
  ex_face_pull: {
    videoUrl: 'https://www.youtube.com/watch?v=ljgqer1ZpXg',
    videoCredit: 'ATHLEAN-X™',
  },
  ex_cable_lateral_raise: {
    videoUrl: 'https://www.youtube.com/shorts/f_OGBg2KxgY',
    videoCredit: 'Jeff Nippard',
  },
  ex_incline_dumbbell_y_raise: {
    videoUrl: 'https://www.youtube.com/watch?v=lXp16YozXgk',
    videoCredit: 'Physique Development',
  },
  ex_reverse_pec_deck_fly: {
    videoUrl: 'https://www.youtube.com/shorts/H5UxZFl0lgk',
    videoCredit: 'DeltaBolic',
  },
  ex_pike_pushups: {
    videoUrl: 'https://www.youtube.com/watch?v=-VNRSqOMH30',
    videoCredit: 'FitnessFAQs',
  },

  // 7. Quads
  ex_squats: {
    videoUrl: 'https://www.youtube.com/watch?v=5alpa1IikQM',
    videoCredit: 'Squat University',
  },
  ex_leg_press: {
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_leg_extension: {
    videoUrl: 'https://www.youtube.com/watch?v=ljO4jkwv8wQ',
    videoCredit: 'Jeff Nippard',
  },
  ex_hack_squat_machine: {
    videoUrl: 'https://www.youtube.com/watch?v=rYgNArpwE7E',
    videoCredit: 'Renaissance Periodization',
  },
  ex_bulgarian_split_squat_quad: {
    videoUrl: 'https://www.youtube.com/watch?v=SkNsa3eBwLA',
    videoCredit: 'Max Euceda',
  },
  ex_pendulum_sissy_squat: {
    videoUrl: 'https://www.youtube.com/watch?v=VUiFlZ2FsKA',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_bodyweight_squats: {
    videoUrl: 'https://www.youtube.com/watch?v=gsNoPYwWXeM',
    videoCredit: 'Calisthenicmovement',
  },

  // 8. Hamstrings
  ex_hamstring_curls: {
    videoUrl: 'https://www.youtube.com/watch?v=jobEeklwrrs',
    videoCredit: 'Renaissance Periodization',
  },
  ex_seated_leg_curl: {
    videoUrl: 'https://www.youtube.com/watch?v=Orxowest56U',
    videoCredit: 'Renaissance Periodization',
  },
  ex_romanian_deadlift: {
    videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_stiff_leg_deadlift: {
    videoUrl: 'https://www.youtube.com/watch?v=CN_7cz3P-1U',
    videoCredit: 'Renaissance Periodization',
  },
  ex_nordic_hamstring_curl: {
    videoUrl: 'https://www.youtube.com/shorts/htyDuCI8cm8',
    videoCredit: 'Squat University',
  },
  ex_45_degree_hyperextension: {
    videoUrl: 'https://www.youtube.com/watch?v=jh45myksaEs',
    videoCredit: 'Bret Contreras Glute Guy',
  },

  // 9. Glutes
  ex_barbell_hip_thrust: {
    videoUrl: 'https://www.youtube.com/watch?v=hCm-70-9_XE',
    videoCredit: 'Bret Contreras Glute Guy',
  },
  ex_bulgarian_split_squat_glute: {
    videoUrl: 'https://www.youtube.com/watch?v=kkdmHTASZg8',
    videoCredit: 'Squat University',
  },
  ex_glute_biased_rdl: {
    videoUrl: 'https://www.youtube.com/watch?v=5bJEigM5iVg',
    videoCredit: 'Squat University',
  },
  ex_cable_glute_kickback: {
    videoUrl: 'https://www.youtube.com/shorts/CyJtnoZRxPw',
    videoCredit: 'DeltaBolic',
  },
  ex_seated_hip_abduction_machine: {
    videoUrl: 'https://www.youtube.com/shorts/Bfdmj4pp660',
    videoCredit: 'Bret Contreras Glute Guy',
  },
  ex_sumo_squat_deadlift: {
    videoUrl: 'https://www.youtube.com/watch?v=FLbh7Di2KM8',
    videoCredit: 'Squat University',
  },

  // 10. Calves
  ex_calves: {
    videoUrl: 'https://www.youtube.com/shorts/xK6DoHBXTdw',
    videoCredit: 'Jeff Nippard',
  },
  ex_seated_calf_raise: {
    videoUrl: 'https://www.youtube.com/watch?v=zMAvzOFjkNE',
    videoCredit: 'Renaissance Periodization',
  },
  ex_leg_press_toe_press: {
    videoUrl: 'https://www.youtube.com/shorts/MICiHJ67xTI',
    videoCredit: 'DeltaBolic',
  },
  ex_single_leg_dumbbell_calf_raise: {
    videoUrl: 'https://www.youtube.com/watch?v=-AOpemH7Tb4',
    videoCredit: 'Calisthenicmovement',
  },
  ex_donkey_calf_raise: {
    videoUrl: 'https://www.youtube.com/watch?v=eFAfbxHnd6Q',
    videoCredit: 'John Meadows (mountaindog1)',
  },

  // 11. Abs
  ex_crunches: {
    videoUrl: 'https://www.youtube.com/watch?v=Evhyg6Fs9Q8',
    videoCredit: 'Scott Herman Fitness',
  },
  ex_plank: {
    videoUrl: 'https://www.youtube.com/shorts/vmxWjL0LjV4',
    videoCredit: 'Squat University',
  },
  ex_kneeling_cable_crunch: {
    videoUrl: 'https://www.youtube.com/watch?v=6GMKPQVERzw',
    videoCredit: 'Renaissance Periodization',
  },
  ex_hanging_leg_raise: {
    videoUrl: 'https://www.youtube.com/watch?v=QyVq5oUBpss',
    videoCredit: 'FitnessFAQs',
  },
  ex_ab_wheel_rollout: {
    videoUrl: 'https://www.youtube.com/watch?v=yTAVUqs0_m0',
    videoCredit: 'ATHLEAN-X™',
  },
  ex_cable_woodchopper: {
    videoUrl: 'https://www.youtube.com/watch?v=pAplQXk3dkU',
    videoCredit: 'Scott Herman Fitness',
  },
};

async function verifyAll72() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: dbExercises, error } = await supabase.from('exercises').select('id, name, muscle_group, source_key').order('name');
  if (error) throw error;

  console.log(`Checking coverage against all ${dbExercises.length} database exercises...`);
  const missing = [];
  for (const ex of dbExercises) {
    if (!EXERCISE_VIDEO_MAP[ex.source_key]) {
      missing.push(`${ex.name} (${ex.source_key})`);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing videos for ${missing.length} exercises:`, missing);
    process.exit(1);
  }
  console.log(`✅ 100% Coverage! All ${dbExercises.length} exercises mapped.`);

  console.log(`\nValidating all ${Object.keys(EXERCISE_VIDEO_MAP).length} URLs against live YouTube oEmbed API...`);
  let passed = 0;
  let failed = 0;

  for (const [key, item] of Object.entries(EXERCISE_VIDEO_MAP)) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(item.videoUrl)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ [${key}] OK (HTTP 200) -> "${data.title}" by "${data.author_name}" [Credit: ${item.videoCredit}]`);
        passed++;
      } else {
        console.error(`❌ [${key}] FAILED HTTP ${res.status}: ${item.videoUrl}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ [${key}] ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n================================`);
  console.log(`Verification Summary:`);
  console.log(`Total Exercises: ${Object.keys(EXERCISE_VIDEO_MAP).length}`);
  console.log(`Passed (Active & Live): ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

verifyAll72();
