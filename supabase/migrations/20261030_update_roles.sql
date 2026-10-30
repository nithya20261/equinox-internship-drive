-- =====================================================================
-- EQUINOX INTERNSHIP DRIVE - PARTICIPATING COMPANIES & ROLES MIGRATION
-- File: supabase/migrations/20261030_update_roles.sql
-- =====================================================================

-- 1. Schema Alignment: Add stipend, requirement, and company_name columns to public.internships
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

-- 2. Update public_opportunities View to expose company, requirement, and stipend
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

-- 3. Upsert Participating Companies into public.companies
DO $$
BEGIN
  INSERT INTO public.companies (id, name, industry, about, created_at, updated_at)
  VALUES
    (
      'c0000001-0000-0000-0000-000000000001',
      'Soaron Aerospace',
      'Aerospace & Defense',
      'Cutting-edge aerospace and technology ventures.',
      now(),
      now()
    ),
    (
      'c0000002-0000-0000-0000-000000000002',
      'Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)',
      'Healthcare & Artificial Intelligence',
      'Pioneering AI systems, healthcare predictive modelling, and research.',
      now(),
      now()
    ),
    (
      'c0000003-0000-0000-0000-000000000003',
      'VetriaAI Innovation Pvt. Ltd. (VetriaAI & LaunchPadX)',
      'AI & Student Innovation Programs',
      'Next-gen AI innovation and student launchpad ecosystem.',
      now(),
      now()
    ),
    (
      'c0000004-0000-0000-0000-000000000004',
      'Student Forge',
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

-- 4. Close the old mock template roles from public.internships
UPDATE public.internships
SET status = 'closed', updated_at = now()
WHERE id IN (
  'af56a1d3-d49f-4dc2-b69d-c56ff02a5375',
  '8481b635-2508-4e06-bef7-bfec5a3d69ee',
  '9fc1b1d0-be73-4c8e-914e-bbd14cf329d1',
  '7895af40-94cc-4d61-92ec-b424e8fb3de9'
);

-- 5. Upsert the 9 Official Roles into public.internships
DO $$
DECLARE
  v_default_company_id uuid;
BEGIN
  -- Obtain a fallback company_id in case foreign key requires an existing company record
  SELECT id INTO v_default_company_id FROM public.companies LIMIT 1;
  IF v_default_company_id IS NULL THEN
    v_default_company_id := 'c0000001-0000-0000-0000-000000000001';
  END IF;

  -- 1) Soaron Aerospace: Business Executive Intern (Founder's Office)
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000001-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name = 'Soaron Aerospace' LIMIT 1), v_default_company_id),
    'Soaron Aerospace',
    'Business Executive Intern (Founder''s Office)',
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

  -- 2) Aethriz: AI/ML Development
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Aethriz%' LIMIT 1), v_default_company_id),
    'Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)',
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

  -- 3) Aethriz: App Development
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000002',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Aethriz%' LIMIT 1), v_default_company_id),
    'Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)',
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

  -- 4) Aethriz: Full-Stack Web Development
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000003',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Aethriz%' LIMIT 1), v_default_company_id),
    'Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)',
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

  -- 5) Aethriz: Social Media Management and Marketing
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000004',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Aethriz%' LIMIT 1), v_default_company_id),
    'Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)',
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

  -- 6) Aethriz: Influencer Partnerships and Management
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000005',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Aethriz%' LIMIT 1), v_default_company_id),
    'Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)',
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

  -- 7) Aethriz: Graphics Design
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000002-0000-0000-0000-000000000006',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Aethriz%' LIMIT 1), v_default_company_id),
    'Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)',
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

  -- 8) VetriaAI: Campus Ambassador
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000003-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Vetria%' LIMIT 1), v_default_company_id),
    'VetriaAI Innovation Pvt. Ltd. (VetriaAI & LaunchPadX)',
    'Campus Ambassador',
    'Public Relations, Media & Event Management',
    'Campus-based / Remote coordination',
    'remote',
    NULL,
    NULL,
    NULL,
    'Represent VetriaAI and LaunchPadX on your campus. Promote LaunchPadX programs, events, hackathons and workshops. Build and manage student communities on WhatsApp, LinkedIn and other platforms. Coordinate with college clubs, placement cells, faculty and student organizations. Share official announcements and promotional content, support outreach, event registrations and student onboarding, and share campus engagement updates with the VetriaAI team.',
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

  -- 9) Student Forge: Requirement
  INSERT INTO public.internships (
    id,
    company_id,
    company_name,
    role,
    domain,
    location,
    mode,
    duration,
    stipend,
    requirement,
    description,
    responsibilities,
    skills,
    eligibility,
    status,
    created_at,
    updated_at
  )
  VALUES (
    'd0000004-0000-0000-0000-000000000001',
    COALESCE((SELECT id FROM public.companies WHERE name ILIKE 'Student Forge%' LIMIT 1), v_default_company_id),
    'Student Forge',
    'Student Forge Opportunity',
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
