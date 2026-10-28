// Single source of truth for confirmed event facts. Anything not here is "To Be Announced".
export const TBA = "To Be Announced";

export const EVENT = {
  name: "Equinox E-Summit 2K26",
  subEvent: "Internship Drive",
  dates: "30–31 October",
  datesLong: "30 & 31 October 2026",
  venue: "MLR Institute of Technology",
  city: "Hyderabad",
  host: "Centre for Innovation & Entrepreneurship (CIE), MLRIT",
  cieFounded: 2015,
  stats: [
    { value: "2000+", label: "Students expected" },
    { value: "15+", label: "Startups" },
    { value: "02", label: "Days · 30–31 Oct" },
  ],
  previousEdition: "700+",
} as const;

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/internships", label: "Opportunities" },
  { to: "/about", label: "About" },
] as const;

export const JOURNEY = [
  { step: "Student Registration", note: "Create your account when registration opens." },
  { step: "Create Profile", note: "Add your education, skills and resume." },
  { step: "Explore Opportunities", note: "Browse roles from participating startups and companies." },
  { step: "Apply", note: "Submit applications to the roles that fit you." },
  { step: "Track Application", note: "Follow each application's status from your dashboard." },
] as const;

export const DRIVE_STATS = [
  { value: "2000+", label: "Students on campus", body: "Expected across the two-day summit, across domains." },
  { value: "15+", label: "Startups hiring", body: "Organisations recruiting interns face to face — not through a portal." },
  { value: "700+", label: "At the previous edition", body: "The turnout that set this format." },
  { value: "Est. 2015", label: "Organised by CIE", body: "Centre for Innovation & Entrepreneurship at MLRIT." },
] as const;

export const FAQS = [
  { q: "What is the Internship Drive?", a: "The Internship Drive is a sub-event of Equinox E-Summit 2K26 that connects students with startups and companies offering internship opportunities." },
  { q: "When is the event?", a: "Equinox E-Summit 2K26 takes place on 30 & 31 October." },
  { q: "Where is it happening?", a: "At MLR Institute of Technology (MLRIT), Hyderabad." },
  { q: "Who is organising it?", a: "The Centre for Innovation & Entrepreneurship (CIE) at MLRIT." },
  { q: "Who can participate?", a: "Details will be announced soon." },
  { q: "How can students register?", a: "Registration will open on this platform. Details will be announced soon." },
  { q: "When will companies be announced?", a: "Participating companies will be announced soon." },
  { q: "How will internship applications work?", a: "Students will be able to apply to listed roles and track their applications here. Full details will be announced soon." },
] as const;

export const INTERNSHIP_FIELDS = ["Company", "Role", "Domain", "Location / Mode", "Duration", "Skills"] as const;

export const INTERNSHIP_CATEGORIES = {
  technical: [
    "Artificial Intelligence & Machine Learning",
    "Full-Stack Web Development",
    "Frontend Engineering",
    "Backend & Cloud Architecture",
    "Mobile App Development",
    "Data Science & Big Data Analytics",
    "DevOps, SRE & Cloud Infrastructure",
    "Cybersecurity & Information Defense",
    "IoT, Embedded Systems & Robotics",
    "Blockchain & Web3 Technologies",
  ],
  nonTechnical: [
    "UI/UX Design & Product Experience",
    "Product Management & Strategy",
    "Digital Marketing, SEO & Growth Hacking",
    "Content Strategy & Copywriting",
    "Business Development & Corporate Sales",
    "Human Resources & Talent Acquisition",
    "Operations & Supply Chain Management",
    "Financial Analysis & FinTech Operations",
    "Public Relations, Media & Event Management",
    "Customer Success & Client Relations",
  ],
} as const;

export type InternshipTrack = "all" | "technical" | "non-technical";
