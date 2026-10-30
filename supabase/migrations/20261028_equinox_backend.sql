-- =====================================================================
-- EQUINOX INTERNSHIP DRIVE - COMPLETE IDEMPOTENT PRODUCTION MIGRATION
-- File: supabase/migrations/20261028_equinox_backend.sql
-- =====================================================================

-- 1. Helper Function: is_admin (SECURITY DEFINER with fixed search_path to eliminate RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 2. Schema Alignment: Ensure public.profiles has updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 3. Durable Rate Limiter Table & Column Alignment
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  key text PRIMARY KEY,
  attempts int NOT NULL DEFAULT 1,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'auth_rate_limits'
      AND column_name = 'last_attempt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'auth_rate_limits'
      AND column_name = 'last_attempt_at'
  ) THEN
    ALTER TABLE public.auth_rate_limits RENAME COLUMN last_attempt TO last_attempt_at;
  END IF;
END $$;

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. Atomic Rate Limiter RPC with Input Validation (5 attempts allowed, 6th blocked)
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  rate_key text,
  max_attempts int DEFAULT 5,
  window_minutes int DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key text := TRIM(COALESCE(rate_key, ''));
  v_max int := COALESCE(max_attempts, 5);
  v_window_mins int := COALESCE(window_minutes, 10);
  v_now timestamptz := now();
  v_window interval;
  v_attempts int;
  v_locked_until timestamptz;
BEGIN
  IF v_key = '' THEN
    RETURN false;
  END IF;

  IF v_max < 1 THEN
    v_max := 5;
  END IF;
  IF v_window_mins < 1 THEN
    v_window_mins := 10;
  END IF;

  v_window := (v_window_mins || ' minutes')::interval;

  INSERT INTO public.auth_rate_limits (key, attempts, last_attempt_at, locked_until)
  VALUES (v_key, 1, v_now, NULL)
  ON CONFLICT (key) DO UPDATE
  SET
    attempts = CASE
      WHEN (auth_rate_limits.locked_until IS NOT NULL AND auth_rate_limits.locked_until <= v_now)
        OR (auth_rate_limits.last_attempt_at < (v_now - v_window))
      THEN 1
      ELSE auth_rate_limits.attempts + 1
    END,
    locked_until = CASE
      WHEN auth_rate_limits.locked_until > v_now THEN auth_rate_limits.locked_until
      WHEN (auth_rate_limits.locked_until IS NOT NULL AND auth_rate_limits.locked_until <= v_now)
        OR (auth_rate_limits.last_attempt_at < (v_now - v_window))
      THEN NULL
      WHEN (auth_rate_limits.attempts + 1) > v_max THEN v_now + v_window
      ELSE NULL
    END,
    last_attempt_at = v_now
  RETURNING attempts, locked_until INTO v_attempts, v_locked_until;

  IF (v_locked_until IS NOT NULL AND v_locked_until > v_now) OR (v_attempts > v_max) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_auth_rate_limit(rate_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits WHERE key = TRIM(COALESCE(rate_key, ''));
END;
$$;

REVOKE ALL ON FUNCTION public.check_auth_rate_limit(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_auth_rate_limit(text, int, int) TO service_role;

REVOKE ALL ON FUNCTION public.reset_auth_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_auth_rate_limit(text) TO service_role;

-- 5. Server-Side Student Email Lookup RPC (Strict Server-Only)
CREATE OR REPLACE FUNCTION public.lookup_student_email_by_team_code(
  lookup_code text,
  lookup_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT p.email INTO v_email
  FROM public.students s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE UPPER(TRIM(s.team_code)) = UPPER(TRIM(lookup_code))
    AND LOWER(TRIM(s.full_name)) = LOWER(TRIM(lookup_name))
  LIMIT 1;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_student_email_by_team_code(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_student_email_by_team_code(text, text) TO service_role;

-- 6. Applications Schema Alignment (resume_url & unique constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'applications' 
      AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN resume_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_applications_student_internship'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT uq_applications_student_internship UNIQUE (student_id, internship_id);
  END IF;
END $$;

-- 7. Triggers: Protect Sensitive Profile and Student Fields
CREATE OR REPLACE FUNCTION public.protect_profiles_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NOT NULL THEN
    IF NOT public.is_admin() THEN
      IF TG_OP = 'INSERT' THEN
        IF NEW.id IS DISTINCT FROM v_caller_id THEN
          RAISE EXCEPTION 'Unauthorized: Profile ID must match authenticated user ID.';
        END IF;
        IF NEW.role IS DISTINCT FROM 'student' THEN
          NEW.role := 'student';
        END IF;
      END IF;

      IF TG_OP = 'UPDATE' THEN
        IF NEW.id IS DISTINCT FROM OLD.id THEN
          RAISE EXCEPTION 'Unauthorized: Profile ID cannot be modified.';
        END IF;
        IF NEW.role IS DISTINCT FROM OLD.role THEN
          RAISE EXCEPTION 'Unauthorized: Only administrators can modify profile roles.';
        END IF;
        IF NEW.email IS DISTINCT FROM OLD.email THEN
          RAISE EXCEPTION 'Unauthorized: Email cannot be modified directly on profiles.';
        END IF;
      END IF;
    END IF;
  END IF;

  IF NEW.role IS NULL THEN
    NEW.role := 'student';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profiles_role ON public.profiles;
DROP TRIGGER IF EXISTS tr_protect_profiles_sensitive_fields ON public.profiles;
CREATE TRIGGER tr_protect_profiles_sensitive_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_sensitive_fields();

CREATE OR REPLACE FUNCTION public.protect_students_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NOT NULL AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' AND NEW.user_id IS DISTINCT FROM v_caller_id THEN
      RAISE EXCEPTION 'Unauthorized: Student user_id must match authenticated user ID.';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Unauthorized: Student user_id cannot be modified.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_students_sensitive_fields ON public.students;
CREATE TRIGGER tr_protect_students_sensitive_fields
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_students_sensitive_fields();

-- 8. Trigger: Application Status Guard
CREATE OR REPLACE FUNCTION public.protect_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify application status.';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'submitted' AND NOT public.is_admin() THEN
      NEW.status := 'submitted';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_application_status ON public.applications;
CREATE TRIGGER tr_protect_application_status
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_application_status();

-- 9. Recruiter Shield: public_opportunities View
DROP VIEW IF EXISTS public.public_opportunities CASCADE;
CREATE VIEW public.public_opportunities AS
SELECT
  id,
  role,
  domain,
  location,
  mode,
  duration,
  salary,
  description,
  responsibilities,
  skills,
  eligibility,
  status,
  created_at,
  updated_at
FROM public.internships
WHERE status IN ('open', 'published', 'active');

GRANT SELECT ON public.public_opportunities TO anon, authenticated;

-- 10. Dynamic Safe Drop of Conflicting Policies via pg_policies Audit
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop existing policies on public application tables (recreated cleanly below)
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'students', 'companies', 'internships', 'applications', 'auth_rate_limits')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  -- Drop ONLY conflicting resume-specific policies on storage.objects (preserves all other buckets)
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%resume%'
        OR policyname IN (
          'Students read own resumes',
          'Students update own resumes',
          'Students upload own resumes',
          'resumes_student_select',
          'resumes_student_insert',
          'resumes_student_update',
          'resumes_admin_select',
          'resumes_admin_all',
          'resumes_select_policy',
          'resumes_insert_policy',
          'resumes_update_policy',
          'resumes_delete_policy'
        )
        OR COALESCE(qual, '') ILIKE '%bucket_id%''resumes''%'
        OR COALESCE(with_check, '') ILIKE '%bucket_id%''resumes''%'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- 11. Recreated Core Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- students
CREATE POLICY "students_select_policy" ON public.students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "students_insert_policy" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "students_update_policy" ON public.students
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "students_delete_policy" ON public.students
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- companies (Recruiter Shield: Strictly restricted to Admin)
CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "companies_insert_policy" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "companies_update_policy" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "companies_delete_policy" ON public.companies
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- internships (Candidates read open internships; only Admin writes)
CREATE POLICY "internships_select_policy" ON public.internships
  FOR SELECT TO authenticated, anon
  USING (status IN ('open', 'published', 'active') OR public.is_admin());

CREATE POLICY "internships_insert_policy" ON public.internships
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "internships_update_policy" ON public.internships
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "internships_delete_policy" ON public.internships
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- applications
CREATE POLICY "applications_select_policy" ON public.applications
  FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "applications_insert_policy" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "applications_update_policy" ON public.applications
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "applications_delete_policy" ON public.applications
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- auth_rate_limits
CREATE POLICY "auth_rate_limits_service_role" ON public.auth_rate_limits
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 12. Storage Policies Strictly Bound to 'resumes' Bucket
CREATE POLICY "resumes_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "resumes_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "resumes_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'resumes' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "resumes_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- 13. Application Form Fields (Equinox Career Connect)
DO $$
BEGIN
  -- Add video_url (Google Drive link) to applications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN video_url text;
  END IF;

  -- Add skills to applications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'skills'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN skills text;
  END IF;

  -- Add portfolio_url to applications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'portfolio_url'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN portfolio_url text;
  END IF;

  -- Add availability to applications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'availability'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN availability text;
  END IF;

  -- Add course_branch to students table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'course_branch'
  ) THEN
    ALTER TABLE public.students ADD COLUMN course_branch text;
  END IF;
END $$;



-- =====================================================================
-- 14. SCHEMA ALIGNMENT & SEED FOR 4 PARTICIPATING COMPANIES & 9 ROLES
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'internships' AND column_name = 'stipend'
  ) THEN
    ALTER TABLE public.internships ADD COLUMN stipend text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'internships' AND column_name = 'requirement'
  ) THEN
    ALTER TABLE public.internships ADD COLUMN requirement text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'internships' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.internships ADD COLUMN company_name text;
  END IF;
END $$;

-- Update public_opportunities View to expose company, requirement, and stipend
DROP VIEW IF EXISTS public.public_opportunities CASCADE;
CREATE VIEW public.public_opportunities AS
SELECT
  i.id,
  i.role,
  i.domain,
  i.location,
  i.mode,
  i.duration,
  i.salary,
  i.description,
  i.responsibilities,
  i.skills,
  i.eligibility,
  i.status,
  i.created_at,
  i.updated_at,
  COALESCE(i.stipend, i.salary) AS stipend,
  i.requirement,
  COALESCE(i.company_name, c.name, 'Partner Organization (Confidential)') AS company
FROM public.internships i
LEFT JOIN public.companies c ON c.id = i.company_id
WHERE i.status IN ('open', 'published', 'active');

GRANT SELECT ON public.public_opportunities TO anon, authenticated;

-- Close old mock templates
UPDATE public.internships
SET status = 'closed', updated_at = now()
WHERE id IN (
  'af56a1d3-d49f-4dc2-b69d-c56ff02a5375',
  '8481b635-2508-4e06-bef7-bfec5a3d69ee',
  '9fc1b1d0-be73-4c8e-914e-bbd14cf329d1',
  '7895af40-94cc-4d61-92ec-b424e8fb3de9'
);

-- Upsert Participating Companies into public.companies
DO $$
BEGIN
  INSERT INTO public.companies (id, name, industry, about, created_at, updated_at)
  VALUES
    (
      'c0000001-0000-0000-0000-000000000001',
      'Partner Organization',
      'Aerospace & Defense',
      'Cutting-edge aerospace and technology ventures.',
      now(),
      now()
    ),
    (
      'c0000002-0000-0000-0000-000000000002',
      'Partner Organization',
      'Healthcare & Artificial Intelligence',
      'Pioneering AI systems, healthcare predictive modelling, and research.',
      now(),
      now()
    ),
    (
      'c0000003-0000-0000-0000-000000000003',
      'Partner Organization',
      'AI & Student Innovation Programs',
      'Next-gen AI innovation and student launchpad ecosystem.',
      now(),
      now()
    ),
    (
      'c0000004-0000-0000-0000-000000000004',
      'Partner Organization',
      'Talent & Tech Incubator',
      'Incubating student talent across technology, web development, and marketing.',
      now(),
      now()
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    industry = EXCLUDED.industry,
    about = EXCLUDED.about,
    updated_at = now();
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping public.companies upsert if schema has custom user_id constraint: %', SQLERRM;
END $$;

-- Upsert 9 Roles into public.internships
DO $$
DECLARE
  v_default_company_id uuid;
BEGIN
  SELECT id INTO v_default_company_id FROM public.companies LIMIT 1;
  IF v_default_company_id IS NULL THEN
    v_default_company_id := 'c0000001-0000-0000-0000-000000000001';
  END IF;

  -- 1) Partner Organization
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000001-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name = 'Partner Organization' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'Business Executive Intern',
    'Business Development & Corporate Sales',
    'Bengaluru',
    'hybrid',
    '6 months',
    'Provided (amount fixed during the interview)',
    NULL,
    'Work directly with the Founder''s Office on sales, marketing and business development. Connect with potential clients through calls, emails and social media, qualify leads, pitch solutions and follow up, and take part in negotiations and deal closures. Build and maintain a sales pipeline and track lead conversion. Plan and execute creative marketing campaigns, including social media content, reels and short-form videos. Contribute ideas, research and execution plans, and own assigned projects from idea to execution. Good to have: experience with CRM tools, Canva, CapCut or similar.',
    ARRAY['Sales & business development', 'Marketing campaigns', 'Deal negotiations', 'Lead conversion tracking'],
    ARRAY['CRM Tools', 'Canva', 'CapCut', 'Sales', 'Marketing'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 2) Partner Organization: AI/ML Development
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'AI/ML Development',
    'Artificial Intelligence & Machine Learning',
    '100% Remote',
    'remote',
    '3 months (1 Nov 2026 to 1 Feb 2027)',
    'Not Provided',
    NULL,
    'Machine learning, healthcare AI systems, predictive modelling, and data-driven research.',
    ARRAY['Machine learning', 'Healthcare AI systems', 'Predictive modelling', 'Data-driven research'],
    ARRAY['Python', 'Machine Learning', 'AI', 'Predictive Modelling'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 3) Partner Organization: App Development
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000002',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'App Development',
    'Mobile App Development',
    '100% Remote',
    'remote',
    '3 months (1 Nov 2026 to 1 Feb 2027)',
    'Not Provided',
    NULL,
    'Cross-platform mobile applications, interface development, and system integration.',
    ARRAY['Cross-platform mobile applications', 'Interface development', 'System integration'],
    ARRAY['Flutter', 'React Native', 'Mobile App Development', 'System Integration'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 4) Partner Organization: Full-Stack Web Development
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000003',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'Full-Stack Web Development',
    'Full-Stack Web Development',
    '100% Remote',
    'remote',
    '3 months (1 Nov 2026 to 1 Feb 2027)',
    'Not Provided',
    NULL,
    'Frontend and backend development, APIs, databases, and scalable web applications.',
    ARRAY['Frontend and backend development', 'APIs', 'Databases', 'Scalable web applications'],
    ARRAY['React', 'Node.js', 'APIs', 'PostgreSQL', 'Full-Stack'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 5) Partner Organization: Social Media Management and Marketing
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000004',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'Social Media Management and Marketing',
    'Digital Marketing, SEO & Growth Hacking',
    '100% Remote',
    'remote',
    '3 months (1 Nov 2026 to 1 Feb 2027)',
    'Not Provided',
    NULL,
    'Content strategy, social media operations, digital campaigns, and audience engagement.',
    ARRAY['Content strategy', 'Social media operations', 'Digital campaigns', 'Audience engagement'],
    ARRAY['Content Strategy', 'Social Media', 'Digital Marketing', 'Campaigns'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 6) Partner Organization: Influencer Partnerships and Management
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000005',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'Influencer Partnerships and Management',
    'Public Relations, Media & Event Management',
    '100% Remote',
    'remote',
    '3 months (1 Nov 2026 to 1 Feb 2027)',
    'Not Provided',
    NULL,
    'Creator outreach, influencer collaborations, and brand awareness initiatives.',
    ARRAY['Creator outreach', 'Influencer collaborations', 'Brand awareness initiatives'],
    ARRAY['Influencer Outreach', 'Partnerships', 'PR', 'Brand Growth'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 7) Partner Organization: Graphics Design
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000006',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'Graphics Design',
    'UI/UX Design & Product Experience',
    '100% Remote',
    'remote',
    '3 months (1 Nov 2026 to 1 Feb 2027)',
    'Not Provided',
    NULL,
    'Brand identity, digital creatives, UI assets, and visual communication.',
    ARRAY['Brand identity', 'Digital creatives', 'UI assets', 'Visual communication'],
    ARRAY['Figma', 'Graphic Design', 'Brand Identity', 'UI Assets'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 8) Partner Organization: Campus Ambassador
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000003-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'Campus Ambassador',
    'Public Relations, Media & Event Management',
    'Campus-based / Remote coordination',
    'remote',
    NULL,
    NULL,
    NULL,
    'Represent the organization on your campus. Promote the organization's programs, events, hackathons and workshops. Build and manage student communities on WhatsApp, LinkedIn and other platforms. Coordinate with college clubs, placement cells, faculty and student organizations. Share official announcements and promotional content, support outreach, event registrations and student onboarding, and share campus engagement updates with the team.',
    ARRAY['Campus representation', 'Community management', 'Student outreach', 'Event coordination'],
    ARRAY['Community Building', 'Outreach', 'Networking', 'Leadership'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

  -- 9) Partner Organization: Requirement
  INSERT INTO public.internships (
    id, company_id, company_name, role, domain, location, mode, duration, stipend,
    requirement, description, responsibilities, skills, eligibility, status, created_at, updated_at
  )
  VALUES (
    'd0000004-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Partner Organization%' LIMIT 1), v_default_company_id),
    'Partner Organization',
    'Tech, Marketing & Web Dev',
    'General',
    'MLRIT Campus / Hyderabad',
    NULL,
    NULL,
    NULL,
    '10+ people from tech and marketing; 2 from web dev',
    NULL,
    ARRAY['Tech and marketing', 'Web development'],
    ARRAY['Tech', 'Marketing', 'Web Dev'],
    'Open to all registered Equinox attendees',
    'open',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    role = EXCLUDED.role,
    mode = EXCLUDED.mode,
    duration = EXCLUDED.duration,
    stipend = EXCLUDED.stipend,
    requirement = EXCLUDED.requirement,
    description = EXCLUDED.description,
    status = 'open',
    updated_at = now();

END $$;
