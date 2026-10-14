-- Phase 1 Foundation Schema

-- Ensure private schema exists for secure internal functions
CREATE SCHEMA IF NOT EXISTS private;

-- Add explicit least-privilege schema permissions for private
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL,
  display_name TEXT
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Explicitly configure privileges (Least Privilege)
-- Revoke all default privileges just to be safe
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to select from their own profile
GRANT SELECT ON public.profiles TO authenticated;
-- Allow authenticated users to update ONLY display_name (preventing arbitrary ID or timestamp rewrites)
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

-- Postgres internal role needs full access (signup trigger runs as postgres)
GRANT ALL ON public.profiles TO postgres;

-- Create Policies
CREATE POLICY "Users can view own profile." ON public.profiles 
  FOR SELECT TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Function to handle updated_at safely (Invoker Security)
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  -- Strictly protect immutable fields from being modified even if policies fail
  NEW.created_at = OLD.created_at;
  NEW.id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Revoke execute from public to ensure only triggers can fire this
REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Function to handle new user signup (Security Definer)
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, pg_catalog.now(), pg_catalog.now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revoke execute from public
REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
