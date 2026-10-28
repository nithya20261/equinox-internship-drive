import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";
import { Upload, FileText, X, CheckCircle2, ArrowRight, Loader2, Mail } from "lucide-react";
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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Resume file must be under 10MB");
        return;
      }
      setResumeFile(file);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Resume file must be under 10MB");
        return;
      }
      setResumeFile(file);
      setErrorMessage(null);
    }
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
    if (!resumeFile) {
      setErrorMessage("Please upload your resume (PDF/DOC/DOCX up to 10MB).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await registerStudentWithResume({
        full_name: studentForm.fullName,
        college: studentForm.college,
        team_code: studentForm.teamCode,
        mobile: studentForm.mobile,
        email: studentForm.email,
        password: studentForm.password,
        resume: resumeFile,
      });

      if (res.confirmationRequired) {
        setConfirmationRequired(true);
      }
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    if (confirmationRequired) {
      return (
        <AuthLayout
          title={
            <>
              Verify<br />email.
            </>
          }
          aside="A confirmation link was sent to your inbox. Please verify your email before logging in to access opportunities."
        >
          <div className="space-y-6">
            <div className="border border-[#7484FE] bg-[#0A0A0A] p-6 text-[#F7F2F6]">
              <div className="flex items-center gap-3 text-[#7484FE]">
                <Mail className="h-6 w-6 shrink-0" />
                <p className="eyebrow text-sm font-bold text-foreground">
                  Verification Email Sent
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                We've sent a verification email to{" "}
                <span className="font-mono text-[#33FF67]">
                  {studentForm.email}
                </span>
                . Please click the confirmation link in that email to activate your account.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Once confirmed, you can log in using your Team Code / Email and password.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/login" className="btn btn-signal w-full">
                Proceed to Login <ArrowRight className="h-4 w-4" />
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
            All<br />set.
          </>
        }
        aside="Your profile has been created and your credentials are set. You can now access your dashboard and explore opportunities."
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
              Welcome, {studentForm.fullName}! Your registration and resume have been securely saved under team code {studentForm.teamCode}.
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
              {resumeFile && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Uploaded Resume</span>
                  <span className="font-mono font-medium text-signal">
                    {resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/dashboard/student"
              className="btn btn-signal w-full"
            >
              Go to Student Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setConfirmationRequired(false);
                setResumeFile(null);
                setStudentForm({
                  fullName: "",
                  college: "",
                  teamCode: "",
                  mobile: "",
                  email: "",
                  password: "",
                });
              }}
              className="btn btn-line w-full"
            >
              Register Another Account
            </button>
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
      aside="Create your student profile, upload your resume, apply to multiple internship roles and track every application."
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="r-email">Email ID</FieldLabel>
            <input
              id="r-email"
              name="email"
              type="email"
              value={studentForm.email}
              onChange={handleStudentChange}
              autoComplete="email"
              placeholder="name@example.com"
              className="field"
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="r-college">College name</FieldLabel>
            <input
              id="r-college"
              name="college"
              type="text"
              value={studentForm.college}
              onChange={handleStudentChange}
              autoComplete="organization"
              placeholder="e.g. MLR Institute of Technology"
              className="field"
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="r-team-code">Team code</FieldLabel>
            <input
              id="r-team-code"
              name="teamCode"
              type="text"
              value={studentForm.teamCode}
              onChange={handleStudentChange}
              placeholder="e.g. EQX-402"
              className="field uppercase"
              required
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="r-password" hint="Minimum 6 characters">
            Password
          </FieldLabel>
          <input
            id="r-password"
            name="password"
            type="password"
            value={studentForm.password}
            onChange={handleStudentChange}
            autoComplete="new-password"
            placeholder="••••••••"
            className="field"
            required
          />
        </div>

        <div>
          <FieldLabel htmlFor="r-resume" hint="PDF or DOCX (max 10MB)">
            Upload Profile Resume
          </FieldLabel>
          <input
            ref={fileInputRef}
            id="r-resume"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {!resumeFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-6 transition-colors ${
                isDragOver
                  ? "border-signal bg-signal/10"
                  : "border-input bg-card hover:border-signal/60"
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload className="h-7 w-7 text-signal" />
              <p className="mt-2 text-sm font-medium text-foreground">
                Click to browse or drag and drop your resume
              </p>
              <p className="eyebrow mt-1 text-[0.68rem] text-muted-foreground">
                PDF, DOC, DOCX up to 10MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between border border-foreground bg-paper-deep p-3.5">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-6 w-6 shrink-0 text-signal" />
                <div className="truncate">
                  <p className="truncate text-sm font-medium text-foreground">
                    {resumeFile.name}
                  </p>
                  <p className="eyebrow text-[0.65rem] text-muted-foreground">
                    {(resumeFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setResumeFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Remove uploaded resume"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-signal w-full disabled:opacity-50">
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating student account...
            </span>
          ) : (
            "Create student account"
          )}
        </button>

        <div className="flex flex-col items-center gap-2 pt-2 text-center text-sm text-muted-foreground">
          <p>
            Already registered?{" "}
            <Link
              to="/login"
              className="text-foreground underline decoration-signal underline-offset-4"
            >
              Log in
            </Link>
          </p>
          <Link
            to="/dashboard/admin"
            className="text-xs font-mono text-[#7484FE] hover:underline"
          >
            Organiser / Admin Access
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
