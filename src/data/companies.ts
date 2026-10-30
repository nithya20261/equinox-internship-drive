export interface InternshipListing {
  id: string;
  legacyId?: string;
  company: string;
  role?: string;
  department?: string;
  requirement?: string;
  description?: string;
  mode?: string;
  duration?: string;
  stipend?: string;
  domain?: string;
  location?: string;
}

export const INTERNSHIP_COMPANIES: InternshipListing[] = [
  {
    id: "d0000001-0000-0000-0000-000000000001",
    legacyId: "business-executive-founder-office",
    company: "Partner Organization (Confidential)",
    role: "Business Executive Intern",
    department: "Founder's Office",
    description:
      "Work directly with the Founder's Office on sales, marketing and business development. Connect with potential clients through calls, emails and social media, qualify leads, pitch solutions and follow up, and take part in negotiations and deal closures. Build and maintain a sales pipeline and track lead conversion. Plan and execute creative marketing campaigns, including social media content, reels and short-form videos. Contribute ideas, research and execution plans, and own assigned projects from idea to execution. Good to have: experience with CRM tools, Canva, CapCut or similar.",
    mode: "Hybrid (Bengaluru)",
    duration: "6 months",
    stipend: "Provided (amount fixed during the interview)",
    domain: "Business Development & Corporate Sales",
  },
  {
    id: "d0000002-0000-0000-0000-000000000001",
    legacyId: "ai-ml-development",
    company: "Partner Organization (Confidential)",
    role: "AI/ML Development",
    description:
      "Machine learning, healthcare AI systems, predictive modelling, and data-driven research.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Artificial Intelligence & Machine Learning",
  },
  {
    id: "d0000002-0000-0000-0000-000000000002",
    legacyId: "app-development",
    company: "Partner Organization (Confidential)",
    role: "App Development",
    description:
      "Cross-platform mobile applications, interface development, and system integration.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Mobile App Development",
  },
  {
    id: "d0000002-0000-0000-0000-000000000003",
    legacyId: "full-stack-web-development",
    company: "Partner Organization (Confidential)",
    role: "Full-Stack Web Development",
    description:
      "Frontend and backend development, APIs, databases, and scalable web applications.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Full-Stack Web Development",
  },
  {
    id: "d0000002-0000-0000-0000-000000000004",
    legacyId: "social-media-management-marketing",
    company: "Partner Organization (Confidential)",
    role: "Social Media Management and Marketing",
    description:
      "Content strategy, social media operations, digital campaigns, and audience engagement.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Digital Marketing, SEO & Growth Hacking",
  },
  {
    id: "d0000002-0000-0000-0000-000000000005",
    legacyId: "influencer-partnerships-management",
    company: "Partner Organization (Confidential)",
    role: "Influencer Partnerships and Management",
    description:
      "Creator outreach, influencer collaborations, and brand awareness initiatives.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Public Relations, Media & Event Management",
  },
  {
    id: "d0000002-0000-0000-0000-000000000006",
    legacyId: "graphics-design",
    company: "Partner Organization (Confidential)",
    role: "Graphics Design",
    description:
      "Brand identity, digital creatives, UI assets, and visual communication.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "UI/UX Design & Product Experience",
  },
  {
    id: "d0000003-0000-0000-0000-000000000001",
    legacyId: "campus-ambassador",
    company: "Partner Organization (Confidential)",
    role: "Campus Ambassador",
    description:
      "Represent the organization on your campus. Promote the organization's programs, events, hackathons and workshops. Build and manage student communities on WhatsApp, LinkedIn and other platforms. Coordinate with college clubs, placement cells, faculty and student organizations. Share official announcements and promotional content, support outreach, event registrations and student onboarding, and share campus engagement updates with the team.",
    mode: "Campus-based / Remote coordination",
    domain: "Public Relations, Media & Event Management",
  },
  {
    id: "d0000004-0000-0000-0000-000000000001",
    legacyId: "tech",
    company: "Partner Organization (Confidential)",
    role: "Tech",
    requirement:
      "- Basic knowledge of programming (Python, Java, C++ or similar)\n- Understanding of data structures and problem solving\n- Familiarity with Git and GitHub\n- Willingness to learn new tools and technologies\n- Good communication and teamwork",
    domain: "Backend & Cloud Architecture",
  },
  {
    id: "d0000004-0000-0000-0000-000000000002",
    legacyId: "web-dev",
    company: "Partner Organization (Confidential)",
    role: "Web Dev",
    requirement:
      "- Working knowledge of HTML, CSS and JavaScript\n- Basic experience with a framework like React (preferred)\n- Ability to build simple responsive web pages\n- Familiarity with Git and GitHub\n- A portfolio or a couple of small projects is a plus",
    domain: "Full-Stack Web Development",
  },
  {
    id: "d0000004-0000-0000-0000-000000000003",
    legacyId: "marketing",
    company: "Partner Organization (Confidential)",
    role: "Marketing",
    requirement:
      "- Good written and verbal communication\n- Basic understanding of social media platforms (Instagram, LinkedIn)\n- Creativity in content ideas, captions and posters\n- Familiarity with Canva or similar design tools\n- Ability to work in a team and meet deadlines",
    domain: "Digital Marketing, SEO & Growth Hacking",
  },
];
