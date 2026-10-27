import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout, RoleTabs } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";
import { Upload, FileText, X, CheckCircle2, ArrowRight } from "lucide-react";
import { loginUser } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () =>
    pageMeta(
      "Register",
      "Register as a student or company for the Equinox E-Summit 2K26 Internship Drive."
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

interface CompanyFormState {
  companyName: string;
  contactPerson: string;
  workEmail: string;
  password: string;
}

function Register() {
  const [role, setRole] = useState<"student" | "company">("student");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const [companyForm, setCompanyForm] = useState<CompanyFormState>({
    companyName: "",
    contactPerson: "",
    workEmail: "",
    password: "",
  });

  const handleStudentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleCompanyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyForm((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (role === "student") {
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
        setErrorMessage("Please upload your resume (PDF/DOCX).");
        return;
      }
    } else {
      if (
        !companyForm.companyName.trim() ||
        !companyForm.contactPerson.trim() ||
        !companyForm.workEmail.trim() ||
        !companyForm.password.trim()
      ) {
        setErrorMessage("Please fill in all company fields.");
        return;
      }
    }

      if (role === "student") {
        loginUser({
          role: "student",
          name: studentForm.fullName,
          teamCode: studentForm.teamCode,
          email: studentForm.email,
        });
      } else {
        loginUser({
          role: "company",
          email: companyForm.workEmail,
        });
      }

      setIsSubmitted(true);
    };

  if (isSubmitted) {
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
                Account Successfully Created
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {role === "student"
                ? `Welcome, ${studentForm.fullName}! Your registration and resume have been recorded under team code ${studentForm.teamCode}.`
                : `Welcome, ${companyForm.companyName}! Your company account is registered under ${companyForm.workEmail}.`}
            </p>

            {role === "student" && (
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
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to={role === "student" ? "/dashboard/student" : "/login"}
              className="btn btn-signal w-full"
            >
              Go to {role === "student" ? "Student Dashboard" : "Login"} <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
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
          Get<br />ready.
        </>
      }
      aside="Create one account to build your profile, upload your resume, apply to roles and track every application."
    >
      <h2 className="headline text-3xl">Create account</h2>
      <div className="mt-6">
        <RoleTabs value={role} onChange={setRole} />
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {errorMessage && (
          <div
            className="flex items-center gap-2 border-l-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <span>{errorMessage}</span>
          </div>
        )}

        {role === "student" ? (
          <>
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
                Upload Resume
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
          </>
        ) : (
          <>
            <div>
              <FieldLabel htmlFor="r-company-name">Company name</FieldLabel>
              <input
                id="r-company-name"
                name="companyName"
                type="text"
                value={companyForm.companyName}
                onChange={handleCompanyChange}
                autoComplete="organization"
                placeholder="e.g. Acme Innovations"
                className="field"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="r-contact-person">Contact person</FieldLabel>
              <input
                id="r-contact-person"
                name="contactPerson"
                type="text"
                value={companyForm.contactPerson}
                onChange={handleCompanyChange}
                autoComplete="name"
                placeholder="e.g. Rajesh Kumar"
                className="field"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="r-work-email">Work email</FieldLabel>
              <input
                id="r-work-email"
                name="workEmail"
                type="email"
                value={companyForm.workEmail}
                onChange={handleCompanyChange}
                autoComplete="email"
                placeholder="talent@acme.com"
                className="field"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="r-company-password">Password</FieldLabel>
              <input
                id="r-company-password"
                name="password"
                type="password"
                value={companyForm.password}
                onChange={handleCompanyChange}
                autoComplete="new-password"
                placeholder="••••••••"
                className="field"
                required
              />
            </div>
          </>
        )}

        <button type="submit" className="btn btn-signal w-full">
          Create account
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-foreground underline decoration-signal underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
