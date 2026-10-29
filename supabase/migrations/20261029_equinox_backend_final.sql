-- =====================================================================
-- EQUINOX INTERNSHIP DRIVE - APPLICATION STATUS & 10 FIELDS MIGRATION
-- File: supabase/migrations/20261029_equinox_backend_final.sql
-- =====================================================================

-- 1. Ensure all 10 application fields exist on public.applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS skills text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS availability text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course_branch text;

-- 2. Update status check constraint on public.applications to include 'interview_scheduled'
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check 
  CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'));

-- 3. Fix RLS policies on public.applications to match auth.uid() directly
DROP POLICY IF EXISTS "applications_select_policy" ON public.applications;
CREATE POLICY "applications_select_policy" ON public.applications
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "applications_insert_policy" ON public.applications;
CREATE POLICY "applications_insert_policy" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );
