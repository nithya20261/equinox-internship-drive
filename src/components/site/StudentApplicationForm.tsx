import { useState, useEffect, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  submitStudentApplication,
  getOpportunities,
  type Opportunity,
} from "@/lib/api";

interface FormErrors {
  fullName?: string;
  contactNumber?: string;
  email?: string;
  instituteAndBranch?: string;
  preferredRole?: string;
  resumeFile?: string;
  videoUrl?: string;
  relevantSkills?: string;
  portfolioUrl?: string;
  availability?: string;
}

interface StudentApplicationFormProps {
  initialRoleId?: string | undefined;
  onSuccess?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}

export function StudentApplicationForm({
  initialRoleId,
  onSuccess,
  onCancel,
}: StudentApplicationFormProps) {
  const { isLoggedIn, user } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<Opportunity[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Form Fields (Exact 10 fields, clean without auto-filled placeholder values)
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [instituteAndBranch, setInstituteAndBranch] = useState("");
  const [preferredRole, setPreferredRole] = useState(initialRoleId || "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [relevantSkills, setRelevantSkills] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [availability, setAvailability] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<"idle" | "uploading" | "saving">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load available roles dynamically from Supabase
  useEffect(() => {
    let mounted = true;
    getOpportunities()
      .then((roles) => {
        if (!mounted) return;
        setAvailableRoles(roles);
        if (!preferredRole && roles.length > 0) {
          setPreferredRole(initialRoleId || roles[0]?.id || "");
        }
        setLoadingRoles(false);
      })
      .catch((err) => {
        console.warn("Failed to load roles:", err);
        if (mounted) setLoadingRoles(false);
      });

    return () => {
      mounted = false;
    };
  }, [initialRoleId, preferredRole]);

  // Pre-fill student details from authenticated session
  useEffect(() => {
    if (user) {
      if (!fullName && (user.fullName || user.name)) setFullName(user.fullName || user.name || "");
      if (!email && user.email) setEmail(user.email);
      if (!contactNumber && user.mobile) setContactNumber(user.mobile);
      if (!instituteAndBranch) {
        const inst = user.college || "MLR Institute of Technology";
        const br = user.branch || "";
        setInstituteAndBranch(br ? `${inst} - ${br}` : inst);
      }
    }
  }, [user]);

  // Real-time helper to clear field-level errors upon typing
  const handleTextChange = (field: keyof FormErrors, setter: (val: string) => void) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setter(e.target.value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // 1. Full Name
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = "Full name is required.";
    } else if (trimmedName.toLowerCase().startsWith("cnf") || /x{3,}/i.test(trimmedName)) {
      errors.fullName = "Please enter your actual full name.";
    } else if (!/^[a-zA-Z\s\.\'-]{2,60}$/.test(trimmedName)) {
      errors.fullName = "Full name must contain only letters, dots, and spaces (2-60 chars).";
    }

    // 2. Contact Number
    const rawDigits = contactNumber.replace(/\D/g, "");
    const normalizedDigits =
      rawDigits.startsWith("91") && rawDigits.length === 12
        ? rawDigits.slice(2)
        : rawDigits.startsWith("0") && rawDigits.length === 11
        ? rawDigits.slice(1)
        : rawDigits;

    if (!contactNumber.trim()) {
      errors.contactNumber = "Contact number is required.";
    } else if (!/^[6-9]\d{9}$/.test(normalizedDigits)) {
      errors.contactNumber = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }

    // 3. Email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    // 4. Institute and Branch
    const trimmedInstitute = instituteAndBranch.trim();
    if (!trimmedInstitute) {
      errors.instituteAndBranch = "Institute name and course/branch is required.";
    } else if (trimmedInstitute.length < 4) {
      errors.instituteAndBranch = "Please enter college and branch (e.g. MLRIT - B.Tech CSE).";
    } else if (/^[^aeiouyAEIOUY0-9]+$/.test(trimmedInstitute) && trimmedInstitute.length > 5) {
      errors.instituteAndBranch = "Please enter a valid institute name (e.g. MLRIT - B.Tech CSE).";
    }

    // 5. Preferred Role
    if (!preferredRole.trim()) {
      errors.preferredRole = "Please select your preferred internship role.";
    }

    // 6. Resume File
    if (!resumeFile) {
      errors.resumeFile = "Resume / CV file upload is required (PDF, DOC, or DOCX).";
    } else {
      const extMatch = resumeFile.name.match(/\.(pdf|doc|docx)$/i);
      if (!extMatch) {
        errors.resumeFile = "Only PDF, DOC, or DOCX files are accepted.";
      } else if (resumeFile.size > 10 * 1024 * 1024) {
        errors.resumeFile = "Resume file size must be less than 10MB.";
      } else {
        // Enforce CNFNUMBER_NAME naming format
        const cleanCnf = (user?.teamCode || "").replace(/[^A-Za-z0-9]/g, "");
        const upperName = resumeFile.name.toUpperCase();
        if (cleanCnf && !upperName.includes(cleanCnf)) {
          const expectedFormat = `${user?.teamCode || "CNFNUMBER"}_${(fullName.trim() || user?.fullName || "YOURNAME").replace(/\s+/g, "_")}.pdf`;
          errors.resumeFile = `Resume filename must follow the required format: ${expectedFormat}. Please rename your file before uploading.`;
        }
      }
    }

    // 7. Video URL
    const trimmedVideo = videoUrl.trim();
    if (!trimmedVideo) {
      errors.videoUrl = "One-minute self-introduction video link is required.";
    } else if (!trimmedVideo.startsWith("http://") && !trimmedVideo.startsWith("https://")) {
      errors.videoUrl = "Please provide a valid URL starting with https://";
    } else if (!trimmedVideo.includes("drive.google.com") && !trimmedVideo.includes("docs.google.com")) {
      errors.videoUrl = "Video must be a Google Drive link (e.g. https://drive.google.com/file/d/...).";
    }

    // 8. Relevant Skills
    const trimmedSkills = relevantSkills.trim();
    if (!trimmedSkills) {
      errors.relevantSkills = "Please list your relevant skills (e.g. React, Python, UI/UX).";
    } else if (trimmedSkills.length < 2) {
      errors.relevantSkills = "Please list at least one valid skill.";
    }

    // 9. Portfolio URL (Optional)
    const trimmedPortfolio = portfolioUrl.trim();
    if (trimmedPortfolio && !trimmedPortfolio.startsWith("http://") && !trimmedPortfolio.startsWith("https://")) {
      errors.portfolioUrl = "Portfolio link must start with https:// (or http://).";
    }

    // 10. Availability
    const trimmedAvail = availability.trim();
    if (!trimmedAvail) {
      errors.availability = "Internship availability is required.";
    } else if (trimmedAvail.length < 3) {
      errors.availability = "Please enter availability (e.g. Immediate (Full-Time)).";
    } else if (
      /^[qwertyuiopasdfghjklzxcvbnm]+$/i.test(trimmedAvail) &&
      trimmedAvail.length >= 6 &&
      !/immediate|full|part|month|week|flexible|ready|intern|hybrid|onsite|remote|avail/i.test(trimmedAvail)
    ) {
      errors.availability = "Please specify a realistic availability (e.g. Immediate (Full-Time)).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (user?.role === "student" && user?.registrationCompleted === false) {
      setErrorMessage("Registration Incomplete: Please complete your official Internship Drive registration first.");
      return;
    }

    if (!validateForm()) {
      setErrorMessage("Please fix the highlighted validation errors before submitting.");
      return;
    }

    if (!resumeFile) {
      setErrorMessage("Please upload your resume file (PDF, DOC, or DOCX).");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStage("uploading");
      const res = await submitStudentApplication(
        {
          fullName: fullName.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          instituteAndBranch: instituteAndBranch.trim(),
          preferredRole,
          resumeFile,
          videoUrl: videoUrl.trim(),
          relevantSkills: relevantSkills.trim(),
          portfolioUrl: portfolioUrl.trim() || undefined,
          availability: availability.trim(),
        },
        (stage) => {
          setSubmitStage(stage);
        }
      );

      if (res.alreadyApplied) {
        setSuccessMessage("You have already applied for this role! Your submission is recorded.");
      } else {
        setSuccessMessage("Your application and video introduction have been successfully submitted!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit application. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
      setSubmitStage("idle");
    }
  };

  if (successMessage) {
    return (
      <div className="border border-[#33FF67] bg-[#33FF67]/10 p-8 text-center rounded-2xl w-full">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#33FF67]" />
        <h3 className="font-display mt-3 text-2xl text-[#F7F2F6]">
          Application Submitted Successfully
        </h3>
        <p className="mt-2 font-mono text-sm text-[#33FF67]">{successMessage}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard/student" className="btn btn-signal h-10 px-6 text-xs font-bold">
            View in Student Dashboard
          </Link>
          {onSuccess && (
            <button type="button" onClick={onSuccess} className="btn btn-line h-10 px-6 text-xs">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-6">
      {user?.role === "student" && user?.registrationCompleted === false && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <span>Registration required: Please complete your Internship Drive candidate registration before submitting applications.</span>
          </div>
          <a
            href={user?.teamCode ? `/register?cnf=${encodeURIComponent(user.teamCode)}` : "/register"}
            className="btn btn-signal h-8 px-3 text-xs font-bold shrink-0 flex items-center justify-center"
          >
            Complete Registration
          </a>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          {!isLoggedIn && (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-signal h-8 px-3 text-xs font-bold">
                Log In
              </Link>
              <Link to="/register" className="btn btn-line h-8 px-3 text-xs">
                Register
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 10 DISTINCT DETAILS BLOCKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
        {/* BLOCK 01: Full Name */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 01</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              1. Full Name
            </label>
          </div>
          <div>
            <input
              type="text"
              required
              value={fullName}
              onChange={handleTextChange("fullName", setFullName)}
              placeholder="Enter your full name"
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.fullName ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.fullName}
              </p>
            )}
          </div>
        </div>

        {/* BLOCK 02: Contact Number */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 02</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              2. Contact Number
            </label>
          </div>
          <div>
            <input
              type="tel"
              required
              value={contactNumber}
              onChange={handleTextChange("contactNumber", setContactNumber)}
              placeholder="Enter 10-digit mobile (e.g. 9876543210)"
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.contactNumber ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {fieldErrors.contactNumber && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.contactNumber}
              </p>
            )}
          </div>
        </div>

        {/* BLOCK 03: Email Address */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 03</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              3. Email Address
            </label>
          </div>
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={handleTextChange("email", setEmail)}
              placeholder="Enter email address"
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.email ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* BLOCK 04: Institute Name and Current Course / Branch */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 04</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              4. Institute Name & Course / Branch
            </label>
          </div>
          <div>
            <input
              type="text"
              required
              value={instituteAndBranch}
              onChange={handleTextChange("instituteAndBranch", setInstituteAndBranch)}
              placeholder="e.g. MLRIT - B.Tech CSE"
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.instituteAndBranch ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {fieldErrors.instituteAndBranch && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.instituteAndBranch}
              </p>
            )}
          </div>
        </div>

        {/* BLOCK 05: Preferred Internship Role */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 05</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              5. Preferred Internship Role
            </label>
          </div>
          <div>
            <select
              required
              value={preferredRole}
              onChange={handleTextChange("preferredRole", setPreferredRole)}
              disabled={loadingRoles}
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none cursor-pointer ${
                fieldErrors.preferredRole ? "border-red-500/60" : "border-white/20"
              }`}
            >
              {loadingRoles ? (
                <option value="">Loading available roles...</option>
              ) : (
                <>
                  <option value="" disabled>
                    Select Preferred Role
                  </option>
                  {availableRoles.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.role || "Internship Role"} {op.domain ? `(${op.domain})` : ""}
                    </option>
                  ))}
                </>
              )}
            </select>
            {fieldErrors.preferredRole && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.preferredRole}
              </p>
            )}
          </div>
        </div>

        {/* BLOCK 06: Resume / CV Upload */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 06</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              6. Resume / CV Upload (PDF, DOC, DOCX)
            </label>
          </div>
          <div>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                setResumeFile(e.target.files?.[0] || null);
                if (fieldErrors.resumeFile) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.resumeFile;
                    return next;
                  });
                }
              }}
              className="block w-full text-xs text-[#F7F2F6] file:mr-3 file:border-0 file:bg-[#7484FE] file:px-4 file:py-2.5 file:min-h-[44px] file:font-mono file:text-xs file:font-bold file:text-black file:rounded-md cursor-pointer hover:file:bg-[#5868df] transition-all"
            />
            {resumeFile && (
              <p className="mt-2 text-[11px] font-mono text-[#33FF67]">
                ✓ Selected: {resumeFile.name} ({(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
            {fieldErrors.resumeFile && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.resumeFile}
              </p>
            )}
            <p className="mt-2.5 text-[11px] font-mono text-amber-300/90 leading-relaxed">
              <span className="text-amber-400 font-bold">*</span> Resume file must be named as <code className="bg-black/60 px-1.5 py-0.5 rounded text-[#33FF67] font-bold border border-white/10">CNFNUMBER_NAME</code> (e.g. <span className="text-white">CNF000_YOURNAME.pdf</span>). <span className="text-amber-200 font-semibold underline">Only those will be considered.*</span>
            </p>
          </div>
        </div>

        {/* BLOCK 07: One-Minute Self-Introduction Video */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 07</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              7. One-Minute Self-Intro Video (Google Drive link)
            </label>
          </div>
          <div>
            <input
              type="url"
              required
              value={videoUrl}
              onChange={handleTextChange("videoUrl", setVideoUrl)}
              placeholder="https://drive.google.com/file/d/..."
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.videoUrl ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {fieldErrors.videoUrl && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.videoUrl}
              </p>
            )}
            <p className="mt-2.5 text-[11px] font-mono text-amber-300/90 leading-relaxed">
              <span className="text-amber-400 font-bold">*</span> Video file in Google Drive must be named as <code className="bg-black/60 px-1.5 py-0.5 rounded text-[#33FF67] font-bold border border-white/10">CNFNUMBER_NAME</code> (e.g. <span className="text-white">CNF000_YOURNAME.mp4</span>). <span className="text-amber-200 font-semibold underline">Only those will be considered.*</span>
            </p>
          </div>
        </div>

        {/* Mandatory File Naming Notice */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs font-mono text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-400 font-bold uppercase tracking-wider">MANDATORY FILE NAMING:</strong>{" "}
            Both your Resume file and Video file must be named as{" "}
            <code className="bg-black/80 px-2 py-0.5 rounded text-[#33FF67] font-bold border border-white/10">
              CNFNUMBER_NAME
            </code>{" "}
            (e.g., <span className="text-white">CNF000_YOURNAME</span>).{" "}
            <strong className="text-amber-200 underline">Only those will be considered.*</strong>
          </p>
        </div>

        {/* BLOCK 08: Relevant Skills */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 08</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              8. Relevant Skills
            </label>
          </div>
          <div>
            <input
              type="text"
              required
              value={relevantSkills}
              onChange={handleTextChange("relevantSkills", setRelevantSkills)}
              placeholder="e.g. React, Node.js, Python, UI/UX, Cloud"
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.relevantSkills ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {fieldErrors.relevantSkills && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.relevantSkills}
              </p>
            )}
          </div>
        </div>

        {/* BLOCK 09: Projects / Portfolio / GitHub / LinkedIn */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#7484FE]">BLOCK 09</span>
              <span className="text-[10px] font-mono text-[#F7F2F6]/50 uppercase tracking-wider">Optional</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              9. Projects / Portfolio / GitHub / LinkedIn
            </label>
          </div>
          <div>
            <input
              type="url"
              value={portfolioUrl}
              onChange={handleTextChange("portfolioUrl", setPortfolioUrl)}
              placeholder="https://github.com/... or https://linkedin.com/in/..."
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.portfolioUrl ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {fieldErrors.portfolioUrl && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.portfolioUrl}
              </p>
            )}
          </div>
        </div>

        {/* BLOCK 10: Internship Availability */}
        <div className="rounded-xl border border-white/10 bg-[#161616] p-5 hover:border-[#7484FE]/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#33FF67]">BLOCK 10</span>
              <span className="text-[10px] font-mono text-[#33FF67] uppercase tracking-wider">Required</span>
            </div>
            <label className="block text-xs font-mono uppercase text-[#F7F2F6] font-semibold mb-2">
              10. Internship Availability
            </label>
          </div>
          <div>
            <input
              type="text"
              required
              value={availability}
              onChange={handleTextChange("availability", setAvailability)}
              placeholder="e.g. Immediate (Full-Time) / 3-6 Months"
              className={`w-full rounded-lg border bg-black/60 min-h-[44px] px-4 py-2.5 font-sans text-base sm:text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all ${
                fieldErrors.availability ? "border-red-500/60" : "border-white/20"
              }`}
            />
            {/* Quick availability suggestion chips to prevent keyboard mash */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Immediate (Full-Time)", "3-6 Months", "Summer 2026", "Flexible"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setAvailability(opt);
                    if (fieldErrors.availability) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.availability;
                        return next;
                      });
                    }
                  }}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded-md border transition-all ${
                    availability === opt
                      ? "border-[#33FF67] bg-[#33FF67]/15 text-[#33FF67] font-bold"
                      : "border-white/10 bg-white/5 text-[#F7F2F6]/60 hover:border-white/30 hover:text-[#F7F2F6]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {fieldErrors.availability && (
              <p className="mt-1.5 text-[11px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {fieldErrors.availability}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Submission Actions */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {/* Visible error alert right above submit button so user doesn't miss it */}
        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            {!isLoggedIn && (
              <Link to="/login" className="btn btn-signal h-8 px-4 text-xs font-bold shrink-0">
                Log In Now
              </Link>
            )}
          </div>
        )}

        {/* Not Logged In Warning Banner */}
        {!isLoggedIn && !errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-300">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-yellow-400" />
              <span>You must be logged in as an authorized student before submitting.</span>
            </div>
            <Link to="/login" className="btn btn-signal h-8 px-4 text-xs font-bold shrink-0">
              Log In
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="btn btn-line h-11 min-h-[44px] px-5 text-sm w-full sm:w-auto"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-signal h-11 min-h-[44px] px-8 text-sm font-bold shadow-lg disabled:opacity-50 w-full sm:w-auto"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                {submitStage === "uploading" && "1/2 Uploading Resume (PDF)..."}
                {submitStage === "saving" && "2/2 Saving to Database..."}
                {submitStage === "idle" && "Submitting Application..."}
              </span>
            ) : (
              "Submit Application"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
