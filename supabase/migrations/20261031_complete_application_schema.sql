-- =====================================================================
-- EQUINOX INTERNSHIP DRIVE - COMPLETE APPLICATION INTEGRATION MIGRATION
-- File: supabase/migrations/20261031_complete_application_schema.sql
-- =====================================================================

-- 1. Schema Alignment: Add dedicated snapshot columns & dynamic answers JSONB to public.applications
DO $$
BEGIN
  -- Snapshot candidate name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'student_name'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN student_name text;
  END IF;

  -- Snapshot candidate email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'student_email'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN student_email text;
  END IF;

  -- Snapshot candidate phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'student_phone'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN student_phone text;
  END IF;

  -- Snapshot candidate college/institute
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'college'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN college text;
  END IF;

  -- Snapshot candidate branch/course
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'course_branch'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN course_branch text;
  END IF;

  -- Snapshot candidate CNF number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'cnf_number'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN cnf_number text;
  END IF;

  -- Snapshot preferred role title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'role_title'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN role_title text;
  END IF;

  -- Dedicated columns for skills, portfolio_url, availability, video_url (ensure present)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'skills'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN skills text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'portfolio_url'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN portfolio_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'availability'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN availability text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN video_url text;
  END IF;

  -- Dynamic answers JSONB to capture every custom/dynamic question-and-answer response
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'answers'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 2. Indexes for efficient lookup and admin filtering
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON public.applications (internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications (created_at DESC);

-- 3. Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated, service_role;
