-- ==============================================================================
-- Migration: Phase 8 - Evidence-Based Cricket Workout Program for Intermediate
-- Adds 6-day cricket athletic performance template (lower power, acceleration,
-- shoulder resilience, speed/agility, recovery/mobility, rotational core).
-- ==============================================================================

-- 1. Insert Workout Template
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
  'a4000000-0000-0000-0000-000000000001',
  'template_cricket_intermediate_6day',
  'Evidence-Based Cricket Workout Program for Intermediate',
  'Evidence-based 6-day athletic conditioning, power, and hypertrophy program tailored for intermediate cricket players. Integrates lower body acceleration, upper body shoulder resilience, rotational power, agility, and mobility with verified tutorial demonstrations.',
  'Renaissance Periodization, Jeff Nippard, Squat University, Overtime Athletes, Eric Cressey, E3 Rehab',
  true,
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_reference = EXCLUDED.source_reference,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

-- 2. Insert Template Days
INSERT INTO public.template_days (id, template_id, day_number, name, sort_order)
VALUES
  (
    'b4000000-0000-0000-0000-000000000001',
    'a4000000-0000-0000-0000-000000000001',
    1,
    'Monday: Lower Strength + Acceleration',
    0
  ),
  (
    'b4000000-0000-0000-0000-000000000002',
    'a4000000-0000-0000-0000-000000000001',
    2,
    'Tuesday: Upper Strength + Shoulder',
    1
  ),
  (
    'b4000000-0000-0000-0000-000000000003',
    'a4000000-0000-0000-0000-000000000001',
    3,
    'Wednesday: Speed + Agility + Conditioning',
    2
  ),
  (
    'b4000000-0000-0000-0000-000000000004',
    'a4000000-0000-0000-0000-000000000001',
    4,
    'Thursday: Recovery + Mobility',
    3
  ),
  (
    'b4000000-0000-0000-0000-000000000005',
    'a4000000-0000-0000-0000-000000000001',
    5,
    'Friday: Lower Power + Plyometrics',
    4
  ),
  (
    'b4000000-0000-0000-0000-000000000006',
    'a4000000-0000-0000-0000-000000000001',
    6,
    'Saturday: Upper Power + Rotational Core',
    5
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  day_number = EXCLUDED.day_number,
  sort_order = EXCLUDED.sort_order;

-- 3. Insert Warmups
INSERT INTO public.warmups (id, template_day_id, name, description, sort_order)
VALUES
  ('e4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000001', 'Dynamic Lower Body Activation', 'Leg swings, bodyweight glute bridges, and walking lunges (2 sets of 10 reps)', 0),
  ('e4000000-0000-0000-0000-000000000002', 'b4000000-0000-0000-0000-000000000002', 'Rotator Cuff & Scapular Activation', 'Band pull-aparts and arm circles (2 sets of 15 reps)', 0),
  ('e4000000-0000-0000-0000-000000000003', 'b4000000-0000-0000-0000-000000000003', 'Cardiovascular & Joint Prep', 'Light jog and ankle pogo hops for 3 minutes', 0),
  ('e4000000-0000-0000-0000-000000000004', 'b4000000-0000-0000-0000-000000000004', 'Diaphragmatic Breathing & Cat-Cow', 'Slow spinal flexions and deep abdominal breathing for 2 minutes', 0),
  ('e4000000-0000-0000-0000-000000000005', 'b4000000-0000-0000-0000-000000000005', 'Ankle Pogos & Hip Openers', '2 sets of 10–15 light springy bounces preparing Achilles tendons for takeoff forces', 0),
  ('e4000000-0000-0000-0000-000000000006', 'b4000000-0000-0000-0000-000000000006', 'Thoracic Windmills & Band Dislocates', '2 sets of 10 reps warming up rotational slings and overhead mobility', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
