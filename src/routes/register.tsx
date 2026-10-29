import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { registerStudentWithResume } from "@/lib/api";

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
  college: string;
  teamCode: string;
  mobile: string;
  email: string;
  password: string;
}

function Register() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [studentForm, setStudentForm] = useState<StudentFormState>({
    fullName: "",
    college: "",
    teamCode: "",
    mobile: "",
    email: "",
    password: "",
  });

  const handleStudentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !studentForm.fullName.trim() ||
      !studentForm.college.trim() ||
      !studentForm.teamCode.trim() ||
      !studentForm.mobile.trim() ||
      !studentForm.email.trim() ||
      !studentForm.password.trim()
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    if (!studentForm.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (studentForm.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await registerStudentWithResume({
        full_name: studentForm.fullName,
        college: studentForm.college,
        team_code: studentForm.teamCode,
        mobile: studentForm.mobile,
        email: studentForm.email,
        password: studentForm.password,
      });

      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title={
          <>
            All<br />set.
          </>
        }
        aside="Your profile has been created and your account is active. You can now access opportunities and apply."
      >
        <div className="space-y-6">
          <div className="border border-foreground bg-paper-deep p-6">
            <div className="flex items-center gap-3 text-signal">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <p className="eyebrow text-sm font-bold text-foreground">
                Student Account Successfully Created
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Welcome, {studentForm.fullName}! Your registration has been securely created under team code {studentForm.teamCode}.
            </p>

            <div className="mt-4 divide-y divide-border border-t border-border pt-4 text-xs">
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">College</span>
                <span className="font-mono font-medium">{studentForm.college}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Team Code</span>
                <span className="font-mono font-medium">{studentForm.teamCode}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Mobile</span>
                <span className="font-mono font-medium">{studentForm.mobile}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Email</span>
                <span className="font-mono font-medium">{studentForm.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/internships"
              className="btn btn-signal w-full"
            >
              Explore Opportunities & Apply <ArrowRight className="h-4 w-4" />
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
          Student<br />Register.
        </>
      }
      aside="Create your student profile and apply to curated internship roles in one session."
    >
      <h2 className="headline text-3xl">Create Student Account</h2>
      <p className="mt-2 text-xs font-mono text-[#F7F2F6]/60">
        Equinox E-Summit 2K26 · Candidate Registration
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {errorMessage && (
          <div
            className="flex items-center gap-2 border-l-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <FieldLabel htmlFor="r-full-name">Full name</FieldLabel>
          <input
            id="r-full-name"
            name="fullName"
            type="text"
            value={studentForm.fullName}
            onChange={handleStudentChange}
            autoComplete="name"
            placeholder="e.g. Aditi Rao"
            className="field"
            required
          />
        </div>

        <div>
          <FieldLabel htmlFor="r-college">College / University</FieldLabel>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="r-team-code">Team code</FieldLabel>
            <input
              id="r-team-code"
              name="teamCode"
              type="text"
              value={studentForm.teamCode}
              onChange={handleStudentChange}
              placeholder="e.g. EQX-408"
              className="field uppercase"
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="r-mobile">Mobile number</FieldLabel>
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
        </div>

        <div>
          <FieldLabel htmlFor="r-email">Email address</FieldLabel>
          <input
            id="r-email"
            name="email"
            type="email"
            value={studentForm.email}
            onChange={handleStudentChange}
            autoComplete="email"
            placeholder="name@college.edu"
            className="field"
            required
          />
        </div>

        <div>
          <FieldLabel htmlFor="r-password">Password</FieldLabel>
          <input
            id="r-password"
            name="password"
            type="password"
            value={studentForm.password}
            onChange={handleStudentChange}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className="field"
            required
          />
        </div>

        <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-4 text-xs font-mono text-muted-foreground">
          <p className="font-bold text-[#7484FE]">Direct Account Activation</p>
          <p className="mt-1">
            No email verification link required. You will be logged in immediately after submitting your details.
            Resume will be uploaded when applying to your selected roles.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-signal w-full"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Account...
            </span>
          ) : (
            "Complete Registration"
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="underline hover:text-foreground">
            Sign in with Team Code or Email
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
