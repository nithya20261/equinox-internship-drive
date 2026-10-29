import { useState, useEffect, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  submitStudentApplication,
  getOpportunities,
  type Opportunity,
} from "@/lib/api";

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

  // Form Fields (Exact 10 fields, clean without auto-filled values)
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

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (!isLoggedIn) {
    return (
      <div className="border border-white/20 bg-[#151515] p-6 text-center rounded-xl">
        <Lock className="mx-auto h-8 w-8 text-[#7484FE]" />
        <h3 className="font-display mt-3 text-xl text-[#F7F2F6]">
          Student Login Required
        </h3>
        <p className="mt-2 text-xs text-[#F7F2F6]/60 max-w-sm mx-auto">
          Please log in to your student account to submit your Equinox Career Connect application.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/login" className="btn btn-signal h-9 px-5 text-xs font-bold">
            Log In
          </Link>
          <Link to="/register" className="btn btn-line h-9 px-5 text-xs">
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="border border-[#33FF67] bg-[#33FF67]/10 p-6 text-center rounded-xl">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#33FF67]" />
        <h3 className="font-display mt-3 text-xl text-[#F7F2F6]">
          Application Submitted
        </h3>
        <p className="mt-2 font-mono text-xs text-[#33FF67]">{successMessage}</p>
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resumeFile) {
      setErrorMessage("Please upload your resume file (PDF, DOC, or DOCX).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitStudentApplication({
        fullName,
        contactNumber,
        email,
        instituteAndBranch,
        preferredRole,
        resumeFile,
        videoUrl,
        relevantSkills,
        portfolioUrl: portfolioUrl.trim() || undefined,
        availability,
      });

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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-center gap-2 border-l-2 border-destructive bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Full Name */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          1. Full Name <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter full name"
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* 2. Contact Number */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          2. Contact Number <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="tel"
          required
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          placeholder="Enter contact number"
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* 3. Email Address */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          3. Email Address <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* 4. Institute Name and Current Course / Branch */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          4. Institute Name and Current Course / Branch <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="text"
          required
          value={instituteAndBranch}
          onChange={(e) => setInstituteAndBranch(e.target.value)}
          placeholder="e.g. MLRIT - B.Tech CSE"
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* 5. Preferred Internship Role (dynamically populated) */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          5. Preferred Internship Role <span className="text-[#33FF67]">*</span>
        </label>
        <select
          required
          value={preferredRole}
          onChange={(e) => setPreferredRole(e.target.value)}
          disabled={loadingRoles}
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none cursor-pointer"
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
                  {op.role} ({op.domain})
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* 6. Resume / CV Upload */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          6. Resume / CV Upload <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="file"
          required
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full text-xs text-[#F7F2F6] file:mr-3 file:border-0 file:bg-[#7484FE] file:px-3 file:py-1.5 file:font-mono file:text-xs file:font-bold file:text-black cursor-pointer"
        />
        {resumeFile && (
          <p className="mt-1 text-[11px] font-mono text-[#33FF67]">
            ✓ {resumeFile.name} ({(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* 7. One-Minute Self-Introduction Video — Google Drive link input */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          7. One-Minute Self-Introduction Video (Google Drive link) <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="url"
          required
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* 8. Relevant Skills */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          8. Relevant Skills <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="text"
          required
          value={relevantSkills}
          onChange={(e) => setRelevantSkills(e.target.value)}
          placeholder="e.g. React, Node.js, Python, UI/UX"
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* 9. Projects / Portfolio / GitHub / LinkedIn Profile (Optional) */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          9. Projects / Portfolio / GitHub / LinkedIn Profile <span className="text-[#F7F2F6]/50">(Optional)</span>
        </label>
        <input
          type="url"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          placeholder="https://github.com/... or https://linkedin.com/in/..."
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* 10. Internship Availability */}
      <div>
        <label className="block text-xs font-mono uppercase text-[#F7F2F6]">
          10. Internship Availability <span className="text-[#33FF67]">*</span>
        </label>
        <input
          type="text"
          required
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          placeholder="e.g. Immediate / From Nov 2026 / 3 Months"
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] outline-none"
        />
      </div>

      {/* Submission Actions */}
      <div className="pt-2 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="btn btn-line h-10 px-4 text-xs"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-signal h-10 px-6 text-xs font-bold disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
            </span>
          ) : (
            "Submit Application"
          )}
        </button>
      </div>
    </form>
  );
}
