import eligibleCnfsData from "@/data/eligible-pass-cnfs.json";

// Set of verified Premium Pass CNFs
const ELIGIBLE_CNF_SET = new Set((eligibleCnfsData as string[]).map((c) => c.toUpperCase()));

export interface EligibilityResult {
  allowed: boolean;
  reason: string;
  cnf?: string;
  passCategory?: string;
}

/**
 * Determine CNF candidate from user input.
 * Accepts direct CNF or team code formatted as CNF-XXXXXX or CNF000.
 */
export function resolveCnfFromInput(input: {
  cnfNumber?: string | undefined;
  teamCode?: string | undefined;
  email?: string | undefined;
}): string | null {
  if (input.cnfNumber && input.cnfNumber.trim()) {
    return input.cnfNumber.trim().toUpperCase();
  }
  if (input.teamCode && /^CNF(-[0-9A-F]+|\d+)$/i.test(input.teamCode.trim())) {
    return input.teamCode.trim().toUpperCase();
  }
  return null;
}

/**
 * Check whether a CNF identifier holds an eligible Premium Pass.
 * Fast O(1) set lookup on sanitized identifiers.
 */
export function isCnfEligible(cnf: string): boolean {
  if (!cnf) return false;
  const normalized = cnf.trim().toUpperCase();
  return ELIGIBLE_CNF_SET.has(normalized);
}

/**
 * Server-side verification for registration and CNF-based access.
 * Enforces verified Premium Pass eligibility without exposing student personal details.
 */
export function verifyPassEligibility(input: {
  cnfNumber?: string | undefined;
  teamCode?: string | undefined;
  email?: string | undefined;
}): EligibilityResult {
  const cnf = resolveCnfFromInput(input);

  if (!cnf) {
    return {
      allowed: false,
      reason: "Registration Denied: A valid Confirmation Number (CNF) is required for registration.",
    };
  }

  // Developer / test environment account support
  if (
    cnf === "CNF000" &&
    typeof process !== "undefined" &&
    (process.env["NODE_ENV"] === "test" || process.env["NODE_ENV"] === "development")
  ) {
    return {
      allowed: true,
      cnf: "CNF000",
      passCategory: "Premium Pass",
      reason: "Verified: Developer test account with valid Premium Pass.",
    };
  }

  if (!isCnfEligible(cnf)) {
    return {
      allowed: false,
      cnf,
      reason: `Registration Denied: Confirmation number (${cnf}) is not eligible for the Equinox Internship Drive. Only verified Premium Pass attendees are eligible.`,
    };
  }

  return {
    allowed: true,
    cnf,
    passCategory: "Premium Pass",
    reason: "Verified: Confirmed participant with valid Premium Pass.",
  };
}
