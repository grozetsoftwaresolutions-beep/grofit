-- Phase 4 Schema: Workout Progress Tracking
-- Adheres strictly to docs/08-database.md (Section 8) and docs/05-domain-logic-reviewed.md (Section 6)

-- 1. Create workout_logs table
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  logged_on DATE NOT NULL,
  sets_completed INTEGER CHECK (sets_completed IS NULL OR (sets_completed >= 1 AND sets_completed <= 20)),
  reps_completed INTEGER CHECK (reps_completed IS NULL OR (reps_completed >= 1 AND reps_completed <= 200)),
  external_load NUMERIC(6, 2),
  external_load_unit TEXT,
  is_bodyweight BOOLEAN NOT NULL DEFAULT false,
  notes TEXT CHECK (notes IS NULL OR length(trim(notes)) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),

  -- Enforce mutually exclusive and valid load/bodyweight combinations:
  -- 1. Bodyweight: is_bodyweight = true, external_load and unit MUST be NULL
  -- 2. External Load: is_bodyweight = false, external_load > 0, unit IN ('kg', 'lbs')
  -- 3. No Load: is_bodyweight = false, external_load and unit MUST be NULL
  CONSTRAINT check_workout_logs_load_semantics CHECK (
    (is_bodyweight = true AND external_load IS NULL AND external_load_unit IS NULL)
    OR
    (is_bodyweight = false AND external_load IS NOT NULL AND external_load > 0 AND external_load_unit IN ('kg', 'lbs'))
    OR
    (is_bodyweight = false AND external_load IS NULL AND external_load_unit IS NULL)
  )
);

-- 2. Indexes for efficient user-scoped queries and chronological ordering
CREATE INDEX idx_workout_logs_user_exercise ON public.workout_logs (user_id, exercise_id, logged_on DESC);
CREATE INDEX idx_workout_logs_user_logged_on ON public.workout_logs (user_id, logged_on DESC);

-- 3. Trigger for updated_at and immutable field protection
CREATE TRIGGER on_workout_logs_updated
  BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 4. Permissions & Grants (Least Privilege)
REVOKE ALL ON public.workout_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT ALL ON public.workout_logs TO postgres, service_role;

-- 5. Row Level Security (RLS)
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout logs" ON public.workout_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs" ON public.workout_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs" ON public.workout_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs" ON public.workout_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
