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
    <form onSubmit={handleSubmit} className="w-full space-y-6">
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
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter full name"
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
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
          <input
            type="tel"
            required
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="Enter contact number (e.g. +91 9876543210)"
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
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
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
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
          <input
            type="text"
            required
            value={instituteAndBranch}
            onChange={(e) => setInstituteAndBranch(e.target.value)}
            placeholder="e.g. MLRIT - B.Tech CSE"
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
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
          <select
            required
            value={preferredRole}
            onChange={(e) => setPreferredRole(e.target.value)}
            disabled={loadingRoles}
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none cursor-pointer"
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
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-[#F7F2F6] file:mr-3 file:border-0 file:bg-[#7484FE] file:px-4 file:py-2 file:font-mono file:text-xs file:font-bold file:text-black file:rounded-md cursor-pointer hover:file:bg-[#5868df] transition-all"
            />
            {resumeFile && (
              <p className="mt-2 text-[11px] font-mono text-[#33FF67]">
                ✓ Selected: {resumeFile.name} ({(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
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
          <input
            type="url"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
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
          <input
            type="text"
            required
            value={relevantSkills}
            onChange={(e) => setRelevantSkills(e.target.value)}
            placeholder="e.g. React, Node.js, Python, UI/UX, Cloud"
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
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
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://github.com/... or https://linkedin.com/in/..."
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
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
          <input
            type="text"
            required
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Immediate / Full-Time / 3-6 Months"
            className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-2.5 font-sans text-xs text-[#F7F2F6] placeholder:text-[#F7F2F6]/30 focus:border-[#7484FE] focus:ring-1 focus:ring-[#7484FE] outline-none transition-all"
          />
        </div>
      </div>

      {/* Submission Actions */}
      <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="btn btn-line h-11 px-5 text-xs"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-signal h-11 px-8 text-xs font-bold shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
            </span>
          ) : (
            "Submit Application"
          )}
        </button>
      </div>
    </form>
  );
}
