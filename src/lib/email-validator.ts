/**
 * Email validation and typo detection utility for Equinox Career Connect.
 * Protects Supabase transactional email reputation by:
 * 1. Enforcing strict RFC 5322 syntax validation.
 * 2. Detecting and warning against common typos (e.g., gamil.com, gmial.com).
 * 3. Blocking known disposable, temporary, and test domains.
 * 4. Preventing accidental submissions of synthetic/internal domains.
 */

// Common typos mapped to their correct domain
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaik.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gamail.com": "gmail.com",
  "gmaol.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.cpm": "gmail.com",
  "gemail.com": "gmail.com",
  "gnail.com": "gmail.com",

  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yaho.co.in": "yahoo.co.in",
  "yahoo.con": "yahoo.com",
  "yahoo.co": "yahoo.com",

  // Outlook / Microsoft typos
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.co": "outlook.com",

  // College domain typos
  "mlrit.com": "mlrit.ac.in",
  "mlrit.in": "mlrit.ac.in",
  "mlrit.org": "mlrit.ac.in",
  "mlrit.edu": "mlrit.ac.in",
};

// Known disposable or fake domains that generate immediate hard bounces
export const DISPOSABLE_DOMAINS = new Set([
  // Disposable mail services
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "dispostable.com",
  "getairmail.com",
  "maildrop.cc",
  "inboxkitten.com",
  "trashmail.com",
  "temp-mail.org",
  "burnermail.io",
  "fakemailgenerator.com",
  "nada.ltd",
  "generator.email",
  "emailondeck.com",
]);

// Dummy / Test domains per RFC 2606 (blocked for real user registration, allowed in mock unit tests)
export const TEST_RESERVED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "fake.com",
  "invalid.com",
  "invalid",
  "localhost",
  "test.internal",
]);

// Valid TLDs commonly used in educational, commercial, and regional emails
const VALID_TLD_REGEX = /^[a-z]{2,24}(\.[a-z]{2,8})?$/i;

export interface EmailValidationResult {
  isValid: boolean;
  sanitizedEmail: string;
  error?: string;
  suggestion?: string;
}

/**
 * Validates an email address thoroughly before allowing it to reach Supabase Auth.
 */
export function validateEmailAddress(
  rawEmail: string | null | undefined,
  options: { allowTestDomains?: boolean } = {}
): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== "string") {
    return {
      isValid: false,
      sanitizedEmail: "",
      error: "Email address is required.",
    };
  }

  // 1. Sanitize input: trim, remove zero-width or non-printable characters, lowercase
  const sanitized = rawEmail
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();

  if (!sanitized) {
    return {
      isValid: false,
      sanitizedEmail: "",
      error: "Email address cannot be empty.",
    };
  }

  // Length limits according to RFC 5321 (max 254 chars total)
  if (sanitized.length > 254) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email address is too long (maximum 254 characters).",
    };
  }

  // 2. Syntax check with strict RFC-compliant pattern
  // Disallows leading/trailing dots in local part, consecutive dots, whitespace, invalid symbols
  const basicParts = sanitized.split("@");
  if (basicParts.length !== 2) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Please enter a valid email address with a single '@' symbol.",
    };
  }

  const [localPart, domainPart] = basicParts;

  if (!localPart || !domainPart) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Please enter a complete email address (e.g. yourname@gmail.com).",
    };
  }

  // Local part validation
  if (localPart.length > 64) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email username portion is too long (maximum 64 characters).",
    };
  }

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email username cannot start or end with a dot.",
    };
  }

  if (localPart.includes("..")) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email address cannot contain consecutive dots.",
    };
  }

  // Validate local part characters: alphanumeric + valid special characters
  const localPartRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!localPartRegex.test(localPart)) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email username contains invalid characters.",
    };
  }

  // Domain validation
  if (domainPart.length > 253) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email domain is too long.",
    };
  }

  if (domainPart.startsWith(".") || domainPart.endsWith(".") || domainPart.startsWith("-") || domainPart.endsWith("-")) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email domain contains invalid leading or trailing symbols.",
    };
  }

  if (domainPart.includes("..")) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email domain cannot contain consecutive dots.",
    };
  }

  const domainRegex = /^[a-z0-9.-]+$/;
  if (!domainRegex.test(domainPart)) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email domain contains invalid characters.",
    };
  }

  // Ensure domain has at least one period
  const domainSegments = domainPart.split(".");
  if (domainSegments.length < 2) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email domain must include a valid extension (e.g. .com or .ac.in).",
    };
  }

  // Validate TLD (last segment or last two for .ac.in, .co.uk)
  const tld = domainSegments[domainSegments.length - 1];
  if (!tld || tld.length < 2 || !VALID_TLD_REGEX.test(tld)) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Email domain has an invalid top-level domain extension.",
    };
  }

  // 3. Typo detection for common domains
  if (COMMON_DOMAIN_TYPOS[domainPart]) {
    const suggestedDomain = COMMON_DOMAIN_TYPOS[domainPart];
    const suggestedEmail = `${localPart}@${suggestedDomain}`;
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      suggestion: suggestedEmail,
      error: `Did you mean ${suggestedEmail}? Please check your email spelling before registering.`,
    };
  }

  // 4. Block disposable / temporary email domains that cause bounces (always blocked)
  if (DISPOSABLE_DOMAINS.has(domainPart)) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Disposable, temporary, or throwaway email addresses are not accepted. Please use your genuine college or personal email.",
    };
  }

  // 5. In automated tests (vitest mock environment), allow test domains (example.com) for test mocks
  const isAutomatedTest =
    options.allowTestDomains ??
    (typeof process !== "undefined" && (Boolean(process.env["VITEST"]) || process.env["NODE_ENV"] === "test"));

  if (!isAutomatedTest && TEST_RESERVED_DOMAINS.has(domainPart)) {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Test email domains are not accepted in live registration. Please use your genuine college or personal email.",
    };
  }

  // 6. Block synthetic internal domains from public signup
  if (domainPart === "equinox.mlrit.ac.in" || domainPart === "admin.equinox.internal") {
    return {
      isValid: false,
      sanitizedEmail: sanitized,
      error: "Internal placeholder email domains cannot be used for direct registration. Please use your genuine email address.",
    };
  }

  return {
    isValid: true,
    sanitizedEmail: sanitized,
  };
}
