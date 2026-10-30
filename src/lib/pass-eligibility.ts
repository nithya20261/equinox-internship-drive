import {
  CONFIRMED_STUDENTS_LIST,
  getConfirmedStudent,
} from "@/data/confirmed-students";
import {
  OFFICIAL_PARTICIPANTS,
  getOfficialParticipantByCnf,
  getOfficialParticipantByEmail,
  type OfficialParticipant,
} from "@/data/official-participants";

export type EligibilityErrorCode =
  | "ELIGIBLE"
  | "REJECTED_ENTERTAINMENT_PASS"
  | "NOT_IN_EXCEL"
  | "NOT_IN_WEBSITE_MASTER"
  | "INVALID_PASS_CATEGORY"
  | "MISSING_CNF";

export interface EligibilityResult {
  allowed: boolean;
  reason: string;
  cnf?: string | undefined;
  passCategory?: string | undefined;
  participant?: OfficialParticipant | undefined;
  websiteStudent?: { cnf: string; name: string } | undefined;
  errorCode: EligibilityErrorCode;
}

/**
 * Determine CNF candidate from input.
 * Accepts direct CNF, teamCode (if formatted as CNF-...), or looks up by registered email.
 */
export function resolveCnfFromInput(input: {
  cnfNumber?: string | undefined;
  email?: string | undefined;
  teamCode?: string | undefined;
}): string | null {
  // 1. Direct CNF provided
  if (input.cnfNumber && input.cnfNumber.trim()) {
    return input.cnfNumber.trim().toUpperCase();
  }

  // 2. Team code formatted as CNF
  if (input.teamCode && /^CNF(-[0-9A-F]+|\d+)$/i.test(input.teamCode.trim())) {
    return input.teamCode.trim().toUpperCase();
  }

  // 3. Lookup by email in official roster
  if (input.email && input.email.trim()) {
    const cleanEmail = input.email.trim().toLowerCase();
    const byEmail = getOfficialParticipantByEmail(cleanEmail);
    if (byEmail?.cnf) {
      return byEmail.cnf.toUpperCase();
    }
  }

  // 4. Fallback: team code might be an actual team code from official roster
  if (input.teamCode && input.teamCode.trim()) {
    const cleanTc = input.teamCode.trim().toUpperCase();
    const match = OFFICIAL_PARTICIPANTS.find(
      (p) => p.teamCode.toUpperCase() === cleanTc
    );
    if (match?.cnf) {
      return match.cnf.toUpperCase();
    }
  }

  return null;
}

/**
 * MANDATORY FINAL ELIGIBILITY RULE:
 * EXISTING WEBSITE CNF + OFFICIAL EXCEL CNF MATCH + PREMIUM PASS = REGISTRATION ALLOWED.
 *
 * All other participants must be denied registration.
 */
export function verifyPassEligibility(input: {
  cnfNumber?: string | undefined;
  email?: string | undefined;
  teamCode?: string | undefined;
}): EligibilityResult {
  const cnf = resolveCnfFromInput(input);

  if (!cnf) {
    return {
      allowed: false,
      errorCode: "MISSING_CNF",
      reason:
        "Registration Denied: A valid Confirmation Number (CNF) is required for registration eligibility verification.",
    };
  }

  // 1. Check website student master list
  const websiteStudent = getConfirmedStudent(cnf);

  // 2. Check official Excel roster
  const officialParticipant = getOfficialParticipantByCnf(cnf);

  // Check 1: Must exist in website student master list
  if (!websiteStudent) {
    return {
      allowed: false,
      cnf,
      errorCode: "NOT_IN_WEBSITE_MASTER",
      reason: `Registration Denied: Confirmation number (${cnf}) is not in the confirmed student master list.`,
      participant: officialParticipant,
    };
  }

  // Check 2: Must exist in official Excel sheet
  if (!officialParticipant) {
    // Development/test exception for CNF000 if in development or test environment
    if (
      cnf === "CNF000" &&
      (typeof process !== "undefined" && (process.env["NODE_ENV"] === "test" || process.env["NODE_ENV"] === "development"))
    ) {
      return {
        allowed: true,
        cnf: "CNF000",
        passCategory: "Premium Pass",
        websiteStudent,
        errorCode: "ELIGIBLE",
        reason: "Verified: Developer test account with simulated Premium Pass.",
      };
    }

    return {
      allowed: false,
      cnf,
      websiteStudent,
      errorCode: "NOT_IN_EXCEL",
      reason: `Registration Denied: Confirmation number (${cnf}) was not found in the official Equinox registrations roster.`,
    };
  }

  const rawPass = (officialParticipant.pass || "").trim();
  const normalizedPass = rawPass.toLowerCase();

  // Check 3: Check for Entertainment Pass (Explicitly rejected)
  if (normalizedPass === "entertainment pass") {
    return {
      allowed: false,
      cnf,
      passCategory: "Entertainment Pass",
      websiteStudent,
      participant: officialParticipant,
      errorCode: "REJECTED_ENTERTAINMENT_PASS",
      reason:
        "Registration Denied: Entertainment Pass holders are not eligible for the Equinox Internship Drive. Only Premium Pass participants can register.",
    };
  }

  // Check 4: Must be Premium Pass
  if (normalizedPass !== "premium pass") {
    return {
      allowed: false,
      cnf,
      passCategory: rawPass || "Unverified",
      websiteStudent,
      participant: officialParticipant,
      errorCode: "INVALID_PASS_CATEGORY",
      reason: `Registration Denied: Pass category "${rawPass || "Unverified"}" is invalid or ineligible. Only verified Premium Pass holders can register.`,
    };
  }

  // RULE SATISFIED: Website CNF + Official Excel CNF + Premium Pass = ALLOWED
  return {
    allowed: true,
    cnf,
    passCategory: "Premium Pass",
    websiteStudent,
    participant: officialParticipant,
    errorCode: "ELIGIBLE",
    reason: "Verified: Confirmed student with valid Premium Pass. Registration allowed.",
  };
}
