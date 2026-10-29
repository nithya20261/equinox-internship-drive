import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { Container, EmptyState, PageHero } from "@/components/site/primitives";
import { OpportunitySlot } from "@/components/site/blocks";
import { useAuth } from "@/lib/auth";
import {
  getOpportunities,
  submitBatchApplications,
  type Opportunity,
  type BatchApplicationResult,
} from "@/lib/api";
import { INTERNSHIP_CATEGORIES, type InternshipTrack } from "@/data/site";

export const Route = createFileRoute("/internships/")({
  head: () =>
    pageMeta(
      "Opportunities",
      "Search internship opportunities from startups and companies at Equinox E-Summit 2K26. Apply to multiple roles with tailored resumes."
    ),
  component: Internships,
});

function Internships() {
  const { isLoggedIn, isStudent } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrack, setActiveTrack] = useState<InternshipTrack>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Multi-internship application state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumeMode, setResumeMode] = useState<"profile" | "custom">("profile");
  const [customResume, setCustomResume] = useState<File | null>(null);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchApplicationResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getOpportunities()
      .then((data) => {
        if (mounted) {
          setOpportunities(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load opportunities:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Filter listings by track, category, and search query
  const filtered = opportunities.filter((op) => {
    const q = searchQuery.toLowerCase().trim();
    const opRole = (op.role || "").toLowerCase();
    const opDomain = (op.domain || "").toLowerCase();
    const opLoc = (op.location || "").toLowerCase();

    // 1. Search Query
    if (q && !opRole.includes(q) && !opDomain.includes(q) && !opLoc.includes(q)) {
      return false;
    }

    // 2. Track Filter
    const isTech = INTERNSHIP_CATEGORIES.technical.some(
      (cat) => cat.toLowerCase() === opDomain || opRole.includes(cat.toLowerCase())
    );
    const isNonTech = INTERNSHIP_CATEGORIES.nonTechnical.some(
      (cat) => cat.toLowerCase() === opDomain || opRole.includes(cat.toLowerCase())
    );

    if (activeTrack === "technical" && !isTech && isNonTech) {
      return false;
    }
    if (activeTrack === "non-technical" && !isNonTech && isTech) {
      return false;
    }

    // 3. Category Filter
    if (selectedCategory !== "all") {
      const catLower = selectedCategory.toLowerCase();
      const matchesCategory =
        opDomain === catLower ||
        opRole.includes(catLower) ||
        (op.skills && JSON.stringify(op.skills).toLowerCase().includes(catLower));

      if (!matchesCategory) return false;
    }

    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    const validFilteredIds = filtered.map((o) => o.id).filter(Boolean);
    setSelectedIds(new Set(validFilteredIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchApply = async () => {
    if (selectedIds.size === 0) return;
    setBatchError(null);
    setBatchResult(null);

    if (!customResume) {
      setBatchError("Please select a resume file to upload (PDF, DOC, or DOCX up to 10MB).");
      return;
    }

    try {
      setIsSubmittingBatch(true);
      const res = await submitBatchApplications({
        internshipIds: Array.from(selectedIds),
        customResume,
      });
      setBatchResult(res);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as any)?.message || (err as any)?.error_description || "Failed to submit applications.";
      setBatchError(msg);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const availableCategories =
    activeTrack === "technical"
      ? INTERNSHIP_CATEGORIES.technical
      : activeTrack === "non-technical"
      ? INTERNSHIP_CATEGORIES.nonTechnical
      : [...INTERNSHIP_CATEGORIES.technical, ...INTERNSHIP_CATEGORIES.nonTechnical];

  const selectedOpportunities = opportunities.filter((o) => selectedIds.has(o.id));

  return (
    <div className="riso-texture brochure-grid min-h-screen">
      <PageHero
        label="Opportunities board"
        title={
          <>
            Find your
            <br />
            internship.
          </>
        }
      >
        Explore 20 curated Technical and Non-technical categories. Multi-select roles and apply in
        one seamless session with your choice of resume.
      </PageHero>

      <Container className="py-14">
        {/* Auth notice banner when not logged in */}
        {!isLoggedIn && (
          <div className="mb-10 flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-[#151515] text-[#33FF67]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="headline text-xl md:text-2xl text-[#F7F2F6]">
                  Login Required to Apply
                </h2>
                <p className="mt-1 text-sm text-[#F7F2F6]/60">
                  Log in as a registered student to submit multi-role applications and track status
                  live.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link to="/login" className="btn btn-line h-10 px-4">
                Log in
              </Link>
              <Link to="/register" className="btn btn-signal h-10 px-4">
                Register
              </Link>
            </div>
          </div>
        )}

        {/* Confidentiality protocol notice */}
        <div className="mb-6 flex items-center justify-between rounded-full border border-white/20 bg-[#151515] px-5 py-2.5 text-xs font-mono text-white/80">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#33FF67]" />
            <span className="text-[#33FF67] font-bold uppercase">RECRUITER SHIELD ACTIVE:</span>
            <span>Hiring partner identities are concealed to guarantee merit-based review.</span>
          </div>
          <span className="hidden sm:inline-block text-[#7484FE]">
            Confidential Candidate Pool
          </span>
        </div>

        {/* Track Selection Tabs */}
        <div className="mb-6 grid grid-cols-3 p-1 rounded-full border border-white/20 bg-[#151515]">
          {[
            { id: "all", label: "All Tracks (20 Categories)" },
            { id: "technical", label: "Technical Track (10)" },
            { id: "non-technical", label: "Non-Technical Track (10)" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTrack(t.id as InternshipTrack);
                setSelectedCategory("all");
              }}
              className={`font-sans text-sm font-semibold tracking-normal py-2.5 rounded-full text-center transition-all ${
                activeTrack === t.id
                  ? "bg-[#7484FE] text-[#151515] font-bold shadow-[0_0_12px_rgba(116,132,254,0.3)]"
                  : "text-[#F7F2F6]/60 hover:text-[#F7F2F6] hover:bg-[#2A2A2A]/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Category Filter Bar */}
        <div className="rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles, required skills or domains..."
                className="w-full rounded-xl border border-white/20 bg-[#151515] px-4 py-3 font-sans text-sm text-[#F7F2F6] outline-none placeholder:text-[#F7F2F6]/40 focus:border-[#7484FE]"
              />
            </div>
            <div className="w-full md:w-80">
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by Category"
                className="w-full rounded-xl border border-white/20 bg-[#151515] px-4 py-3 font-sans text-sm text-[#F7F2F6] outline-none focus:border-[#7484FE]"
              >
                <option value="all">
                  All Categories ({availableCategories.length})
                </option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Bar with Multi-select Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-4">
            <p className="eyebrow text-[#F7F2F6]">{filtered.length} listings</p>
            {isLoggedIn && filtered.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="font-mono text-xs text-[#7484FE] hover:underline"
                >
                  Select all visible
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-[#2A2A2A]">·</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="font-mono text-xs text-[#F7F2F6]/50 hover:underline"
                    >
                      Clear ({selectedIds.size})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <p className="eyebrow text-[#7484FE]">Sorted by · newest</p>
        </div>

        {/* Opportunity Listings */}
        {isLoading ? (
          <div className="my-12 flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[#33FF67]" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="mt-8 border-t border-[#2A2A2A]">
            {filtered.map((item, idx) => (
              <OpportunitySlot
                key={item.id}
                n={idx + 1}
                item={item}
                isLoggedIn={isLoggedIn}
                selectable={isLoggedIn && isStudent}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="Internship opportunities are being finalised."
              body="Participating companies and roles will appear here soon. Register or log in to be ready when applications open."
              action={
                !isLoggedIn ? (
                  <Link to="/register" className="btn btn-ink">
                    Register <ArrowRight size={16} />
                  </Link>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Preview and structural exploration */}
        <div className="mt-16">
          <div className="flex items-center justify-between">
            <p className="eyebrow mb-4 text-[#F7F2F6]/50">Listing preview — structure only</p>
            {!isLoggedIn && (
              <span className="eyebrow mb-4 flex items-center gap-1.5 text-xs text-[#33FF67]">
                <Lock size={12} /> Details locked
              </span>
            )}
          </div>

          <div className="border-t border-[#2A2A2A] opacity-70">
            {[1, 2].map((n) => (
              <OpportunitySlot key={n} n={n} isLoggedIn={isLoggedIn} />
            ))}
          </div>

          {isLoggedIn ? (
            <Link to="/internships/$id" params={{ id: "preview" }} className="btn btn-line mt-8">
              Preview a detail page <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/login" className="btn btn-signal mt-8">
              <Lock size={16} /> Log in to view opportunity details <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </Container>

      {/* Floating Batch Selection Dock */}
      {selectedIds.size > 0 && (
        <aside
          aria-label="Application summary"
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 border border-[#33FF67] bg-black/95 px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#33FF67] text-black font-mono font-bold text-xs">
              {selectedIds.size}
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-[#F7F2F6]">
                {selectedIds.size} {selectedIds.size === 1 ? "role" : "roles"} selected
              </p>
              <p className="font-mono text-[10px] text-[#F7F2F6]/60">
                Submit separate applications in one session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="btn btn-line h-9 px-3 text-xs"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setIsApplyModalOpen(true);
                setBatchResult(null);
                setBatchError(null);
              }}
              className="btn btn-signal h-9 px-4 text-xs font-bold"
            >
              Apply to Selected ({selectedIds.size})
            </button>
          </div>
        </aside>
      )}

      {/* Multi-role Application Modal */}
      {isApplyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[#2A2A2A] bg-[#0A0A0A] p-6 text-[#F7F2F6] md:p-8">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute right-4 top-4 text-[#F7F2F6]/60 hover:text-[#F7F2F6]"
            >
              <X size={20} />
            </button>

            {batchResult ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto h-12 w-12 text-[#33FF67]" />
                <h3 className="headline mt-4 text-2xl text-[#F7F2F6]">
                  Applications Processed!
                </h3>
                <div className="mt-4 border border-[#2A2A2A] bg-black p-4 text-left font-mono text-xs space-y-2">
                  <p className="text-[#33FF67]">
                    ✓ Successfully submitted: {batchResult.appliedCount} new application(s)
                  </p>
                  {batchResult.duplicateCount > 0 && (
                    <p className="text-[#7484FE]">
                      ℹ Duplicate prevention: {batchResult.duplicateCount} role(s) already had an
                      existing application.
                    </p>
                  )}
                  <p className="text-[#F7F2F6]/60 pt-2 border-t border-[#2A2A2A]">
                    Each application record has an independent status tracked by partner
                    evaluators.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link to="/dashboard/student" className="btn btn-signal h-10 px-6">
                    Go to Applications Dashboard <ArrowRight size={14} className="ml-1" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="btn btn-line h-10 px-6"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="pulse-dot h-2 w-2 rounded-full bg-[#33FF67]" />
                  <p className="font-mono text-xs font-bold tracking-widest text-[#7484FE] uppercase">
                    Multi-Role Application
                  </p>
                </div>
                <h2 id="modal-title" className="headline mt-2 text-2xl md:text-3xl">
                  Submit Applications
                </h2>
                <p className="mt-2 text-xs text-[#F7F2F6]/60">
                  You are submitting applications for {selectedOpportunities.length} internship role
                  (s). Separate records will be created for each role.
                </p>

                {/* Selected Roles List */}
                <div className="mt-4 max-h-40 overflow-y-auto border border-[#2A2A2A] bg-black p-3 divide-y divide-[#2A2A2A]">
                  {selectedOpportunities.map((op) => (
                    <div key={op.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#F7F2F6]">{op.role}</p>
                        <p className="font-mono text-[10px] text-[#7484FE]">{op.domain}</p>
                      </div>
                      <span className="font-mono text-[10px] text-[#33FF67]">{op.mode}</span>
                    </div>
                  ))}
                </div>

                {/* Resume Upload Input */}
                <div className="mt-6 border border-[#2A2A2A] bg-black p-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#F7F2F6]">
                    Upload Resume *
                  </p>
                  <p className="mt-1 text-xs text-[#F7F2F6]/60">
                    Upload your resume for the selected roles (PDF, DOC, or DOCX, Max 10MB).
                  </p>

                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setCustomResume(file);
                        setBatchError(null);
                      }}
                      className="block w-full text-xs text-[#F7F2F6] file:mr-4 file:border-0 file:bg-[#7484FE] file:px-4 file:py-2 file:font-mono file:text-xs file:font-bold file:text-black hover:file:bg-[#7484FE]/80"
                    />
                    {customResume && (
                      <p className="mt-2 font-mono text-[11px] text-[#33FF67]">
                        Selected: {customResume.name} ({(customResume.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>

                {batchError && (
                  <div className="mt-4 flex items-center gap-2 border-l-2 border-destructive bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{batchError}</span>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingBatch}
                    onClick={() => setIsApplyModalOpen(false)}
                    className="btn btn-line h-10 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingBatch}
                    onClick={handleBatchApply}
                    className="btn btn-signal h-10 px-6 text-xs font-bold disabled:opacity-50"
                  >
                    {isSubmittingBatch ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      `Submit ${selectedOpportunities.length} Application(s)`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
