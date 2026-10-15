-- Phase 3 Schema: Curated Workout Content and Personal Workout Plans

-- 1. Curated Workout Content Tables

-- 1.1 Canonical Exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT,
  source_reference TEXT,
  source_key TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- 1.2 Workout Templates
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source_reference TEXT NOT NULL,
  source_key TEXT NOT NULL UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- 1.3 Template Days
CREATE TABLE public.template_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  day_number INTEGER CHECK (day_number IS NULL OR day_number > 0),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_template_days_sort UNIQUE (template_id, sort_order),
  CONSTRAINT uq_template_days_number UNIQUE (template_id, day_number)
);

-- 1.4 Template Entries
CREATE TABLE public.template_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_day_id UUID NOT NULL REFERENCES public.template_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  sets INTEGER CHECK (sets IS NULL OR (sets >= 1 AND sets <= 20)),
  reps INTEGER CHECK (reps IS NULL OR (reps >= 1 AND reps <= 200)),
  source_label TEXT,
  video_url TEXT,
  source_reference TEXT,
  source_prescription_text TEXT,
  source_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_template_entries_sort UNIQUE (template_day_id, sort_order)
);

-- 1.5 Warm-ups
CREATE TABLE public.warmups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_day_id UUID NOT NULL REFERENCES public.template_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_warmups_sort UNIQUE (template_day_id, sort_order)
);

-- 2. User-Owned Personal Workout Plans Tables

-- 2.1 Workout Plans
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  source_template_name_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_workout_plans_id_user UNIQUE (id, user_id)
);

-- 2.2 Workout Plan Days
CREATE TABLE public.workout_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_template_day_id UUID REFERENCES public.template_days(id) ON DELETE SET NULL,
  day_number INTEGER CHECK (day_number IS NULL OR day_number > 0),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT fk_workout_plan_days_plan FOREIGN KEY (workout_plan_id, user_id) REFERENCES public.workout_plans(id, user_id) ON DELETE CASCADE,
  CONSTRAINT uq_workout_plan_days_id_user UNIQUE (id, user_id),
  CONSTRAINT uq_workout_plan_days_sort UNIQUE (workout_plan_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

-- 2.3 Workout Plan Entries
CREATE TABLE public.workout_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_plan_day_id UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  exercise_name_snapshot TEXT NOT NULL,
  source_template_entry_id UUID REFERENCES public.template_entries(id) ON DELETE SET NULL,
  source_label TEXT,
  video_url TEXT,
  source_sets INTEGER CHECK (source_sets IS NULL OR (source_sets >= 1 AND source_sets <= 20)),
  source_reps INTEGER CHECK (source_reps IS NULL OR (source_reps >= 1 AND source_reps <= 200)),
  source_prescription_text TEXT,
  sets INTEGER CHECK (sets IS NULL OR (sets >= 1 AND sets <= 20)),
  reps INTEGER CHECK (reps IS NULL OR (reps >= 1 AND reps <= 200)),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT fk_workout_plan_entries_day FOREIGN KEY (workout_plan_day_id, user_id) REFERENCES public.workout_plan_days(id, user_id) ON DELETE CASCADE,
  CONSTRAINT uq_workout_plan_entries_sort UNIQUE (workout_plan_day_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

-- 3. Triggers for updated_at Maintenance
CREATE TRIGGER on_exercises_updated
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER on_workout_templates_updated
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER on_workout_plans_updated
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER on_workout_plan_days_updated
  BEFORE UPDATE ON public.workout_plan_days
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER on_workout_plan_entries_updated
  BEFORE UPDATE ON public.workout_plan_entries
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 4. Permissions & Grants (Least Privilege)

-- Revoke all default privileges from public roles
REVOKE ALL ON public.exercises FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.workout_templates FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.template_days FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.template_entries FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.warmups FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.workout_plans FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.workout_plan_days FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.workout_plan_entries FROM PUBLIC, anon, authenticated;

-- Curated tables: Read-only for authenticated users
GRANT SELECT ON public.exercises TO authenticated;
GRANT SELECT ON public.workout_templates TO authenticated;
GRANT SELECT ON public.template_days TO authenticated;
GRANT SELECT ON public.template_entries TO authenticated;
GRANT SELECT ON public.warmups TO authenticated;

-- User-owned tables: Full CRUD for authenticated users (enforced by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plan_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plan_entries TO authenticated;

-- Internal / Admin role full access
GRANT ALL ON public.exercises TO postgres, service_role;
GRANT ALL ON public.workout_templates TO postgres, service_role;
GRANT ALL ON public.template_days TO postgres, service_role;
GRANT ALL ON public.template_entries TO postgres, service_role;
GRANT ALL ON public.warmups TO postgres, service_role;
GRANT ALL ON public.workout_plans TO postgres, service_role;
GRANT ALL ON public.workout_plan_days TO postgres, service_role;
GRANT ALL ON public.workout_plan_entries TO postgres, service_role;

-- 5. Row Level Security (RLS)

-- 5.1 Enable RLS on all tables
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warmups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_entries ENABLE ROW LEVEL SECURITY;

-- 5.2 Curated Content RLS Policies
CREATE POLICY "Authenticated users can view active exercises"
  ON public.exercises FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can view published templates"
  ON public.workout_templates FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Authenticated users can view days of published templates"
  ON public.template_days FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workout_templates t
    WHERE t.id = template_days.template_id AND t.is_published = true
  ));

CREATE POLICY "Authenticated users can view entries of published templates"
  ON public.template_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.template_days td
    JOIN public.workout_templates t ON t.id = td.template_id
    WHERE td.id = template_entries.template_day_id AND t.is_published = true
  ));

CREATE POLICY "Authenticated users can view warmups of published templates"
  ON public.warmups FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.template_days td
    JOIN public.workout_templates t ON t.id = td.template_id
    WHERE td.id = warmups.template_day_id AND t.is_published = true
  ));

-- 5.3 User-Owned Workout Plans RLS Policies
CREATE POLICY "Users can view own plans"
  ON public.workout_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON public.workout_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON public.workout_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON public.workout_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5.4 Workout Plan Days RLS Policies
CREATE POLICY "Users can view own plan days"
  ON public.workout_plan_days FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan days"
  ON public.workout_plan_days FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan days"
  ON public.workout_plan_days FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plan days"
  ON public.workout_plan_days FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5.5 Workout Plan Entries RLS Policies
CREATE POLICY "Users can view own plan entries"
  ON public.workout_plan_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan entries"
  ON public.workout_plan_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan entries"
  ON public.workout_plan_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plan entries"
  ON public.workout_plan_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. Atomic Replace and Merge RPC Function
CREATE OR REPLACE FUNCTION public.apply_workout_template(
  p_plan_id UUID,
  p_template_id UUID,
  p_mode TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_plan_name TEXT;
  v_template_name TEXT;
  v_template_is_published BOOLEAN;
  v_day_record RECORD;
  v_entry_record RECORD;
  v_target_day_id UUID;
  v_next_day_sort INTEGER;
  v_next_entry_sort INTEGER;
  v_days_applied INTEGER := 0;
  v_entries_applied INTEGER := 0;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  -- 2. Validate mode
  IF p_mode NOT IN ('replace', 'merge') THEN
    RAISE EXCEPTION 'INVALID_MODE' USING ERRCODE = '22023';
  END IF;

  -- 3. Verify plan ownership
  SELECT name INTO v_plan_name
  FROM public.workout_plans
  WHERE id = p_plan_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- 4. Verify template exists and is published
  SELECT name, is_published INTO v_template_name, v_template_is_published
  FROM public.workout_templates
  WHERE id = p_template_id;

  IF NOT FOUND OR v_template_is_published IS NOT TRUE THEN
    RAISE EXCEPTION 'TEMPLATE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- 5. Execution based on mode
  IF p_mode = 'replace' THEN
    -- Delete all existing days for this plan (entries cascade automatically)
    DELETE FROM public.workout_plan_days
    WHERE workout_plan_id = p_plan_id AND user_id = v_user_id;

    -- Update plan header provenance
    UPDATE public.workout_plans
    SET source_template_id = p_template_id,
        source_template_name_snapshot = v_template_name,
        updated_at = pg_catalog.now()
    WHERE id = p_plan_id AND user_id = v_user_id;

    -- Copy all days and entries from template
    FOR v_day_record IN
      SELECT id, day_number, name, sort_order
      FROM public.template_days
      WHERE template_id = p_template_id
      ORDER BY sort_order ASC
    LOOP
      INSERT INTO public.workout_plan_days (
        workout_plan_id,
        user_id,
        source_template_day_id,
        day_number,
        name,
        sort_order
      ) VALUES (
        p_plan_id,
        v_user_id,
        v_day_record.id,
        v_day_record.day_number,
        v_day_record.name,
        v_day_record.sort_order
      ) RETURNING id INTO v_target_day_id;

      v_days_applied := v_days_applied + 1;

      -- Copy entries for this day
      FOR v_entry_record IN
        SELECT te.id AS template_entry_id,
               te.exercise_id,
               e.name AS exercise_name,
               te.sort_order,
               te.sets,
               te.reps,
               te.source_label,
               te.video_url,
               te.source_prescription_text
        FROM public.template_entries te
        JOIN public.exercises e ON e.id = te.exercise_id
        WHERE te.template_day_id = v_day_record.id
        ORDER BY te.sort_order ASC
      LOOP
        INSERT INTO public.workout_plan_entries (
          user_id,
          workout_plan_day_id,
          exercise_id,
          exercise_name_snapshot,
          source_template_entry_id,
          source_label,
          video_url,
          source_sets,
          source_reps,
          source_prescription_text,
          sets,
          reps,
          sort_order
        ) VALUES (
          v_user_id,
          v_target_day_id,
          v_entry_record.exercise_id,
          v_entry_record.exercise_name,
          v_entry_record.template_entry_id,
          v_entry_record.source_label,
          v_entry_record.video_url,
          v_entry_record.sets,
          v_entry_record.reps,
          v_entry_record.source_prescription_text,
          v_entry_record.sets,
          v_entry_record.reps,
          v_entry_record.sort_order
        );

        v_entries_applied := v_entries_applied + 1;
      END LOOP;
    END LOOP;

  ELSIF p_mode = 'merge' THEN
    -- Merge mode: append template days/entries while ensuring idempotency on retry
    FOR v_day_record IN
      SELECT id, day_number, name, sort_order
      FROM public.template_days
      WHERE template_id = p_template_id
      ORDER BY sort_order ASC
    LOOP
      -- Check if this template day was already imported into this plan
      SELECT id INTO v_target_day_id
      FROM public.workout_plan_days
      WHERE workout_plan_id = p_plan_id
        AND user_id = v_user_id
        AND source_template_day_id = v_day_record.id;

      IF v_target_day_id IS NULL THEN
        -- Get next sort_order for days
        SELECT COALESCE(MAX(sort_order) + 1, 0) INTO v_next_day_sort
        FROM public.workout_plan_days
        WHERE workout_plan_id = p_plan_id AND user_id = v_user_id;

        INSERT INTO public.workout_plan_days (
          workout_plan_id,
          user_id,
          source_template_day_id,
          day_number,
          name,
          sort_order
        ) VALUES (
          p_plan_id,
          v_user_id,
          v_day_record.id,
          v_day_record.day_number,
          v_day_record.name,
          v_next_day_sort
        ) RETURNING id INTO v_target_day_id;

        v_days_applied := v_days_applied + 1;
      END IF;

      -- Copy only entries not yet present in this day from this template entry
      FOR v_entry_record IN
        SELECT te.id AS template_entry_id,
               te.exercise_id,
               e.name AS exercise_name,
               te.sort_order,
               te.sets,
               te.reps,
               te.source_label,
               te.video_url,
               te.source_prescription_text
        FROM public.template_entries te
        JOIN public.exercises e ON e.id = te.exercise_id
        WHERE te.template_day_id = v_day_record.id
          AND NOT EXISTS (
            SELECT 1 FROM public.workout_plan_entries wpe
            WHERE wpe.workout_plan_day_id = v_target_day_id
              AND wpe.user_id = v_user_id
              AND wpe.source_template_entry_id = te.id
          )
        ORDER BY te.sort_order ASC
      LOOP
        SELECT COALESCE(MAX(sort_order) + 1, 0) INTO v_next_entry_sort
        FROM public.workout_plan_entries
        WHERE workout_plan_day_id = v_target_day_id AND user_id = v_user_id;

        INSERT INTO public.workout_plan_entries (
          user_id,
          workout_plan_day_id,
          exercise_id,
          exercise_name_snapshot,
          source_template_entry_id,
          source_label,
          video_url,
          source_sets,
          source_reps,
          source_prescription_text,
          sets,
          reps,
          sort_order
        ) VALUES (
          v_user_id,
          v_target_day_id,
          v_entry_record.exercise_id,
          v_entry_record.exercise_name,
          v_entry_record.template_entry_id,
          v_entry_record.source_label,
          v_entry_record.video_url,
          v_entry_record.sets,
          v_entry_record.reps,
          v_entry_record.source_prescription_text,
          v_entry_record.sets,
          v_entry_record.reps,
          v_next_entry_sort
        );

        v_entries_applied := v_entries_applied + 1;
      END LOOP;
    END LOOP;

    UPDATE public.workout_plans
    SET updated_at = pg_catalog.now()
    WHERE id = p_plan_id AND user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'planId', p_plan_id,
    'templateId', p_template_id,
    'mode', p_mode,
    'daysApplied', v_days_applied,
    'entriesApplied', v_entries_applied
  );
END;
$$;

-- Grant execution to authenticated users
REVOKE ALL ON FUNCTION public.apply_workout_template(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_workout_template(UUID, UUID, TEXT) TO authenticated, service_role;

-- 7. Seed Initial Curated Content (Idempotent)

-- 7.1 Canonical Exercises
INSERT INTO public.exercises (id, name, muscle_group, source_reference, source_key, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Barbell row', 'Back', 'Finalized Workout.pdf', 'ex_barbell_row', true),
  ('c1000000-0000-0000-0000-000000000002', 'Lat pull down', 'Back', 'Finalized Workout.pdf', 'ex_lat_pull_down', true),
  ('c1000000-0000-0000-0000-000000000003', 'Lat focused row', 'Back', 'Finalized Workout.pdf', 'ex_lat_focused_row', true),
  ('c1000000-0000-0000-0000-000000000004', 'Close grip lat pulldown', 'Back', 'Finalized Workout.pdf', 'ex_close_grip_lat_pulldown', true),
  ('c1000000-0000-0000-0000-000000000005', 'Dumbell hammer curl', 'Biceps', 'Finalized Workout.pdf', 'ex_dumbell_hammer_curl', true),
  ('c1000000-0000-0000-0000-000000000006', 'Incline dumbell curl', 'Biceps', 'Finalized Workout.pdf', 'ex_incline_dumbell_curl', true),
  ('c1000000-0000-0000-0000-000000000007', 'Wrist curl', 'Forearm', 'Finalized Workout.pdf', 'ex_wrist_curl', true),
  ('c1000000-0000-0000-0000-000000000008', 'Reverse wrist curl', 'Forearm', 'Finalized Workout.pdf', 'ex_reverse_wrist_curl', true),
  ('c1000000-0000-0000-0000-000000000009', 'Incline dumbell press', 'Chest', 'Finalized Workout.pdf', 'ex_incline_dumbell_press', true),
  ('c1000000-0000-0000-0000-000000000010', 'Flat dumbell press', 'Chest', 'Finalized Workout.pdf', 'ex_flat_dumbell_press', true),
  ('c1000000-0000-0000-0000-000000000011', 'Pec fly machine', 'Chest', 'Finalized Workout.pdf', 'ex_pec_fly_machine', true),
  ('c1000000-0000-0000-0000-000000000012', 'Skull crushers', 'Triceps', 'Finalized Workout.pdf', 'ex_skull_crushers', true),
  ('c1000000-0000-0000-0000-000000000013', 'Cable pushdown', 'Triceps', 'Finalized Workout.pdf', 'ex_cable_pushdown', true),
  ('c1000000-0000-0000-0000-000000000014', 'Overhead tricep extension', 'Triceps', 'Finalized Workout.pdf', 'ex_overhead_tricep_extension', true),
  ('c1000000-0000-0000-0000-000000000015', 'Crunches', 'Abs', 'Finalized Workout.pdf', 'ex_crunches', true),
  ('c1000000-0000-0000-0000-000000000016', 'Plank', 'Abs', 'Finalized Workout.pdf', 'ex_plank', true),
  ('c1000000-0000-0000-0000-000000000017', 'Shoulder press', 'Shoulder', 'Finalized Workout.pdf', 'ex_shoulder_press', true),
  ('c1000000-0000-0000-0000-000000000018', 'Lateral rises', 'Shoulder', 'Finalized Workout.pdf', 'ex_lateral_rises', true),
  ('c1000000-0000-0000-0000-000000000019', 'Face pull', 'Shoulder', 'Finalized Workout.pdf', 'ex_face_pull', true),
  ('c1000000-0000-0000-0000-000000000020', 'Squats', 'Legs', 'Finalized Workout.pdf', 'ex_squats', true),
  ('c1000000-0000-0000-0000-000000000021', 'Leg press', 'Legs', 'Finalized Workout.pdf', 'ex_leg_press', true),
  ('c1000000-0000-0000-0000-000000000022', 'Leg extension', 'Legs', 'Finalized Workout.pdf', 'ex_leg_extension', true),
  ('c1000000-0000-0000-0000-000000000023', 'Hamstring curls', 'Legs', 'Finalized Workout.pdf', 'ex_hamstring_curls', true),
  ('c1000000-0000-0000-0000-000000000024', 'Calves', 'Legs', 'Finalized Workout.pdf', 'ex_calves', true)
ON CONFLICT (source_key) DO UPDATE
SET name = EXCLUDED.name,
    muscle_group = EXCLUDED.muscle_group,
    source_reference = EXCLUDED.source_reference,
    is_active = EXCLUDED.is_active;

-- 7.2 Curated 6-Day Split Template
INSERT INTO public.workout_templates (id, name, description, source_reference, source_key, is_published, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Finalized Workout Split (6-Day)',
  'Curated 6-day workout split sourced directly from Finalized Workout.pdf.',
  'Finalized Workout.pdf',
  'template_finalized_workout_6day',
  true,
  0
)
ON CONFLICT (source_key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_reference = EXCLUDED.source_reference,
    is_published = EXCLUDED.is_published,
    sort_order = EXCLUDED.sort_order;

-- 7.3 Template Days
INSERT INTO public.template_days (id, template_id, day_number, name, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1, '1.MONDAY - [BACK] [BICEPS] [FOREARM]', 0),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 2, '2.TUESDAY - [CHEST] [TRICEPS] [ABS]', 1),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 3, '3.WEDNESDAY - [SHOULDER] [LEG]', 2),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 4, '4.THURSDAY - [BACK] [BICEPS] [FOREARM]', 3),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 5, '5.FRIDAY - [CHEST] [TRICEPS] [ABS]', 4),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 6, '6.SATURDAY - [SHOULDER] [LEG]', 5)
ON CONFLICT (template_id, sort_order) DO UPDATE
SET day_number = EXCLUDED.day_number,
    name = EXCLUDED.name;

-- 7.4 Warm-ups
INSERT INTO public.warmups (id, template_day_id, name, description, sort_order, source_reference)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'pull ups', 'pull ups 5 reps', 0, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'pushups', '10 rep', 0, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'pec fly', '10 rep (5kg)', 1, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'shoulder press', '10 rep (2.5kg)', 0, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003', 'lateral rises', '5 rep (2.5kg)', 1, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000004', 'pull ups', 'pull ups 5 reps', 0, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000005', 'pushups', '10 rep', 0, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005', 'pec fly', '10 rep (5kg)', 1, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000006', 'shoulder press', '10 rep (2.5kg)', 0, 'Finalized Workout.pdf'),
  ('e1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000006', 'lateral rises', '5 rep (2.5kg)', 1, 'Finalized Workout.pdf')
ON CONFLICT (template_day_id, sort_order) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_reference = EXCLUDED.source_reference;

-- 7.5 Template Entries (Day 1 - Monday)
INSERT INTO public.template_entries (id, template_day_id, exercise_id, sort_order, sets, reps, source_label, video_url, source_reference, source_key)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 0, NULL, NULL, 'barbell row', 'https://www.youtube.com/shorts/HRo7m_Dfpxw', 'DeltaBolic', 'te_d1_0'),
  ('d1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 1, NULL, NULL, 'lat pull down', 'https://www.youtube.com/watch?v=O94yEoGXtBY', 'Jeff Nippard', 'te_d1_1'),
  ('d1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 2, NULL, NULL, 'lat focused row', 'https://www.youtube.com/shorts/q8E9XaizZpY', 'DeltaBolic', 'te_d1_2'),
  ('d1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 3, NULL, NULL, 'close grip lat pulldown', 'https://www.youtube.com/watch?v=hkZWmvkbNNQ', 'ThriveTraining', 'te_d1_3'),
  ('d1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 4, NULL, NULL, 'dumbell hammer curl', 'https://www.youtube.com/watch?v=8XLxfXROrTo', 'Scott Herman Fitness', 'te_d1_4'),
  ('d1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 5, NULL, NULL, 'incline dumbell curl', 'https://www.youtube.com/watch?v=soxrZlIl35U', 'Scott Herman Fitness', 'te_d1_5'),
  ('d1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 6, NULL, NULL, 'wrist curl', 'https://www.youtube.com/watch?v=2wPpcJBe03o', 'Renaissance Periodization', 'te_d1_6'),
  ('d1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000008', 7, NULL, NULL, 'reverse wrist curl', 'https://www.youtube.com/watch?v=FW7URAaC-vE', 'Scott Herman Fitness', 'te_d1_7')
ON CONFLICT (source_key) DO UPDATE
SET sets = EXCLUDED.sets, reps = EXCLUDED.reps, source_label = EXCLUDED.source_label, video_url = EXCLUDED.video_url, source_reference = EXCLUDED.source_reference;

-- 7.6 Template Entries (Day 2 - Tuesday)
INSERT INTO public.template_entries (id, template_day_id, exercise_id, sort_order, sets, reps, source_label, video_url, source_reference, source_prescription_text, source_key)
VALUES
  ('d1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000009', 0, NULL, NULL, 'incline dumbell press', 'https://www.youtube.com/watch?v=GHcAIiL9J_Y', 'Renaissance Periodization', NULL, 'te_d2_0'),
  ('d1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000010', 1, NULL, NULL, 'flat dumbell press', 'https://www.youtube.com/watch?v=QsYre__-aro', 'Jeremy Ethier', NULL, 'te_d2_1'),
  ('d1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000011', 2, NULL, NULL, 'pec fly machine', 'https://www.youtube.com/shorts/a9vQ_hwIksU', 'DeltaBolic', NULL, 'te_d2_2'),
  ('d1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000012', 3, 4, NULL, 'skull crushers ×4', 'https://www.youtube.com/watch?v=8t2a93BjDec', 'Renaissance Periodization', '×4', 'te_d2_3'),
  ('d1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000013', 4, 4, NULL, 'Cable pushdown ×4', 'https://www.youtube.com/watch?v=lIqJXGQYyvM', 'Scott Herman Fitness', '×4', 'te_d2_4'),
  ('d1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000014', 5, NULL, NULL, 'overhead tricep extension', 'https://www.youtube.com/watch?v=IaJWPqP-Bjo', 'Renaissance Periodization', NULL, 'te_d2_5'),
  ('d1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000015', 6, NULL, NULL, 'crunches', 'https://www.youtube.com/watch?v=Evhyg6Fs9Q8', 'Scott Herman Fitness', NULL, 'te_d2_6'),
  ('d1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000016', 7, NULL, NULL, 'plank', 'https://www.youtube.com/shorts/vmxWjL0LjV4', 'Squat University', NULL, 'te_d2_7')
ON CONFLICT (source_key) DO UPDATE
SET sets = EXCLUDED.sets, reps = EXCLUDED.reps, source_label = EXCLUDED.source_label, video_url = EXCLUDED.video_url, source_reference = EXCLUDED.source_reference;

-- 7.7 Template Entries (Day 3 - Wednesday)
INSERT INTO public.template_entries (id, template_day_id, exercise_id, sort_order, sets, reps, source_label, video_url, source_reference, source_key)
VALUES
  ('d1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000017', 0, NULL, NULL, 'Shoulder press', 'https://www.youtube.com/watch?v=GFblCmuEE18', 'Scott Herman Fitness', 'te_d3_0'),
  ('d1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000018', 1, NULL, NULL, 'lateral rises', 'https://www.youtube.com/watch?v=n5dsI9qQXwY', 'Renaissance Periodization', 'te_d3_1'),
  ('d1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000019', 2, NULL, NULL, 'Face pull', 'https://www.youtube.com/watch?v=ljgqer1ZpXg', 'ATHLEAN-X™', 'te_d3_2'),
  ('d1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000020', 3, NULL, NULL, 'squats', 'https://www.youtube.com/watch?v=5alpa1IikQM', 'Squat University', 'te_d3_3'),
  ('d1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000021', 4, NULL, NULL, 'leg press', 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', 'Scott Herman Fitness', 'te_d3_4'),
  ('d1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000022', 5, NULL, NULL, 'leg extension', 'https://www.youtube.com/watch?v=ljO4jkwv8wQ', 'Jeff Nippard', 'te_d3_5'),
  ('d1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000023', 6, NULL, NULL, 'hamstring curls', 'https://www.youtube.com/watch?v=jobEeklwrrs', 'Renaissance Periodization', 'te_d3_6'),
  ('d1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000024', 7, NULL, NULL, 'calves', 'https://www.youtube.com/shorts/xK6DoHBXTdw', 'Jeff Nippard', 'te_d3_7')
ON CONFLICT (source_key) DO UPDATE
SET sets = EXCLUDED.sets, reps = EXCLUDED.reps, source_label = EXCLUDED.source_label, video_url = EXCLUDED.video_url, source_reference = EXCLUDED.source_reference;

-- 7.8 Template Entries (Day 4 - Thursday)
INSERT INTO public.template_entries (id, template_day_id, exercise_id, sort_order, sets, reps, source_label, video_url, source_reference, source_key)
VALUES
  ('d1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 0, NULL, NULL, 'barbell row', 'https://www.youtube.com/shorts/HRo7m_Dfpxw', 'DeltaBolic', 'te_d4_0'),
  ('d1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 1, NULL, NULL, 'lat pull down', 'https://www.youtube.com/watch?v=O94yEoGXtBY', 'Jeff Nippard', 'te_d4_1'),
  ('d1000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 2, NULL, NULL, 'lat focused row', 'https://www.youtube.com/shorts/q8E9XaizZpY', 'DeltaBolic', 'te_d4_2'),
  ('d1000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 3, NULL, NULL, 'close grip lat pulldown', 'https://www.youtube.com/watch?v=hkZWmvkbNNQ', 'ThriveTraining', 'te_d4_3'),
  ('d1000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000005', 4, NULL, NULL, 'dumbell hammer curl', 'https://www.youtube.com/watch?v=8XLxfXROrTo', 'Scott Herman Fitness', 'te_d4_4'),
  ('d1000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000006', 5, NULL, NULL, 'incline dumbell curl', 'https://www.youtube.com/watch?v=soxrZlIl35U', 'Scott Herman Fitness', 'te_d4_5'),
  ('d1000000-0000-0000-0000-000000000031', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000007', 6, NULL, NULL, 'wrist curl', 'https://www.youtube.com/watch?v=2wPpcJBe03o', 'Renaissance Periodization', 'te_d4_6'),
  ('d1000000-0000-0000-0000-000000000032', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000008', 7, NULL, NULL, 'reverse wrist curl', 'https://www.youtube.com/watch?v=FW7URAaC-vE', 'Scott Herman Fitness', 'te_d4_7')
ON CONFLICT (source_key) DO UPDATE
SET sets = EXCLUDED.sets, reps = EXCLUDED.reps, source_label = EXCLUDED.source_label, video_url = EXCLUDED.video_url, source_reference = EXCLUDED.source_reference;

-- 7.9 Template Entries (Day 5 - Friday)
INSERT INTO public.template_entries (id, template_day_id, exercise_id, sort_order, sets, reps, source_label, video_url, source_reference, source_prescription_text, source_key)
VALUES
  ('d1000000-0000-0000-0000-000000000033', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000009', 0, NULL, NULL, 'incline dumbell press', 'https://www.youtube.com/watch?v=GHcAIiL9J_Y', 'Renaissance Periodization', NULL, 'te_d5_0'),
  ('d1000000-0000-0000-0000-000000000034', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000010', 1, NULL, NULL, 'flat dumbell press', 'https://www.youtube.com/watch?v=QsYre__-aro', 'Jeremy Ethier', NULL, 'te_d5_1'),
  ('d1000000-0000-0000-0000-000000000035', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000011', 2, NULL, NULL, 'pec fly machine', 'https://www.youtube.com/shorts/a9vQ_hwIksU', 'DeltaBolic', NULL, 'te_d5_2'),
  ('d1000000-0000-0000-0000-000000000036', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000012', 3, 4, NULL, 'skull crushers ×4', 'https://www.youtube.com/watch?v=8t2a93BjDec', 'Renaissance Periodization', '×4', 'te_d5_3'),
  ('d1000000-0000-0000-0000-000000000037', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000013', 4, 4, NULL, 'Cable pushdown ×4', 'https://www.youtube.com/watch?v=lIqJXGQYyvM', 'Scott Herman Fitness', '×4', 'te_d5_4'),
  ('d1000000-0000-0000-0000-000000000038', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000014', 5, NULL, NULL, 'overhead tricep extension', 'https://www.youtube.com/watch?v=IaJWPqP-Bjo', 'Renaissance Periodization', NULL, 'te_d5_5'),
  ('d1000000-0000-0000-0000-000000000039', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000015', 6, NULL, NULL, 'crunches', 'https://www.youtube.com/watch?v=Evhyg6Fs9Q8', 'Scott Herman Fitness', NULL, 'te_d5_6'),
  ('d1000000-0000-0000-0000-000000000040', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000016', 7, NULL, NULL, 'plank', 'https://www.youtube.com/shorts/vmxWjL0LjV4', 'Squat University', NULL, 'te_d5_7')
ON CONFLICT (source_key) DO UPDATE
SET sets = EXCLUDED.sets, reps = EXCLUDED.reps, source_label = EXCLUDED.source_label, video_url = EXCLUDED.video_url, source_reference = EXCLUDED.source_reference;

-- 7.10 Template Entries (Day 6 - Saturday)
INSERT INTO public.template_entries (id, template_day_id, exercise_id, sort_order, sets, reps, source_label, video_url, source_reference, source_key)
VALUES
  ('d1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000017', 0, NULL, NULL, 'Shoulder press', 'https://www.youtube.com/watch?v=GFblCmuEE18', 'Scott Herman Fitness', 'te_d6_0'),
  ('d1000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000018', 1, NULL, NULL, 'lateral rises', 'https://www.youtube.com/watch?v=n5dsI9qQXwY', 'Renaissance Periodization', 'te_d6_1'),
  ('d1000000-0000-0000-0000-000000000043', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000019', 2, NULL, NULL, 'Face pull', 'https://www.youtube.com/watch?v=ljgqer1ZpXg', 'ATHLEAN-X™', 'te_d3_2'),
  ('d1000000-0000-0000-0000-000000000044', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000020', 3, NULL, NULL, 'squats', 'https://www.youtube.com/watch?v=5alpa1IikQM', 'Squat University', 'te_d6_3'),
  ('d1000000-0000-0000-0000-000000000045', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000021', 4, NULL, NULL, 'leg press', 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', 'Scott Herman Fitness', 'te_d6_4'),
  ('d1000000-0000-0000-0000-000000000046', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000022', 5, NULL, NULL, 'leg extension', 'https://www.youtube.com/watch?v=ljO4jkwv8wQ', 'Jeff Nippard', 'te_d6_5'),
  ('d1000000-0000-0000-0000-000000000047', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000023', 6, NULL, NULL, 'hamstring curls', 'https://www.youtube.com/watch?v=jobEeklwrrs', 'Renaissance Periodization', 'te_d6_6'),
  ('d1000000-0000-0000-0000-000000000048', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000024', 7, NULL, NULL, 'calves', 'https://www.youtube.com/shorts/xK6DoHBXTdw', 'Jeff Nippard', 'te_d6_7')
ON CONFLICT (source_key) DO UPDATE
SET sets = EXCLUDED.sets, reps = EXCLUDED.reps, source_label = EXCLUDED.source_label, video_url = EXCLUDED.video_url, source_reference = EXCLUDED.source_reference;

