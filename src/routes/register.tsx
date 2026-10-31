import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { registerStudent, verifyStudentCnf } from "@/lib/api";
import type { VerifyStudentCnfResult } from "@/lib/server-auth";

export const Route = createFileRoute("/register")({
  head: () =>
    pageMeta(
      "Student Registration",
      "Register as a student candidate for the Equinox E-Summit 2K26 Internship Drive."
    ),
  component: Register,
});

interface StudentFormState {
  fullName: string;
  cnfNumber: string;
  college: string;
  courseBranch: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function Register() {
  const [initialCnfParam] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return (urlParams.get("cnf") || "").trim().toUpperCase();
    }
    return "";
  });

  // Step 1: CNF verification state
  const [cnfInput, setCnfInput] = useState(initialCnfParam);
  const [isVerifyingCnf, setIsVerifyingCnf] = useState(false);
  const [cnfVerification, setCnfVerification] = useState<VerifyStudentCnfResult | null>(null);
  const [cnfError, setCnfError] = useState<string | null>(null);

  // Step 2: Basic student registration form state
  const [studentForm, setStudentForm] = useState<StudentFormState>({
    fullName: "",
    cnfNumber: initialCnfParam,
    college: "MLR Institute of Technology",
    courseBranch: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically verify CNF if provided in URL parameter
  useEffect(() => {
    if (initialCnfParam && !cnfVerification && !isVerifyingCnf) {
      handleVerifyCnf(initialCnfParam);
    }
  }, [initialCnfParam]);

  const handleVerifyCnf = async (cnfToVerify?: string) => {
    const rawCnf = (cnfToVerify || cnfInput).trim().toUpperCase();
    setCnfError(null);
    setErrorMessage(null);

    if (!rawCnf) {
      setCnfError("Please enter your Confirmation Number (CNF) to verify eligibility.");
      return;
    }

    try {
      setIsVerifyingCnf(true);
      const result = await verifyStudentCnf(rawCnf);
      setCnfVerification(result);

      if (!result.allowed) {
        setCnfError(result.reason || "Confirmation Number is not eligible for registration.");
      } else {
        // Pre-fill form from verified event record
        setStudentForm((prev) => ({
          ...prev,
          cnfNumber: result.cnf || rawCnf,
          fullName: prev.fullName || result.fullName || "",
          college: prev.college || result.college || "MLR Institute of Technology",
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification service error. Please try again.";
      setCnfError(msg);
    } finally {
      setIsVerifyingCnf(false);
    }
  };

  const handleStudentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!cnfVerification?.allowed) {
      setErrorMessage("Please verify your Confirmation Number (CNF) with a Premium Pass first.");
      return;
    }

    const cleanName = studentForm.fullName.trim();
    const cleanCnf = studentForm.cnfNumber.trim().toUpperCase();
    const cleanCollege = studentForm.college.trim();
    const cleanBranch = studentForm.courseBranch.trim();
    const cleanMobile = studentForm.mobile.trim();
    const cleanEmail = studentForm.email.trim().toLowerCase();
    const cleanPassword = studentForm.password;
    const cleanConfirmPassword = studentForm.confirmPassword;

    if (!cleanName || !cleanCnf || !cleanCollege || !cleanBranch || !cleanMobile || !cleanEmail || !cleanPassword) {
      setErrorMessage("Please fill in all required personal and academic details.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid personal or university email address.");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify your confirm password field.");
      return;
    }

    const normalizedMobile = cleanMobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    try {
      setIsSubmitting(true);
      await registerStudent({
        full_name: cleanName,
        cnf_number: cleanCnf,
        college: cleanCollege,
        course_branch: cleanBranch,
        mobile: cleanMobile,
        email: cleanEmail,
        password: cleanPassword,
        confirm_password: cleanConfirmPassword,
      });

      setIsSubmitted(true);
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : "Registration failed. Please check your details.";
      if (
        msg.includes("Unexpected end of JSON input") ||
        msg.includes("JSON.parse") ||
        msg.includes("Unexpected token")
      ) {
        msg = "Network communication issue. Please check your credentials or try logging in.";
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS VIEW
  if (isSubmitted) {
    return (
      <AuthLayout
        title={
          <>
            Registration<br />Complete.
          </>
        }
        aside="Your profile has been registered and verified with your official Premium Pass. You can now access drive opportunities and submit your internship applications."
      >
        <div className="space-y-6">
          <div className="border border-emerald-500/40 bg-paper-deep p-6 rounded-xl">
            <div className="flex items-center gap-3 text-signal">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-[#33FF67]" />
              <p className="eyebrow text-sm font-bold text-foreground">
                Internship Drive Registration Complete
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Welcome, <strong className="text-white">{studentForm.fullName}</strong>! Your registration has been confirmed with your verified Premium Pass. You can now explore internship roles and submit your applications with your resume and video introduction.
            </p>

            <div className="mt-4 divide-y divide-border border-t border-border pt-4 text-xs font-mono">
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Confirmation (CNF)</span>
                <span className="font-bold text-[#33FF67]">{studentForm.cnfNumber.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Pass Category</span>
                <span className="font-medium text-[#33FF67]">Premium Pass (Verified)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Course &amp; Branch</span>
                <span className="font-medium text-white">{studentForm.courseBranch}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">College</span>
                <span className="font-medium text-white">{studentForm.college}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Registered Email</span>
                <span className="font-medium text-white">{studentForm.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/internships"
              className="btn btn-signal flex-1 text-center justify-center font-bold"
            >
              Explore Internship Roles &rarr;
            </Link>
            <Link
              to="/dashboard/student"
              className="btn btn-line flex-1 text-center justify-center"
            >
              Candidate Dashboard
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={
        <>
          Student<br />Registration
        </>
      }
      aside="Candidate registration for the Equinox Career Connect Internship Drive. Requires official Premium Pass verification."
    >
      <div className="space-y-4">
        {/* ========================================================================= */}
        {/* STEP 1: Official CNF & Premium Pass Verification                          */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-xs font-bold text-[#33FF67]">
            STEP 01: VERIFY CONFIRMATION NUMBER (CNF)
          </span>
        </div>

        {!cnfVerification?.allowed ? (
          <div className="rounded-xl border border-white/10 bg-[#161616] p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Enter the Confirmation Number (CNF) from your official Equinox 2K26 registration ticket. Eligibility is restricted to confirmed <strong className="text-white">Premium Pass</strong> holders.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="verify-cnf-input"
                type="text"
                value={cnfInput}
                onChange={(e) => {
                  setCnfInput(e.target.value.toUpperCase());
                  if (cnfError) setCnfError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleVerifyCnf();
                  }
                }}
                placeholder="e.g. CNF-7EEEB1 or CNF000"
                className="field font-mono uppercase tracking-wider flex-1"
                disabled={isVerifyingCnf}
              />
              <button
                type="button"
                onClick={() => handleVerifyCnf()}
                disabled={isVerifyingCnf || !cnfInput.trim()}
                className="btn btn-signal shrink-0 px-4 text-xs font-bold"
              >
                {isVerifyingCnf ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking...
                  </span>
                ) : (
                  "Verify CNF"
                )}
              </button>
            </div>

            {cnfError && (
              <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{cnfError}</p>
                  {cnfVerification?.alreadyRegistered && (
                    <p className="pt-1">
                      <Link
                        to="/login"
                        className="underline font-bold text-white hover:text-[#33FF67]"
                      >
                        Click here to Sign In with your registered email &rarr;
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white font-mono">
                    {cnfVerification.cnf} &middot; {cnfVerification.fullName}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-400">
                    Category: {cnfVerification.passCategory} (Eligible for Internship Drive)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCnfVerification(null);
                  setCnfError(null);
                }}
                className="text-[11px] font-mono text-muted-foreground hover:text-white underline underline-offset-2"
              >
                Change CNF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STEP 2: Basic Student Registration Form (Details Only)                     */}
      {/* ========================================================================= */}
      {cnfVerification?.allowed && (
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="font-mono text-xs font-bold text-[#7484FE]">
              STEP 02: CANDIDATE REGISTRATION DETAILS
            </span>
          </div>

          {errorMessage && (
            <div
              className="flex items-center gap-2 border-l-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <FieldLabel htmlFor="r-full-name">Full Name *</FieldLabel>
            <input
              id="r-full-name"
              name="fullName"
              type="text"
              value={studentForm.fullName}
              onChange={handleStudentChange}
              autoComplete="name"
              placeholder="Enter your full name"
              className="field"
              required
            />
          </div>

          {/* Confirmation Number (Locked) */}
          <div>
            <FieldLabel htmlFor="r-cnf-locked" hint="Verified from your Premium Pass ticket">
              Confirmation Number (CNF)
            </FieldLabel>
            <input
              id="r-cnf-locked"
              type="text"
              value={studentForm.cnfNumber}
              disabled
              className="field uppercase font-mono tracking-wider bg-white/5 opacity-80 cursor-not-allowed border-emerald-500/40 text-emerald-400"
            />
          </div>

          {/* Academic Info: College & Course Branch */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="r-college">College / University *</FieldLabel>
              <input
                id="r-college"
                name="college"
                type="text"
                value={studentForm.college}
                onChange={handleStudentChange}
                placeholder="e.g. MLR Institute of Technology"
                className="field"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="r-course-branch" hint="Degree and Specialization">
                Course &amp; Branch *
              </FieldLabel>
              <input
                id="r-course-branch"
                name="courseBranch"
                type="text"
                value={studentForm.courseBranch}
                onChange={handleStudentChange}
                placeholder="e.g. B.Tech Computer Science"
                className="field"
                required
              />
            </div>
          </div>

          {/* Contact Details: Mobile & Personal Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="r-mobile">Mobile Number *</FieldLabel>
              <input
                id="r-mobile"
                name="mobile"
                type="tel"
                value={studentForm.mobile}
                onChange={handleStudentChange}
                autoComplete="tel"
                placeholder="10-digit mobile number"
                className="field"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="r-email" hint="For login and notifications">
                Email Address *
              </FieldLabel>
              <input
                id="r-email"
                name="email"
                type="email"
                value={studentForm.email}
                onChange={handleStudentChange}
                autoComplete="email"
                placeholder="name@college.edu or personal email"
                className="field"
                required
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="r-password" hint="At least 6 characters">
                Account Password *
              </FieldLabel>
              <input
                id="r-password"
                name="password"
                type="password"
                value={studentForm.password}
                onChange={handleStudentChange}
                autoComplete="new-password"
                placeholder="Choose a password"
                className="field"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="r-confirm-password" hint="Must match password">
                Confirm Password *
              </FieldLabel>
              <input
                id="r-confirm-password"
                name="confirmPassword"
                type="password"
                value={studentForm.confirmPassword}
                onChange={handleStudentChange}
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="field"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-signal w-full text-sm font-bold h-11"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Student Account...
              </span>
            ) : (
              "Complete Registration & Access Internships"
            )}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground mt-6">
        Already completed registration?{" "}
        <Link to="/login" className="underline hover:text-foreground text-[#7484FE]">
          Sign in with your Email and Password
        </Link>
      </p>
    </AuthLayout>
  );
}
