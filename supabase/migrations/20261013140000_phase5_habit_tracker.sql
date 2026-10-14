-- Phase 5 Schema: Habit Tracker
-- Adheres strictly to docs/08-database.md (Section 9) and docs/05-domain-logic-reviewed.md (Section 7)

-- 1. Ensure timezone column exists in profiles with default 'Asia/Kolkata'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- Grant update on timezone to authenticated users
GRANT UPDATE (display_name, timezone) ON public.profiles TO authenticated;

-- 2. Create habits table
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(trim(name)) <= 100),
  description TEXT CHECK (description IS NULL OR length(trim(description)) <= 500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_habits_id_user UNIQUE (id, user_id)
);

-- 3. Create habit_logs table
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL,
  completed_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),

  -- One completion per habit per calendar date
  CONSTRAINT uq_habit_logs_habit_date UNIQUE (habit_id, completed_on),

  -- Composite foreign key enforces parent-child ownership consistency
  CONSTRAINT fk_habit_logs_habit FOREIGN KEY (habit_id, user_id) REFERENCES public.habits(id, user_id) ON DELETE CASCADE,
  CONSTRAINT uq_habit_logs_id_user UNIQUE (id, user_id)
);

-- 4. Indexes for efficient user-scoped queries and streak calculations
CREATE INDEX idx_habits_user_active ON public.habits (user_id, is_active);
CREATE INDEX idx_habit_logs_user_date ON public.habit_logs (user_id, completed_on DESC);
CREATE INDEX idx_habit_logs_habit_date ON public.habit_logs (habit_id, completed_on DESC);

-- 5. Updated_at triggers
CREATE TRIGGER on_habits_updated
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER on_habit_logs_updated
  BEFORE UPDATE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 6. Permissions & Grants (Least Privilege)
REVOKE ALL ON public.habits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.habit_logs FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;

GRANT ALL ON public.habits TO postgres, service_role;
GRANT ALL ON public.habit_logs TO postgres, service_role;

-- 7. Row Level Security (RLS)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Habits RLS Policies
CREATE POLICY "Users can view own habits" ON public.habits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON public.habits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Habit Logs RLS Policies
CREATE POLICY "Users can view own habit logs" ON public.habit_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs" ON public.habit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs" ON public.habit_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs" ON public.habit_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
