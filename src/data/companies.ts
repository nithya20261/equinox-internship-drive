export interface InternshipListing {
  id: string;
  company: string;
  role?: string;
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
    id: "soaron-aerospace-founder-office",
    company: "Soaron Aerospace",
    role: "Business Executive Intern (Founder's Office)",
    description:
      "Work directly with the Founder's Office on sales, marketing and business development. Connect with potential clients through calls, emails and social media, qualify leads, pitch solutions and follow up, and take part in negotiations and deal closures. Build and maintain a sales pipeline and track lead conversion. Plan and execute creative marketing campaigns, including social media content, reels and short-form videos. Contribute ideas, research and execution plans, and own assigned projects from idea to execution. Good to have: experience with CRM tools, Canva, CapCut or similar.",
    mode: "Hybrid (Bengaluru)",
    duration: "6 months",
    stipend: "Provided (amount fixed during the interview)",
    domain: "Business Development & Corporate Sales",
  },
  {
    id: "aethriz-ai-ml-development",
    company: "Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)",
    role: "AI/ML Development",
    description:
      "Machine learning, healthcare AI systems, predictive modelling, and data-driven research.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Artificial Intelligence & Machine Learning",
  },
  {
    id: "aethriz-app-development",
    company: "Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)",
    role: "App Development",
    description:
      "Cross-platform mobile applications, interface development, and system integration.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Mobile App Development",
  },
  {
    id: "aethriz-full-stack-web-development",
    company: "Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)",
    role: "Full-Stack Web Development",
    description:
      "Frontend and backend development, APIs, databases, and scalable web applications.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Full-Stack Web Development",
  },
  {
    id: "aethriz-social-media-management-marketing",
    company: "Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)",
    role: "Social Media Management and Marketing",
    description:
      "Content strategy, social media operations, digital campaigns, and audience engagement.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Digital Marketing, SEO & Growth Hacking",
  },
  {
    id: "aethriz-influencer-partnerships-management",
    company: "Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)",
    role: "Influencer Partnerships and Management",
    description:
      "Creator outreach, influencer collaborations, and brand awareness initiatives.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "Public Relations, Media & Event Management",
  },
  {
    id: "aethriz-graphics-design",
    company: "Aethriz AI Healthcare and Advanced Research Pvt. Ltd. (Winter Internship Programme 2026-27)",
    role: "Graphics Design",
    description:
      "Brand identity, digital creatives, UI assets, and visual communication.",
    mode: "100% Remote",
    duration: "3 months (1 Nov 2026 to 1 Feb 2027)",
    stipend: "Not Provided",
    domain: "UI/UX Design & Product Experience",
  },
  {
    id: "vetria-ai-campus-ambassador",
    company: "VetriaAI Innovation Pvt. Ltd. (VetriaAI & LaunchPadX)",
    role: "Campus Ambassador",
    description:
      "Represent VetriaAI and LaunchPadX on your campus. Promote LaunchPadX programs, events, hackathons and workshops. Build and manage student communities on WhatsApp, LinkedIn and other platforms. Coordinate with college clubs, placement cells, faculty and student organizations. Share official announcements and promotional content, support outreach, event registrations and student onboarding, and share campus engagement updates with the VetriaAI team.",
    mode: "Campus-based / Remote coordination",
    domain: "Public Relations, Media & Event Management",
  },
  {
    id: "student-forge-requirement",
    company: "Student Forge",
    requirement: "10+ people from tech and marketing; 2 from web dev",
    domain: "General",
  },
];

