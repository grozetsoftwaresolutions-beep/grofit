-- Phase 7: Home Workout Template & Evidence-Based Calisthenics Library
-- Adds Push-Ups, Pull-Ups, Chin-Ups, Dips, Inverted Rows, Pike Push-Ups, Sissy Squats
-- Creates the Evidence-Based Home Calisthenics Split (3-Day) Template

-- 1. Insert Home Calisthenics Exercises
INSERT INTO public.exercises (id, source_key, name, muscle_group, source_reference)
VALUES
  (
    'c1000000-0000-0000-0000-000000000066',
    'ex_pushups_standard',
    'Push-Ups (Standard & Deficit)',
    'Chest',
    'Calisthenicmovement / Sports Science Consensus'
  ),
  (
    'c1000000-0000-0000-0000-000000000067',
    'ex_pullups_overhand',
    'Pull-Ups (Overhand Grip)',
    'Back',
    'FitnessFAQs (Daniel Vadnal) / Sports Science Consensus'
  ),
  (
    'c1000000-0000-0000-0000-000000000068',
    'ex_chinups_underhand',
    'Chin-Ups (Underhand Grip)',
    'Biceps',
    'Calisthenicmovement / Sports Science Consensus'
  ),
  (
    'c1000000-0000-0000-0000-000000000069',
    'ex_inverted_rows',
    'Inverted Rows (Australian Pull-Ups)',
    'Back',
    'FitnessFAQs / Sports Science Consensus'
  ),
  (
    'c1000000-0000-0000-0000-000000000070',
    'ex_pike_pushups',
    'Pike Push-Ups (Bodyweight Overhead Press)',
    'Shoulders',
    'FitnessFAQs (Daniel Vadnal) / Sports Science Consensus'
  ),
  (
    'c1000000-0000-0000-0000-000000000071',
    'ex_bodyweight_dips',
    'Bodyweight Dips (Parallel Bars / Sturdy Chairs)',
    'Triceps',
    'Calisthenicmovement / Sports Science Consensus'
  ),
  (
    'c1000000-0000-0000-0000-000000000072',
    'ex_bodyweight_squats',
    'Bodyweight Deep Squats & Sissy Squats',
    'Quads',
    'Calisthenicmovement / Sports Science Consensus'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  muscle_group = EXCLUDED.muscle_group,
  source_reference = EXCLUDED.source_reference;

-- 2. Insert Home Calisthenics Template
INSERT INTO public.workout_templates (
  id,
  source_key,
  name,
  description,
  source_reference,
  is_published,
  sort_order
)
VALUES (
  'a3000000-0000-0000-0000-000000000001',
  'template_home_calisthenics_3day',
  'Evidence-Based Home Calisthenics Split (3-Day)',
  'Evidence-based home bodyweight hypertrophy programme featuring progressive overload with push-ups, pull-ups, dips, rows, and unilateral leg training. Curated tutorial demonstrations with verified YouTuber credits.',
  'Calisthenicmovement, FitnessFAQs, Max Euceda, Chris Heria',
  true,
  2
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_reference = EXCLUDED.source_reference,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

-- 3. Insert Template Days
INSERT INTO public.template_days (id, template_id, day_number, name, sort_order)
VALUES
  (
    'b3000000-0000-0000-0000-000000000001',
    'a3000000-0000-0000-0000-000000000001',
    1,
    'Day 1: Upper Body Push & Pull (Hypertrophy & Strength)',
    0
  ),
  (
    'b3000000-0000-0000-0000-000000000002',
    'a3000000-0000-0000-0000-000000000001',
    2,
    'Day 2: Lower Body & Core Mastery (Quads, Calves, Abs)',
    1
  ),
  (
    'b3000000-0000-0000-0000-000000000003',
    'a3000000-0000-0000-0000-000000000001',
    3,
    'Day 3: Full Body Overload & Weak Point Progression',
    2
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  day_number = EXCLUDED.day_number,
  sort_order = EXCLUDED.sort_order;

-- 4. Insert Warmups
INSERT INTO public.warmups (id, template_day_id, name, description, sort_order)
VALUES
  ('e3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'Shoulder Dislocates & Arm Circles', '10–15 controlled repetitions with a towel or broomstick', 0),
  ('e3000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000001', 'Scapular Pull-Ups & Push-Up Plus', '2 sets of 8–10 reps activating scapular retractors and protractors', 1),
  ('e3000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000002', 'Bodyweight Air Squats', '2 sets of 12 reps loosening hip flexors and ankles', 0),
  ('e3000000-0000-0000-0000-000000000004', 'b3000000-0000-0000-0000-000000000002', 'Glute Bridges & Leg Swings', '15 reps glute activation and dynamic hamstring mobility', 1),
  ('e3000000-0000-0000-0000-000000000005', 'b3000000-0000-0000-0000-000000000003', 'Jumping Jacks & Dynamic Wrist Mobility', '60 seconds light cardio and wrist preparation', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 5. Insert Template Entries
INSERT INTO public.template_entries (
  id,
  template_day_id,
  exercise_id,
  sort_order,
  sets,
  reps,
  source_label,
  video_url,
  source_prescription_text
)
VALUES
  -- Day 1: Upper Body Push & Pull
  (
    'd3000000-0000-0000-0000-000000000001',
    'b3000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000067',
    0,
    3,
    8,
    'Pull-Ups (Overhand Grip)',
    'https://www.youtube.com/watch?v=MhokcbRLP5w',
    'Creator: FitnessFAQs (Daniel Vadnal) | 3 sets of 6–10 reps. Full dead-hang stretch to chin over bar.'
  ),
  (
    'd3000000-0000-0000-0000-000000000002',
    'b3000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000066',
    1,
    3,
    15,
    'Push-Ups (Standard / Deficit)',
    'https://www.youtube.com/watch?v=IODxDxX7oi4',
    'Creator: Calisthenicmovement | 3 sets of 10–20 reps near failure. Elevate hands on books or blocks for deep deficit pectoral stretch.'
  ),
  (
    'd3000000-0000-0000-0000-000000000003',
    'b3000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000069',
    2,
    3,
    12,
    'Inverted Rows (Bodyweight Horizontal Row)',
    'https://www.youtube.com/watch?v=z4RJcgEKRSQ',
    'Creator: FitnessFAQs | 3 sets of 8–15 reps. Under table or bedsheet door anchor; pause 1s at peak scapular retraction.'
  ),
  (
    'd3000000-0000-0000-0000-000000000004',
    'b3000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000071',
    3,
    3,
    10,
    'Bodyweight Dips (Parallel Bars / Chairs)',
    'https://www.youtube.com/watch?v=2z8JmcrW-As',
    'Creator: Calisthenicmovement | 3 sets of 8–12 reps. Forward torso lean for chest bias; upright for triceps.'
  ),
  (
    'd3000000-0000-0000-0000-000000000005',
    'b3000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000070',
    4,
    3,
    10,
    'Pike Push-Ups (Shoulder Overhead Press)',
    'https://www.youtube.com/watch?v=-VNRSqOMH30',
    'Creator: FitnessFAQs (Daniel Vadnal) | 3 sets of 8–12 reps. Inverted V-position pushing crown of head forward in a tripod.'
  ),
  (
    'd3000000-0000-0000-0000-000000000006',
    'b3000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000068',
    5,
    3,
    8,
    'Chin-Ups (Biceps & Lats)',
    'https://www.youtube.com/watch?v=UfhT0OSUU0w',
    'Creator: Calisthenicmovement | 3 sets of 6–10 reps. Underhand grip with 3s eccentric descent targeting biceps.'
  ),

  -- Day 2: Lower Body & Core Mastery
  (
    'd3000000-0000-0000-0000-000000000007',
    'b3000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000042',
    0,
    3,
    12,
    'Bulgarian Split Squats (Rear-Foot Elevated)',
    'https://www.youtube.com/watch?v=SkNsa3eBwLA',
    'Creator: Max Euceda | 3 sets per leg (8–15 reps). Rear foot on couch/chair; deep knee flexion under control.'
  ),
  (
    'd3000000-0000-0000-0000-000000000008',
    'b3000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000072',
    1,
    3,
    15,
    'Bodyweight Squats & Sissy Squats',
    'https://www.youtube.com/watch?v=gsNoPYwWXeM',
    'Creator: Calisthenicmovement | 3 sets of 12–20 reps. Emphasize full knee flexion to stretch the rectus femoris.'
  ),
  (
    'd3000000-0000-0000-0000-000000000009',
    'b3000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000057',
    2,
    3,
    15,
    'Deficit Single-Leg Calf Raises',
    'https://www.youtube.com/watch?v=-AOpemH7Tb4',
    'Creator: Calisthenicmovement | 3 sets of 12–20 reps. Perform on stair ledge with 2-second pause at full deep stretch.'
  ),
  (
    'd3000000-0000-0000-0000-000000000010',
    'b3000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000060',
    3,
    3,
    12,
    'Hanging Leg / Knee Raise',
    'https://www.youtube.com/watch?v=QyVq5oUBpss',
    'Creator: FitnessFAQs (Daniel Vadnal) | 3 sets of 10–15 reps. Posterior pelvic tilt curling pelvis toward chest without swinging.'
  ),
  (
    'd3000000-0000-0000-0000-000000000011',
    'b3000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000016',
    4,
    3,
    20,
    'Follow-Along 6-Pack Abs & Core Circuit',
    'https://www.youtube.com/watch?v=BElgcWsChSs',
    'Creator: CHRIS HERIA | 3 rounds of continuous bodyweight core exercises (hollow hold, flutter kicks, planks).'
  ),

  -- Day 3: Full Body Overload & Weak Point Progression
  (
    'd3000000-0000-0000-0000-000000000012',
    'b3000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000066',
    0,
    3,
    15,
    'Deficit Push-Ups / Diamond Push-Ups',
    'https://www.youtube.com/watch?v=IODxDxX7oi4',
    'Creator: Calisthenicmovement | 3 sets of 12–20 reps. 3s eccentric descent pausing 1s at bottom stretch.'
  ),
  (
    'd3000000-0000-0000-0000-000000000013',
    'b3000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000067',
    1,
    3,
    8,
    'Pull-Ups (Slow Eccentric Negatives)',
    'https://www.youtube.com/watch?v=MhokcbRLP5w',
    'Creator: FitnessFAQs | 3 sets of 6–10 reps. 4-second slow descent for intense mechanical tension.'
  ),
  (
    'd3000000-0000-0000-0000-000000000014',
    'b3000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000070',
    2,
    3,
    10,
    'Elevated Pike Push-Ups',
    'https://www.youtube.com/watch?v=-VNRSqOMH30',
    'Creator: FitnessFAQs | 3 sets of 8–12 reps. Elevate feet on chair/bed to increase deltoid load.'
  ),
  (
    'd3000000-0000-0000-0000-000000000015',
    'b3000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000042',
    3,
    3,
    12,
    'Pause-Rep Bulgarian Split Squats',
    'https://www.youtube.com/watch?v=SkNsa3eBwLA',
    'Creator: Max Euceda | 3 sets of 10–15 reps per leg. 2-second pause at bottom lengthened position.'
  ),
  (
    'd3000000-0000-0000-0000-000000000016',
    'b3000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000071',
    4,
    3,
    10,
    'Bodyweight Dips / Chair Dips',
    'https://www.youtube.com/watch?v=2z8JmcrW-As',
    'Creator: Calisthenicmovement | 3 sets of 10–15 reps. Strict form to muscular failure.'
  ),
  (
    'd3000000-0000-0000-0000-000000000017',
    'b3000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000068',
    5,
    3,
    10,
    'Bodyweight Arm Hypertrophy (Chin-Up Holds & Extensions)',
    'https://www.youtube.com/watch?v=rVsCjJ-GFPY',
    'Creator: Calisthenicmovement | 3 sets of 8–15 reps. High time under tension for arm muscle growth.'
  )
ON CONFLICT (id) DO UPDATE SET
  exercise_id = EXCLUDED.exercise_id,
  sort_order = EXCLUDED.sort_order,
  sets = EXCLUDED.sets,
  reps = EXCLUDED.reps,
  source_label = EXCLUDED.source_label,
  video_url = EXCLUDED.video_url,
  source_prescription_text = EXCLUDED.source_prescription_text;
