"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  CoordinatorVerificationSubmission,
  VerificationSubmissionStatus,
  VerificationSubmissionType,
  SubmitterIdentityStatus,
} from "@/lib/cprVerificationStore";
import {
  classifyVerificationSubmission,
  VerificationClassification,
  VerificationRiskLevel,
  VerificationAffectedDomain,
  CensusImpactType,
} from "@/lib/cprVerificationClassifier";
import {
  DownstreamActionType,
  ProspectiveImpactSummary,
} from "@/lib/cprDownstreamImplementation";

const INDIAN_STATES = [
  "ALL_INDIA",
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

interface StatusCounts {
  total: number;
  pending: number;
  needsClarification: number;
  accepted: number;
  rejected: number;
  implemented: number;
}

export default function AdminCPRVerificationsPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data state
  const [submissions, setSubmissions] = useState<CoordinatorVerificationSubmission[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    total: 0,
    pending: 0,
    needsClarification: 0,
    accepted: 0,
    rejected: 0,
    implemented: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter & Search state
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_ADMIN_REVIEW");
  const [stateFilter, setStateFilter] = useState<string>("ALL_INDIA");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Review Modal State
  const [activeSubmission, setActiveSubmission] = useState<CoordinatorVerificationSubmission | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    status: VerificationSubmissionStatus;
    label: string;
    isImplementation?: boolean;
  } | null>(null);

  // Step 5C Implementation Drawer / Modal State
  const [implementationModalOpen, setImplementationModalOpen] = useState<boolean>(false);
  const [implSub, setImplSub] = useState<CoordinatorVerificationSubmission | null>(null);
  const [implLoading, setImplLoading] = useState<boolean>(false);
  const [implError, setImplError] = useState<string | null>(null);
  const [implData, setImplData] = useState<{
    submission: CoordinatorVerificationSubmission;
    classification: VerificationClassification;
    impact: ProspectiveImpactSummary;
    canonicalVenues: Array<{
      canonicalVenueId: string;
      canonicalVenueName: string;
      city: string;
      baselineCourseCount: number;
      baselineReportedTrained: number;
    }>;
    isTestData: boolean;
  } | null>(null);

  const [selectedActionType, setSelectedActionType] = useState<DownstreamActionType>("APPLY_METADATA_CORRECTION");
  const [selectedTargetCanonicalId, setSelectedTargetCanonicalId] = useState<string>("");
  const [implNote, setImplNote] = useState<string>("");
  const [implEvidenceRef, setImplEvidenceRef] = useState<string>("");
  const [customProposedVenueName, setCustomProposedVenueName] = useState<string>("");
  const [customProposedCity, setCustomProposedCity] = useState<string>("");
  const [customProposedTrained, setCustomProposedTrained] = useState<number | "">("");
  const [customProposedCourses, setCustomProposedCourses] = useState<number | "">("");
  const [customCoordinators, setCustomCoordinators] = useState<string>("");
  const [customChampions, setCustomChampions] = useState<string>("");
  const [implConfirmed, setImplConfirmed] = useState<boolean>(false);
  const [implSubmitting, setImplSubmitting] = useState<boolean>(false);
  const [implResult, setImplResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    updatedReport?: any;
    impact?: any;
  } | null>(null);

  // Check Master Admin Auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/cprsanjeevani/auth");
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch Submissions from Admin API
  const fetchSubmissions = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      } else {
        params.set("status", "ALL");
      }

      if (stateFilter && stateFilter !== "ALL_INDIA" && stateFilter !== "ALL") {
        params.set("state", stateFilter);
      }

      if (typeFilter && typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }

      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      const res = await fetch(`/api/cprsanjeevani/verify/admin?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmissions(data.submissions || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        setFetchError(data.error || "Failed to load verification submissions.");
      }
    } catch (err: any) {
      setFetchError("Network error fetching submissions.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter, stateFilter, typeFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated, fetchSubmissions]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/cprsanjeevani/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPasswordInput("");
      } else {
        setAuthError(data.error || "Incorrect password. Access denied.");
      }
    } catch {
      setAuthError("Network error. Unable to authenticate.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/cprsanjeevani/auth", { method: "DELETE" });
      setIsAuthenticated(false);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // Open detail modal
  const handleOpenDetail = (sub: CoordinatorVerificationSubmission) => {
    setActiveSubmission(sub);
    setAdminNoteInput(sub.adminNote || "");
    setActionMessage(null);
    setConfirmDialog(null);
  };

  // Close detail modal
  const handleCloseDetail = () => {
    setActiveSubmission(null);
    setAdminNoteInput("");
    setActionMessage(null);
    setConfirmDialog(null);
  };

  // Open Step 5C Implementation Drawer / Modal
  const handleOpenImplementation = async (sub: CoordinatorVerificationSubmission) => {
    setImplSub(sub);
    setImplementationModalOpen(true);
    setImplLoading(true);
    setImplError(null);
    setImplResult(null);
    setImplConfirmed(false);
    setImplNote("");
    setImplEvidenceRef("");

    try {
      const res = await fetch(`/api/cprsanjeevani/verify/implement?submissionId=${sub.id}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setImplData(data);
        const classification = data.classification as VerificationClassification;
        let defaultAction: DownstreamActionType = "APPLY_METADATA_CORRECTION";
        if (sub.submissionType === "MISSING_COURSE") {
          defaultAction = "CONFIRM_SUPPLEMENTARY_COURSE";
        } else if (classification.affectedDomain === "CENSUS / COUNTS") {
          defaultAction = "APPLY_COUNT_ADJUSTMENT";
        } else if (classification.affectedDomain === "FACULTY ATTRIBUTION") {
          defaultAction = "UPDATE_FACULTY_ATTRIBUTION";
        } else if (classification.affectedDomain === "RECONCILIATION") {
          defaultAction = "APPLY_VENUE_MAPPING";
        } else {
          defaultAction = "APPLY_METADATA_CORRECTION";
        }
        setSelectedActionType(defaultAction);

        setSelectedTargetCanonicalId(sub.canonicalVenueId || (data.canonicalVenues?.[0]?.canonicalVenueId || ""));
        setCustomProposedVenueName(sub.proposedChangesJson?.venue || sub.venue || "");
        setCustomProposedCity(sub.proposedChangesJson?.city || sub.city || "");
        setCustomProposedTrained(sub.proposedChangesJson?.participantsTrained ?? "");
        setCustomProposedCourses(sub.proposedChangesJson?.coursesCount ?? "");
        setCustomCoordinators(sub.proposedChangesJson?.coordinators?.join(", ") || "");
        setCustomChampions(sub.proposedChangesJson?.champions?.join(", ") || "");
      } else {
        setImplError(data.error || "Failed to load implementation data.");
      }
    } catch {
      setImplError("Network error loading implementation details.");
    } finally {
      setImplLoading(false);
    }
  };

  const handleCloseImplementation = () => {
    setImplementationModalOpen(false);
    setImplSub(null);
    setImplData(null);
    setImplError(null);
    setImplResult(null);
    setImplConfirmed(false);
    setImplNote("");
    setImplEvidenceRef("");
  };

  const handleExecuteImplementation = async () => {
    if (!implSub || !implData) return;
    if (implData.isTestData) {
      setImplResult({
        success: false,
        error: "This submission is protected TEST DATA and cannot be implemented into live reconciliation records.",
      });
      return;
    }
    if (!implNote.trim()) {
      setImplResult({
        success: false,
        error: "A mandatory implementation note describing the completed action is required.",
      });
      return;
    }
    if (!implConfirmed) {
      setImplResult({
        success: false,
        error: "You must check the explicit confirmation box before applying the downstream write.",
      });
      return;
    }

    setImplSubmitting(true);
    setImplResult(null);

    try {
      const payload: any = {
        submissionId: implSub.id,
        actionType: selectedActionType,
        implementationNote: implNote.trim(),
        evidenceReference: implEvidenceRef.trim() || undefined,
        targetCanonicalVenueId: selectedTargetCanonicalId || undefined,
        proposedVenueName: customProposedVenueName.trim() || undefined,
        proposedCity: customProposedCity.trim() || undefined,
        proposedTrainedCount: customProposedTrained !== "" ? Number(customProposedTrained) : undefined,
        proposedCoursesCount: customProposedCourses !== "" ? Number(customProposedCourses) : undefined,
        proposedCoordinators: customCoordinators
          ? customCoordinators.split(",").map((c) => c.trim()).filter(Boolean)
          : undefined,
        proposedChampions: customChampions
          ? customChampions.split(",").map((c) => c.trim()).filter(Boolean)
          : undefined,
        adminUser: "Administrator",
      };

      const res = await fetch("/api/cprsanjeevani/verify/implement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setImplResult({
          success: true,
          message: data.message,
          impact: data.impact,
          updatedReport: data.updatedReport,
        });
        if (data.submission && activeSubmission?.id === data.submission.id) {
          setActiveSubmission(data.submission);
        }
        fetchSubmissions();
      } else {
        setImplResult({
          success: false,
          error: data.error || "Failed to execute downstream implementation.",
        });
      }
    } catch {
      setImplResult({
        success: false,
        error: "Network error executing downstream implementation.",
      });
    } finally {
      setImplSubmitting(false);
    }
  };

  // Perform Admin Status Update
  const handleApplyStatusUpdate = async (targetStatus: VerificationSubmissionStatus) => {
    if (!activeSubmission) return;

    // Strict validation for IMPLEMENTED
    if (targetStatus === "IMPLEMENTED" && !adminNoteInput.trim()) {
      setActionMessage({
        type: "error",
        text: "A mandatory implementation note is required when marking a submission as IMPLEMENTED. Please describe what downstream action was actually completed.",
      });
      return;
    }

    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/cprsanjeevani/verify/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSubmission.id,
          status: targetStatus,
          adminNote: adminNoteInput.trim() || undefined,
          adminReviewedBy: "Administrator",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: `Status updated to ${targetStatus}. Decision recorded in PostgreSQL without mutating baseline figures.`,
        });
        // Update current modal item
        if (data.submission) {
          setActiveSubmission(data.submission);
        }
        setConfirmDialog(null);
        // Refresh inbox table & counts
        fetchSubmissions();
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "Failed to update review status.",
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Network error occurred during review update.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper formatting functions
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const getStatusBadge = (status: VerificationSubmissionStatus) => {
    switch (status) {
      case "PENDING_ADMIN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending Review
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-400 text-emerald-900 px-2.5 py-0.5 text-[11px] font-bold shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            Action Required (Accepted)
          </span>
        );
      case "NEEDS_CLARIFICATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-300 text-sky-900 px-2.5 py-0.5 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-600"></span>
            Needs Clarification
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-300 text-rose-900 px-2.5 py-0.5 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
            Rejected
          </span>
        );
      case "IMPLEMENTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-300 text-purple-900 px-2.5 py-0.5 text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
            Implemented
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-medium">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: VerificationSubmissionType) => {
    switch (type) {
      case "VERIFY_CORRECT":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/80 text-emerald-900 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold">
            <span>✅</span>
            <span>Reported Correct</span>
          </span>
        );
      case "SUBMIT_CORRECTION":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 text-amber-900 border border-amber-300 px-2 py-0.5 text-[11px] font-bold">
            <span>✏️</span>
            <span>Correction</span>
          </span>
        );
      case "MISSING_COURSE":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100/80 text-indigo-900 border border-indigo-300 px-2 py-0.5 text-[11px] font-bold">
            <span>➕</span>
            <span>Missing Course</span>
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-slate-100 text-slate-800 px-2 py-0.5 text-[11px] font-medium">
            {type}
          </span>
        );
    }
  };

  const getRiskBadge = (risk: VerificationRiskLevel) => {
    switch (risk) {
      case "HIGH_RISK":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-400 text-rose-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
            <span>🚨</span>
            <span>HIGH RISK</span>
          </span>
        );
      case "MEDIUM_RISK":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-400 text-amber-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
            <span>⚠️</span>
            <span>MEDIUM RISK</span>
          </span>
        );
      case "LOW_RISK":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            <span>ℹ️</span>
            <span>LOW RISK</span>
          </span>
        );
    }
  };

  const getDomainBadge = (domain: VerificationAffectedDomain) => {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-300 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
        <span>🏛️</span>
        <span>{domain}</span>
      </span>
    );
  };

  const getCensusImpactBadge = (impact: CensusImpactType) => {
    if (impact === "YES") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-300 text-rose-800 px-2 py-0.5 text-[10px] font-black uppercase">
          <span>Census Impact: YES</span>
        </span>
      );
    }
    if (impact === "POSSIBLE") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-300 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase">
          <span>Census Impact: POSSIBLE</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 text-[10px] font-medium uppercase">
        <span>Census Impact: NO</span>
      </span>
    );
  };

  const getIdentityBadge = (status: SubmitterIdentityStatus) => {
    switch (status) {
      case "MAPPED_COORDINATOR_MATCHED":
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
            title="Submitter matches coordinator name and phone number on live record"
          >
            ✓ Match
          </span>
        );
      case "MAPPED_COORDINATOR_MOBILE_NOT_MATCHED":
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded"
            title="Name matches mapped coordinator, but phone number differs from live record"
          >
            ⚠️ Alt Mobile
          </span>
        );
      case "MAPPED_COORDINATOR_MOBILE_NOT_AVAILABLE":
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded"
            title="Name matches mapped coordinator, no baseline phone on file"
          >
            ℹ️ No Baseline Mobile
          </span>
        );
      case "OTHER_MANUAL_REVIEW":
      default:
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded"
            title="Third-party / unmapped coordinator submission requiring manual review"
          >
            👤 Manual Review
          </span>
        );
    }
  };

  // Auth Loading
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-700 to-indigo-900 border border-teal-700/80 flex items-center justify-center text-2xl text-white shadow-md">
              📥
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              CPR Verification Inbox
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Master Admin Authentication Required
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                autoFocus
              />
            </div>

            {authError && (
              <div className="rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300 animate-in fade-in">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || !passwordInput.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-teal-700 to-indigo-700 hover:from-teal-800 hover:to-indigo-800 py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? "Unlocking Console..." : "Unlock Verification Inbox"}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← Return to Master Admin Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Inbox View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-20">
      {/* Shared Master Admin Navigation */}
      <AdminHeader currentSection="cpr" onLogout={handleLogout} />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Operational Header */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin"
                className="text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Admin Portal
              </Link>
              <span className="text-xs text-slate-600">/</span>
              <Link
                href="/cprsanjeevani/generate"
                className="text-xs font-semibold text-teal-300 hover:text-teal-200 transition"
              >
                CPR Sanjeevani
              </Link>
              <span className="text-xs text-slate-600">/</span>
              <span className="rounded-md bg-teal-950 border border-teal-800 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-300">
                Verification Inbox
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>📥</span>
              <span>Coordinator Verification &amp; Feedback Inbox</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Operational review desk for Course Coordinator state report confirmations, correction requests, and missing course claims. Review decisions are recorded in PostgreSQL without mutating baseline census figures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchSubmissions}
              disabled={loading}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Refresh submissions list"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              <span>Refresh</span>
            </button>
            <Link
              href="/cprsanjeevani/generate"
              className="rounded-xl bg-teal-800 hover:bg-teal-700 px-4 py-2.5 text-xs font-bold text-white transition shadow-xs"
            >
              CPR Console →
            </Link>
          </div>
        </section>

        {/* Status Summary KPI Cards (Clickable Filters) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Total */}
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/50"
                : "bg-white text-slate-900 border-slate-200 hover:border-slate-400"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Feedbacks
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black">{counts.total}</span>
              <span className="text-xs text-slate-400">All</span>
            </div>
          </button>

          {/* 2. Pending Review */}
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING_ADMIN_REVIEW")}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              statusFilter === "PENDING_ADMIN_REVIEW"
                ? "bg-amber-950 text-white border-amber-800 shadow-md ring-2 ring-amber-400"
                : "bg-white text-slate-900 border-amber-200 hover:border-amber-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Pending Review
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-700">{counts.pending}</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">Review</span>
            </div>
          </button>

          {/* 3. Action Required (Accepted) */}
          <button
            type="button"
            onClick={() => setStatusFilter("ACCEPTED")}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              statusFilter === "ACCEPTED"
                ? "bg-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-emerald-400"
                : "bg-white text-slate-900 border-emerald-300 hover:border-emerald-500 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-black uppercase tracking-wider ${statusFilter === "ACCEPTED" ? "text-emerald-300" : "text-emerald-800"}`}>
                Action Required
              </span>
              {counts.accepted > 0 && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-black ${statusFilter === "ACCEPTED" ? "text-emerald-200" : "text-emerald-700"}`}>
                {counts.accepted}
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                Accepted
              </span>
            </div>
          </button>

          {/* 4. Needs Clarification */}
          <button
            type="button"
            onClick={() => setStatusFilter("NEEDS_CLARIFICATION")}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              statusFilter === "NEEDS_CLARIFICATION"
                ? "bg-sky-950 text-white border-sky-800 shadow-md ring-2 ring-sky-400"
                : "bg-white text-slate-900 border-sky-200 hover:border-sky-400"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
              Needs Info
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-sky-700">{counts.needsClarification}</span>
              <span className="text-[10px] font-semibold text-slate-400">Clarify</span>
            </div>
          </button>

          {/* 5. Rejected */}
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              statusFilter === "REJECTED"
                ? "bg-rose-950 text-white border-rose-800 shadow-md ring-2 ring-rose-400"
                : "bg-white text-slate-900 border-rose-200 hover:border-rose-400"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Rejected
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-700">{counts.rejected}</span>
              <span className="text-[10px] font-semibold text-slate-400">Declined</span>
            </div>
          </button>

          {/* 6. Implemented */}
          <button
            type="button"
            onClick={() => setStatusFilter("IMPLEMENTED")}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              statusFilter === "IMPLEMENTED"
                ? "bg-purple-950 text-white border-purple-800 shadow-md ring-2 ring-purple-400"
                : "bg-white text-slate-900 border-purple-200 hover:border-purple-400"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              Implemented
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-purple-700">{counts.implemented}</span>
              <span className="text-[10px] font-semibold text-slate-400">Completed</span>
            </div>
          </button>
        </section>

        {/* Action Required Banner (Visible when Accepted tab is selected) */}
        {statusFilter === "ACCEPTED" && (
          <section className="rounded-2xl bg-emerald-950 border border-emerald-700 p-5 text-white shadow-sm space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-200">
                Action Required Queue — Accepted Submissions
              </h2>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              These feedback submissions have been administratively assessed and accepted as valid. <strong>Acceptance does NOT automatically modify raw census or certificate records.</strong> Downstream data adjustments (reconciliation decisions, metadata corrections, or supplementary courses) must be performed in their respective authoritative layers before marking as <strong>Implemented</strong>.
            </p>
          </section>
        )}

        {/* Filter and Search Bar */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Search Submissions
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Coordinator, venue, city, phone, ID..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* State / UT Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                State / UT
              </label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL_INDIA" ? "🇮🇳 All States & UTs" : s}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Feedback Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">All Feedback Types</option>
                <option value="VERIFY_CORRECT">✅ Reported Correct (Confirmations)</option>
                <option value="SUBMIT_CORRECTION">✏️ Corrections Requested</option>
                <option value="MISSING_COURSE">➕ Missing Course Submissions</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Review Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="PENDING_ADMIN_REVIEW">⏳ Pending Review</option>
                <option value="ACCEPTED">⚡ Action Required (Accepted)</option>
                <option value="NEEDS_CLARIFICATION">💬 Needs Clarification</option>
                <option value="REJECTED">❌ Rejected</option>
                <option value="IMPLEMENTED">🎉 Implemented</option>
                <option value="ALL">All Review Statuses</option>
              </select>
            </div>

          </div>
        </section>

        {/* Submissions Data Table */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent"></span>
              <p className="text-xs text-slate-500 font-medium">Loading verification submissions from PostgreSQL...</p>
            </div>
          ) : fetchError ? (
            <div className="p-8 text-center space-y-3">
              <div className="text-3xl">⚠️</div>
              <p className="text-sm font-bold text-rose-700">{fetchError}</p>
              <button
                type="button"
                onClick={fetchSubmissions}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-20 px-4 text-center space-y-3">
              <div className="text-4xl">📭</div>
              <h3 className="text-base font-bold text-slate-800">
                {statusFilter === "ACCEPTED"
                  ? "No accepted submissions currently require action."
                  : statusFilter === "PENDING_ADMIN_REVIEW"
                  ? "No verification submissions are currently awaiting review."
                  : searchQuery
                  ? "No submissions match this search query."
                  : stateFilter !== "ALL_INDIA"
                  ? `No verification submissions found for ${stateFilter}.`
                  : "No submissions match the selected filters."}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {statusFilter === "ACCEPTED"
                  ? "All accepted verification submissions have been marked as Implemented or moved."
                  : statusFilter === "PENDING_ADMIN_REVIEW"
                  ? "All coordinator feedbacks have been administratively assessed. Switch to 'All' to review historical records."
                  : "Try clearing filters or search keywords to view other records."}
              </p>
              {(statusFilter !== "PENDING_ADMIN_REVIEW" || stateFilter !== "ALL_INDIA" || typeFilter !== "ALL" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("PENDING_ADMIN_REVIEW");
                    setStateFilter("ALL_INDIA");
                    setTypeFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Reset to Default View
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Date &amp; Time</th>
                    <th className="py-3.5 px-4">State &amp; Location</th>
                    <th className="py-3.5 px-4">Feedback Type</th>
                    <th className="py-3.5 px-4">Classification &amp; Risk</th>
                    <th className="py-3.5 px-4">Submitter / Coordinator</th>
                    <th className="py-3.5 px-4">Target Venue / Summary</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const classification = classifyVerificationSubmission(sub);
                    const isAccepted = sub.submissionStatus === "ACCEPTED";

                    return (
                      <tr
                        key={sub.id}
                        className={`transition group cursor-pointer ${
                          isAccepted ? "bg-emerald-50/30 hover:bg-emerald-50/70" : "hover:bg-teal-50/40"
                        }`}
                        onClick={() => handleOpenDetail(sub)}
                      >
                        {/* Date & Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          <div>{formatDate(sub.createdAt)}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sub.id}</div>
                        </td>

                        {/* State & Location */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="rounded bg-slate-200 text-slate-800 text-[10px] font-bold px-1.5 py-0.2">
                              {sub.stateCode || "IN"}
                            </span>
                            <span>{sub.state}</span>
                          </div>
                          {sub.city && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              📍 {sub.city}
                            </div>
                          )}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getTypeBadge(sub.submissionType)}
                        </td>

                        {/* Classification & Risk */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              {getRiskBadge(classification.riskLevel)}
                              {getCensusImpactBadge(classification.censusImpact)}
                            </div>
                            <div className="mt-0.5">
                              {getDomainBadge(classification.affectedDomain)}
                            </div>
                          </div>
                        </td>

                        {/* Submitter & Identity */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{sub.submittedByName}</div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {getIdentityBadge(sub.identityStatus)}
                            {sub.mappedCoordinatorName && sub.mappedCoordinatorName !== sub.submittedByName && (
                              <span className="text-[10px] text-slate-500">
                                (Mapped: {sub.mappedCoordinatorName})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Target Venue & Summary */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate" title={sub.venue || "New Course"}>
                            {sub.venue || "Missing Course Claim"}
                          </div>
                          {sub.correctionNote && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5" title={sub.correctionNote}>
                              "{sub.correctionNote}"
                            </p>
                          )}
                          {sub.submissionType === "VERIFY_CORRECT" && (
                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              Confirmed existing figures accurate
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(sub.submissionStatus)}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(sub);
                            }}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer ${
                              isAccepted
                                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                                : "bg-slate-100 group-hover:bg-teal-700 text-slate-700 group-hover:text-white"
                            }`}
                          >
                            {isAccepted ? "Action Required →" : "Review →"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <span>
              Showing <strong>{submissions.length}</strong> {submissions.length === 1 ? "submission" : "submissions"}
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>🔒 Admin-only coordinator contact info secured in detail review drawer</span>
            </div>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* DETAILED SUBMISSION REVIEW MODAL / DRAWER */}
      {/* ========================================================================= */}
      {activeSubmission && (() => {
        const subClassification = classifyVerificationSubmission(activeSubmission);
        const isAccepted = activeSubmission.submissionStatus === "ACCEPTED";

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans"
            onClick={handleCloseDetail}
          >
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0 border-b border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-md font-bold">
                      {activeSubmission.id}
                    </span>
                    {getTypeBadge(activeSubmission.submissionType)}
                    {getStatusBadge(activeSubmission.submissionStatus)}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Coordinator Verification Review
                  </h2>
                  <p className="text-xs text-slate-400">
                    Submitted on {formatDate(activeSubmission.createdAt)} for State of {activeSubmission.state}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 text-sm font-bold transition cursor-pointer"
                  title="Close modal (Esc)"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-800">
                
                {/* Alert Feedback Messages */}
                {actionMessage && (
                  <div
                    className={`rounded-2xl p-4 border text-xs font-semibold animate-in fade-in ${
                      actionMessage.type === "success"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-rose-50 border-rose-300 text-rose-900"
                    }`}
                  >
                    {actionMessage.type === "success" ? "✅ " : "⚠️ "}
                    {actionMessage.text}
                  </div>
                )}

                {/* PROMINENT ACTION REQUIRED SECTION (For ACCEPTED submissions) */}
                {isAccepted && (
                  <section className="rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500 p-5 text-white shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚡</span>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                            Action Required: Downstream Implementation Pending
                          </h3>
                          <p className="text-[11px] text-emerald-100/80">
                            Accepted by {activeSubmission.adminReviewedBy || "Administrator"} on {formatDate(activeSubmission.adminReviewedAt || activeSubmission.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 px-2.5 py-1 text-[10px] font-black uppercase">
                        Pending Downstream Action
                      </span>
                    </div>

                    {/* Operational Classification Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-emerald-900">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Risk Classification</span>
                        <div>{getRiskBadge(subClassification.riskLevel)}</div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Affected Data Domain</span>
                        <div>{getDomainBadge(subClassification.affectedDomain)}</div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Census Impact</span>
                        <div>{getCensusImpactBadge(subClassification.censusImpact)}</div>
                      </div>

                      {subClassification.riskReasons.length > 0 && (
                        <div className="sm:col-span-3 pt-2 border-t border-slate-800 text-[11px] text-amber-200">
                          <strong>Trigger Factors:</strong> {subClassification.riskReasons.join(" • ")}
                        </div>
                      )}
                    </div>

                    {/* Guided Recommended Operational Action */}
                    <div className="rounded-xl bg-emerald-900/40 border border-emerald-700/60 p-3.5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                        Recommended Implementation Path:
                      </span>
                      <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                        {subClassification.recommendedAction}
                      </p>
                    </div>

                    {activeSubmission.adminNote && (
                      <div className="rounded-xl bg-slate-900/90 border border-slate-700 p-3 text-[11px] text-slate-300 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Admin Acceptance Note:</span>
                        <p className="italic text-white">"{activeSubmission.adminNote}"</p>
                      </div>
                    )}

                    {/* Step 5C Controlled Implementation Action Trigger */}
                    <div className="pt-3 border-t border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] text-emerald-200">
                        ⚡ <strong>Controlled Action:</strong> Open Implementation Review to preview impact and write reconciliation overlay.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenImplementation(activeSubmission)}
                        className="rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black px-4 py-2.5 text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <span>⚡</span>
                        <span>
                          {subClassification.affectedDomain === "CENSUS / COUNTS"
                            ? "Review Count Correction →"
                            : activeSubmission.submissionType === "MISSING_COURSE"
                            ? "Review Missing Course →"
                            : subClassification.affectedDomain === "FACULTY ATTRIBUTION"
                            ? "Update Report Attribution →"
                            : subClassification.affectedDomain === "RECONCILIATION"
                            ? "Review Venue Mapping →"
                            : "Implement Downstream Correction →"}
                        </span>
                      </button>
                    </div>
                  </section>
                )}

                {/* PROMINENT IMPLEMENTED SECTION (For IMPLEMENTED submissions) */}
                {activeSubmission.submissionStatus === "IMPLEMENTED" && (
                  <section className="rounded-2xl bg-gradient-to-br from-purple-950 to-slate-900 border-2 border-purple-500 p-5 text-white shadow-md space-y-3 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-purple-200">
                            Closed-Loop Status: Implemented &amp; Reconciled
                          </h3>
                          <p className="text-[11px] text-purple-200/80">
                            Downstream overlay applied. Authoritative State Report recalculated and verified.
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/cprsanjeevani/verify/${encodeURIComponent(activeSubmission.state)}`}
                        target="_blank"
                        className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 text-xs transition flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                      >
                        <span>👁️ View Updated State Report</span>
                        <span>↗</span>
                      </Link>
                    </div>
                    {activeSubmission.adminNote && (
                      <div className="rounded-xl bg-slate-900/90 border border-purple-800/80 p-3 text-[11px] text-purple-100 font-mono">
                        <span className="text-[10px] font-bold uppercase text-purple-300 block mb-0.5">Implementation Audit Trail:</span>
                        {activeSubmission.adminNote}
                      </div>
                    )}
                  </section>
                )}

                {/* Section 1: Submitter Profile (Admin-Only PII) */}
                <section className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>👤</span>
                      <span>Submitter &amp; Coordinator Identity</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2 py-0.5 rounded">
                      Admin Protected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Submitter Name</span>
                      <span className="font-bold text-slate-900 text-sm">{activeSubmission.submittedByName}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Mapped Roster Coordinator</span>
                      <span className="font-semibold text-slate-800">
                        {activeSubmission.mappedCoordinatorName || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Mobile Number</span>
                      <a
                        href={`tel:${activeSubmission.submittedByMobile}`}
                        className="font-mono font-bold text-teal-700 hover:underline text-xs"
                      >
                        📞 {activeSubmission.submittedByMobile}
                      </a>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Email Address</span>
                      {activeSubmission.submittedByEmail ? (
                        <a
                          href={`mailto:${activeSubmission.submittedByEmail}`}
                          className="font-medium text-teal-700 hover:underline text-xs"
                        >
                          ✉️ {activeSubmission.submittedByEmail}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </div>

                    <div className="sm:col-span-2 pt-1">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Roster Match Assessment</span>
                      <div className="flex items-center gap-2">
                        {getIdentityBadge(activeSubmission.identityStatus)}
                        <span className="text-[11px] text-slate-600">
                          {activeSubmission.identityStatus === "MAPPED_COORDINATOR_MATCHED" &&
                            "Verified match against National CPR Day venue coordinator register."}
                          {activeSubmission.identityStatus === "MAPPED_COORDINATOR_MOBILE_NOT_MATCHED" &&
                            "Coordinator name matches state roster, but alternative contact phone used."}
                          {activeSubmission.identityStatus === "MAPPED_COORDINATOR_MOBILE_NOT_AVAILABLE" &&
                            "Name matches state roster; no phone was recorded in baseline data."}
                          {activeSubmission.identityStatus === "OTHER_MANUAL_REVIEW" &&
                            "Third party submission requiring administrator verification."}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Target Venue / Row Reference */}
                <section className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>📍</span>
                      <span>Target Report Row Context</span>
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500">
                      State: {activeSubmission.state} ({activeSubmission.stateCode})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Venue Name</span>
                      <span className="font-bold text-slate-900">{activeSubmission.venue || "—"}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">City</span>
                      <span className="font-semibold text-slate-800">{activeSubmission.city || "—"}</span>
                    </div>

                    {activeSubmission.reportRowId && (
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Report Row Identifier(s)</span>
                        <span className="font-mono text-slate-700">{activeSubmission.reportRowId}</span>
                      </div>
                    )}

                    {activeSubmission.canonicalVenueId && (
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Canonical Venue ID</span>
                        <span className="font-mono text-slate-700">{activeSubmission.canonicalVenueId}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Section 3: Feedback / Correction Payload */}
                <section className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span>📝</span>
                    <span>Coordinator Feedback Details</span>
                  </h3>

                  {/* Case 1: VERIFY_CORRECT */}
                  {activeSubmission.submissionType === "VERIFY_CORRECT" && (
                    <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-4 text-emerald-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                        <span>✅</span>
                        <span>Verified as 100% Accurate</span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        The course coordinator reviewed this State Programme row and confirmed all venue details, course count, and trained metrics match actual events.
                      </p>
                      {activeSubmission.currentDataJson && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-emerald-700">Trained Confirmed:</span>
                            <span className="block font-bold text-emerald-950 text-sm">
                              {activeSubmission.currentDataJson.participantsTrained ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-emerald-700">Courses Confirmed:</span>
                            <span className="block font-bold text-emerald-950 text-sm">
                              {activeSubmission.currentDataJson.coursesCount ?? 1}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 2: SUBMIT_CORRECTION */}
                  {activeSubmission.submissionType === "SUBMIT_CORRECTION" && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        Coordinator requested adjustments to the following venue data fields:
                      </p>

                      {/* Side-by-Side Comparison */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                              <th className="p-2.5">Field</th>
                              <th className="p-2.5">Current Recorded Value</th>
                              <th className="p-2.5 bg-amber-50/80 text-amber-950">Proposed Correction</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeSubmission.proposedChangesJson?.venue !== undefined && (
                              <tr>
                                <td className="p-2.5 font-bold text-slate-700">Venue Name</td>
                                <td className="p-2.5 text-slate-500">{activeSubmission.currentDataJson?.venue || "—"}</td>
                                <td className="p-2.5 bg-amber-50/40 font-bold text-amber-950">
                                  {activeSubmission.proposedChangesJson.venue}
                                </td>
                              </tr>
                            )}

                            {activeSubmission.proposedChangesJson?.city !== undefined && (
                              <tr>
                                <td className="p-2.5 font-bold text-slate-700">City</td>
                                <td className="p-2.5 text-slate-500">{activeSubmission.currentDataJson?.city || "—"}</td>
                                <td className="p-2.5 bg-amber-50/40 font-bold text-amber-950">
                                  {activeSubmission.proposedChangesJson.city}
                                </td>
                              </tr>
                            )}

                            {activeSubmission.proposedChangesJson?.participantsTrained !== undefined && (
                              <tr>
                                <td className="p-2.5 font-bold text-slate-700">Trained Participants</td>
                                <td className="p-2.5 text-slate-500">{activeSubmission.currentDataJson?.participantsTrained ?? "—"}</td>
                                <td className="p-2.5 bg-amber-50/40 font-bold text-amber-950 text-sm">
                                  {activeSubmission.proposedChangesJson.participantsTrained}
                                </td>
                              </tr>
                            )}

                            {activeSubmission.proposedChangesJson?.coursesCount !== undefined && (
                              <tr>
                                <td className="p-2.5 font-bold text-slate-700">Courses Conducted</td>
                                <td className="p-2.5 text-slate-500">{activeSubmission.currentDataJson?.coursesCount ?? 1}</td>
                                <td className="p-2.5 bg-amber-50/40 font-bold text-amber-950">
                                  {activeSubmission.proposedChangesJson.coursesCount}
                                </td>
                              </tr>
                            )}

                            {activeSubmission.proposedChangesJson?.coordinators !== undefined && (
                              <tr>
                                <td className="p-2.5 font-bold text-slate-700">Coordinators</td>
                                <td className="p-2.5 text-slate-500">
                                  {activeSubmission.currentDataJson?.coordinators?.join(", ") || "—"}
                                </td>
                                <td className="p-2.5 bg-amber-50/40 font-bold text-amber-950">
                                  {activeSubmission.proposedChangesJson.coordinators.join(", ")}
                                </td>
                              </tr>
                            )}

                            {activeSubmission.proposedChangesJson?.champions !== undefined && (
                              <tr>
                                <td className="p-2.5 font-bold text-slate-700">Champions</td>
                                <td className="p-2.5 text-slate-500">
                                  {activeSubmission.currentDataJson?.champions?.join(", ") || "—"}
                                </td>
                                <td className="p-2.5 bg-amber-50/40 font-bold text-amber-950">
                                  {activeSubmission.proposedChangesJson.champions.join(", ")}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {activeSubmission.correctionNote && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Coordinator Remarks:</span>
                          <p className="text-xs text-slate-800 italic">"{activeSubmission.correctionNote}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 3: MISSING_COURSE */}
                  {activeSubmission.submissionType === "MISSING_COURSE" && (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 space-y-2 text-indigo-950">
                        <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
                          <span>➕</span>
                          <span>Report of Missing Unlisted Course</span>
                        </div>
                        <p className="text-xs text-indigo-800 leading-relaxed">
                          Coordinator claims an additional training session conducted on CPR Day was omitted from the Draft V1 report.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Venue Name</span>
                          <span className="font-bold text-slate-900 block">{activeSubmission.venue || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">City</span>
                          <span className="font-bold text-slate-900 block">{activeSubmission.city || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Trained Claimed</span>
                          <span className="font-bold text-slate-900 block text-sm">
                            {activeSubmission.proposedChangesJson?.participantsTrained ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Course Date</span>
                          <span className="font-medium text-slate-800 block">
                            {activeSubmission.proposedChangesJson?.courseDate || "2026-09-04"}
                          </span>
                        </div>
                      </div>

                      {activeSubmission.correctionNote && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Submission Note:</span>
                          <p className="text-xs text-slate-800 italic">"{activeSubmission.correctionNote}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Section 4: Admin Review History */}
                {(activeSubmission.adminReviewedBy || activeSubmission.adminReviewedAt || activeSubmission.adminNote) && (
                  <section className="rounded-2xl bg-slate-100/80 border border-slate-200 p-4 space-y-2 text-xs">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>🛡️</span>
                      <span>Administrative Review &amp; Decision History</span>
                    </h3>
                    <div className="text-slate-600 flex flex-wrap items-center gap-2">
                      <span>Reviewed by: <strong>{activeSubmission.adminReviewedBy || "Administrator"}</strong></span>
                      <span>•</span>
                      <span>At: {formatDate(activeSubmission.adminReviewedAt)}</span>
                      {activeSubmission.adminDecision && (
                        <>
                          <span>•</span>
                          <span>Decision: <strong className="text-slate-900">{activeSubmission.adminDecision}</strong></span>
                        </>
                      )}
                    </div>
                    {activeSubmission.adminNote && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-[11px]">
                        {activeSubmission.adminNote}
                      </div>
                    )}
                  </section>
                )}

                {/* Section 5: Admin Review Decision Controls */}
                <section className="rounded-2xl bg-slate-900 text-white p-5 space-y-4 shadow-md border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Record Administrative Decision</span>
                    </h3>
                    <span className="text-[10px] font-bold text-teal-300">Non-Mutating Status Record</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Admin Review Remarks / Notes {confirmDialog?.isImplementation ? "(Mandatory for Implemented)" : "(Optional)"}
                    </label>
                    <textarea
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder={
                        confirmDialog?.isImplementation
                          ? "Describe the downstream correction actually completed (e.g. Venue metadata corrected in reconciliation layer; Faculty attribution updated after verification; Supplementary course entered after attendance verification)..."
                          : "Enter notes, verification reasoning, or follow-up instructions..."
                      }
                      rows={3}
                      className={`w-full rounded-xl border p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                        confirmDialog?.isImplementation && !adminNoteInput.trim()
                          ? "border-amber-500 bg-amber-950/40 focus:border-amber-400 focus:ring-amber-400"
                          : "border-slate-700 bg-slate-800/90 focus:border-teal-500 focus:ring-teal-500"
                      }`}
                    />
                  </div>

                  {/* Confirmation Box (if action triggered) */}
                  {confirmDialog ? (
                    <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in ${
                      confirmDialog.isImplementation
                        ? "bg-purple-950/90 border-purple-400 text-purple-100"
                        : "bg-amber-950/80 border-amber-500/60 text-amber-200"
                    }`}>
                      <div className="text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-sm">
                          <span>{confirmDialog.isImplementation ? "🎉" : "⚠️"}</span>
                          <span>Confirm Decision: {confirmDialog.label}</span>
                        </div>
                        {confirmDialog.isImplementation ? (
                          <div className="bg-purple-900/60 p-3 rounded-lg border border-purple-500/50 text-[11px] space-y-1.5 text-purple-200 mt-2">
                            <p className="font-bold text-white">
                              Important Safety Confirmation:
                            </p>
                            <p>
                              Mark as <strong>Implemented</strong> only after the downstream correction has actually been completed and verified in the authoritative source.
                            </p>
                            <p className="text-amber-300 font-semibold">
                              A descriptive implementation note above is required before confirming.
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-300/80 mt-1">
                            This action updates the verification lifecycle status in PostgreSQL without altering census figures or certificate data.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={actionLoading || (confirmDialog.isImplementation && !adminNoteInput.trim())}
                          onClick={() => handleApplyStatusUpdate(confirmDialog.status)}
                          className={`rounded-lg font-bold px-4 py-2 text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            confirmDialog.isImplementation
                              ? "bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md"
                              : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                          }`}
                        >
                          {actionLoading ? "Applying..." : confirmDialog.isImplementation ? "Confirm & Mark Implemented" : "Confirm & Save"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => setConfirmDialog(null)}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Action Buttons */
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* ACCEPT */}
                      <button
                        type="button"
                        disabled={actionLoading || activeSubmission.submissionStatus === "ACCEPTED"}
                        onClick={() =>
                          setConfirmDialog({
                            status: "ACCEPTED",
                            label: "Accept this coordinator verification as valid for downstream action",
                            isImplementation: false,
                          })
                        }
                        className="rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Accept feedback for downstream action"
                      >
                        <span>✅</span>
                        <span>Accept (Action Required)</span>
                      </button>

                      {/* NEEDS_CLARIFICATION */}
                      <button
                        type="button"
                        disabled={actionLoading || activeSubmission.submissionStatus === "NEEDS_CLARIFICATION"}
                        onClick={() =>
                          setConfirmDialog({
                            status: "NEEDS_CLARIFICATION",
                            label: "Mark as Needs Clarification for coordinator follow-up",
                            isImplementation: false,
                          })
                        }
                        className="rounded-xl bg-sky-800 hover:bg-sky-700 disabled:opacity-40 disabled:hover:bg-sky-800 text-white font-bold px-3.5 py-2.5 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Request additional information from coordinator"
                      >
                        <span>💬</span>
                        <span>Request Clarification</span>
                      </button>

                      {/* REJECT */}
                      <button
                        type="button"
                        disabled={actionLoading || activeSubmission.submissionStatus === "REJECTED"}
                        onClick={() =>
                          setConfirmDialog({
                            status: "REJECTED",
                            label: "Reject this verification submission",
                            isImplementation: false,
                          })
                        }
                        className="rounded-xl bg-rose-900 hover:bg-rose-800 disabled:opacity-40 disabled:hover:bg-rose-900 text-rose-100 font-bold px-3.5 py-2.5 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Decline this submission"
                      >
                        <span>❌</span>
                        <span>Reject</span>
                      </button>

                      {/* MARK IMPLEMENTED */}
                      <button
                        type="button"
                        disabled={actionLoading || activeSubmission.submissionStatus === "IMPLEMENTED"}
                        onClick={() =>
                          setConfirmDialog({
                            status: "IMPLEMENTED",
                            label: "Mark as Implemented (downstream reconciliation completed)",
                            isImplementation: true,
                          })
                        }
                        className="rounded-xl bg-purple-900 hover:bg-purple-800 disabled:opacity-40 disabled:hover:bg-purple-900 text-purple-100 font-bold px-3.5 py-2.5 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Mark that downstream data was updated"
                      >
                        <span>🎉</span>
                        <span>Mark Implemented</span>
                      </button>

                      {/* RESET TO PENDING */}
                      {activeSubmission.submissionStatus !== "PENDING_ADMIN_REVIEW" && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            setConfirmDialog({
                              status: "PENDING_ADMIN_REVIEW",
                              label: "Reset status back to Pending Admin Review",
                              isImplementation: false,
                            })
                          }
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 text-xs transition cursor-pointer ml-auto"
                          title="Reset to Pending"
                        >
                          ↩️ Reset to Pending
                        </button>
                      )}
                    </div>
                  )}
                </section>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-100 p-4 flex items-center justify-between border-t border-slate-200 shrink-0 text-xs">
                <span className="text-slate-500">
                  🔒 Decision changes are recorded directly in PostgreSQL without modifying raw files.
                </span>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 font-bold transition cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* STEP 5C: IMPLEMENTATION REVIEW MODAL / DRAWER */}
      {/* ========================================================================= */}
      {implementationModalOpen && implSub && (() => {
        const classification = implData?.classification || classifyVerificationSubmission(implSub);
        const isTestData = implData?.isTestData || implSub.id === "VERIF-1788524059637-35T4";

        // Live calculate prospective impact based on modal input
        const currentReportTrained = implData?.impact?.currentStateTrained ?? 0;
        const currentReportCourses = implData?.impact?.currentStateCourses ?? 0;

        let liveTrainedDelta = 0;
        let liveCourseDelta = 0;

        if (selectedActionType === "CONFIRM_SUPPLEMENTARY_COURSE") {
          const suppTrained = customProposedTrained !== "" ? Number(customProposedTrained) : (implSub.proposedChangesJson?.participantsTrained ?? 0);
          liveTrainedDelta = suppTrained;
          liveCourseDelta = 1;
        } else if (selectedActionType === "APPLY_COUNT_ADJUSTMENT") {
          const adjTrained = customProposedTrained !== "" ? Number(customProposedTrained) : (implSub.proposedChangesJson?.participantsTrained ?? (implSub.currentDataJson?.participantsTrained ?? 0));
          const baseTrained = implSub.currentDataJson?.participantsTrained ?? 0;
          liveTrainedDelta = adjTrained - baseTrained;
          if (customProposedCourses !== "" && implSub.currentDataJson?.coursesCount !== undefined) {
            liveCourseDelta = Number(customProposedCourses) - implSub.currentDataJson.coursesCount;
          }
        }

        const prospectiveStateTrained = currentReportTrained + liveTrainedDelta;
        const prospectiveStateCourses = currentReportCourses + liveCourseDelta;
        const prospectiveNationalTrained = 47033 + liveTrainedDelta;
        const prospectiveNationalCourses = 395 + liveCourseDelta;

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans"
            onClick={handleCloseImplementation}
          >
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Implementation Modal Header */}
              <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0 border-b border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs bg-teal-900/80 text-teal-300 border border-teal-700 px-2.5 py-0.5 rounded-md font-bold">
                      {implSub.id}
                    </span>
                    <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-bold text-slate-300">
                      State: {implSub.state} ({implSub.stateCode})
                    </span>
                    {getTypeBadge(implSub.submissionType)}
                    {getRiskBadge(classification.riskLevel)}
                    {getDomainBadge(classification.affectedDomain)}
                    {getCensusImpactBadge(classification.censusImpact)}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>⚡</span>
                    <span>Controlled Downstream Implementation Review</span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Master Admin Implementation Desk • Updates live reconciliation overlay with closed-loop state report verification.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseImplementation}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 text-sm font-bold transition cursor-pointer"
                  title="Close modal (Esc)"
                >
                  ✕
                </button>
              </div>

              {/* Implementation Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-800">
                {implLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent"></span>
                    <p className="text-xs text-slate-500 font-medium">
                      Loading prospective impact calculations &amp; canonical state venues...
                    </p>
                  </div>
                ) : implError ? (
                  <div className="rounded-2xl bg-rose-50 border border-rose-300 p-5 text-rose-900 text-center space-y-3">
                    <div className="text-3xl">⚠️</div>
                    <p className="text-sm font-bold">{implError}</p>
                    <button
                      type="button"
                      onClick={() => handleOpenImplementation(implSub)}
                      className="rounded-xl bg-rose-900 text-white px-4 py-2 text-xs font-bold"
                    >
                      Retry Loading
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Test Data Safeguard Warning */}
                    {isTestData && (
                      <div className="rounded-2xl bg-amber-950 border-2 border-amber-500 p-5 text-amber-100 shadow-md space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2 font-black text-amber-300 text-sm uppercase tracking-wider">
                          <span>🛑</span>
                          <span>TEST DATA SAFEGUARD ACTIVE</span>
                        </div>
                        <p className="text-xs text-amber-200 leading-relaxed">
                          Submission <strong>VERIF-1788524059637-35T4</strong> is protected <strong>TEST DATA</strong> (Maharashtra, Test Venue / Test City, 15 trained). Downstream write execution is strictly blocked by system invariants to prevent modifying baseline census figures and supplementary registries.
                        </p>
                      </div>
                    )}

                    {/* Result Success Banner */}
                    {implResult?.success && (
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500 p-5 text-white shadow-md space-y-4 animate-in fade-in">
                        <div className="flex items-center gap-2 font-black text-emerald-300 text-sm uppercase tracking-wider">
                          <span>✅</span>
                          <span>Downstream Correction Successfully Implemented &amp; Verified</span>
                        </div>
                        <p className="text-xs text-emerald-100 leading-relaxed">
                          {implResult.message}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-emerald-800 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Recalculated State Trained Total:</span>
                            <span className="font-bold text-emerald-300 text-base">{prospectiveStateTrained.toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Live Reconciled National Trained:</span>
                            <span className="font-bold text-emerald-300 text-base">{prospectiveNationalTrained.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <Link
                            href={`/cprsanjeevani/verify/${encodeURIComponent(implSub.state)}`}
                            target="_blank"
                            className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black px-4 py-2.5 text-xs transition flex items-center gap-2 shadow-md"
                          >
                            <span>👁️ View Updated State Report</span>
                            <span>↗</span>
                          </Link>
                          <button
                            type="button"
                            onClick={handleCloseImplementation}
                            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 text-xs transition"
                          >
                            Done &amp; Close Review
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Result Error Banner */}
                    {implResult && !implResult.success && (
                      <div className="rounded-2xl bg-rose-950 border border-rose-700 p-4 text-rose-200 text-xs font-semibold animate-in fade-in">
                        ⚠️ {implResult.error}
                      </div>
                    )}

                    {!implResult?.success && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Originating Feedback & Evidence */}
                        <div className="space-y-4">
                          {/* 1. Originating Summary */}
                          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-2">
                              <span>📋</span>
                              <span>Accepted Feedback Summary</span>
                            </h3>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500 block text-[10px] font-bold uppercase">Submitter Name</span>
                                <span className="font-bold text-slate-900">{implSub.submittedByName}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] font-bold uppercase">Phone</span>
                                <span className="font-mono text-slate-700">{implSub.submittedByMobile}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-500 block text-[10px] font-bold uppercase">Target Venue</span>
                                <span className="font-semibold text-slate-900">{implSub.venue || "Missing Course Claim"}</span>
                              </div>
                              {implSub.city && (
                                <div>
                                  <span className="text-slate-500 block text-[10px] font-bold uppercase">City</span>
                                  <span className="font-medium text-slate-800">{implSub.city}</span>
                                </div>
                              )}
                              {implSub.canonicalVenueId && (
                                <div>
                                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Canonical ID</span>
                                  <span className="font-mono text-slate-700">{implSub.canonicalVenueId}</span>
                                </div>
                              )}
                            </div>

                            {/* Current vs Proposed Diff Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs mt-2">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                                    <th className="p-2">Field</th>
                                    <th className="p-2">Current</th>
                                    <th className="p-2 bg-amber-50/80 text-amber-950">Proposed</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {implSub.proposedChangesJson?.venue && (
                                    <tr>
                                      <td className="p-2 font-bold text-slate-700">Venue</td>
                                      <td className="p-2 text-slate-500">{implSub.currentDataJson?.venue || "—"}</td>
                                      <td className="p-2 bg-amber-50/40 font-bold text-amber-950">{implSub.proposedChangesJson.venue}</td>
                                    </tr>
                                  )}
                                  {implSub.proposedChangesJson?.city && (
                                    <tr>
                                      <td className="p-2 font-bold text-slate-700">City</td>
                                      <td className="p-2 text-slate-500">{implSub.currentDataJson?.city || "—"}</td>
                                      <td className="p-2 bg-amber-50/40 font-bold text-amber-950">{implSub.proposedChangesJson.city}</td>
                                    </tr>
                                  )}
                                  {implSub.proposedChangesJson?.participantsTrained !== undefined && (
                                    <tr>
                                      <td className="p-2 font-bold text-slate-700">Trained</td>
                                      <td className="p-2 text-slate-500">{implSub.currentDataJson?.participantsTrained ?? "—"}</td>
                                      <td className="p-2 bg-amber-50/40 font-bold text-amber-950">{implSub.proposedChangesJson.participantsTrained}</td>
                                    </tr>
                                  )}
                                  {implSub.proposedChangesJson?.coursesCount !== undefined && (
                                    <tr>
                                      <td className="p-2 font-bold text-slate-700">Courses</td>
                                      <td className="p-2 text-slate-500">{implSub.currentDataJson?.coursesCount ?? 1}</td>
                                      <td className="p-2 bg-amber-50/40 font-bold text-amber-950">{implSub.proposedChangesJson.coursesCount}</td>
                                    </tr>
                                  )}
                                  {implSub.proposedChangesJson?.coordinators && (
                                    <tr>
                                      <td className="p-2 font-bold text-slate-700">Coordinators</td>
                                      <td className="p-2 text-slate-500">{implSub.currentDataJson?.coordinators?.join(", ") || "—"}</td>
                                      <td className="p-2 bg-amber-50/40 font-bold text-amber-950">{implSub.proposedChangesJson.coordinators.join(", ")}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {implSub.correctionNote && (
                              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Coordinator Remarks:</span>
                                <p className="text-xs text-slate-800 italic">"{implSub.correctionNote}"</p>
                              </div>
                            )}

                            {implSub.adminNote && (
                              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
                                <span className="text-[10px] font-bold uppercase text-emerald-800">Admin Acceptance Note:</span>
                                <p className="text-xs text-emerald-950 italic">"{implSub.adminNote}"</p>
                              </div>
                            )}
                          </div>

                          {/* Certificate Hand-off / Multi-Source Notice */}
                          {(classification.affectedDomain === "CERTIFICATE DATA" || classification.affectedDomain === "MULTIPLE SOURCES") && (
                            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 space-y-2 text-indigo-950">
                              <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                                <span>📜</span>
                                <span>Certificate Record Notice (Explicit Separation)</span>
                              </div>
                              <p className="text-[11px] text-indigo-800 leading-relaxed">
                                Certificate issuance and corrections are handled explicitly in the <strong>Admin Certificate Console</strong>. Downstream implementation here updates the reconciliation and state report layer, and will NOT alter Google Drive files or renumber certificate IDs.
                              </p>
                              <div className="pt-1">
                                <Link
                                  href="/cprsanjeevani/generate"
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs"
                                >
                                  <span>Open CPR Certificate Console</span>
                                  <span>↗</span>
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RIGHT COLUMN: Downstream Action Configuration & Live Preview */}
                        <div className="space-y-4">
                          {/* 1. Downstream Action Selection */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
                            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-2">
                              <span>⚙️</span>
                              <span>Downstream Action &amp; Overlay Targets</span>
                            </h3>

                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Select Downstream Action Branch
                              </label>
                              <select
                                value={selectedActionType}
                                onChange={(e) => setSelectedActionType(e.target.value as DownstreamActionType)}
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                              >
                                <option value="APPLY_METADATA_CORRECTION">
                                  🔤 Apply Report Metadata Correction (Venue/City Spelling - Low Risk)
                                </option>
                                <option value="UPDATE_FACULTY_ATTRIBUTION">
                                  👥 Update Faculty Attribution (Coordinators / Champions - Medium Risk)
                                </option>
                                <option value="APPLY_VENUE_MAPPING">
                                  🔗 Apply Venue Mapping Decision (SAME_BASELINE_VENUE - Medium Risk)
                                </option>
                                <option value="APPLY_COUNT_ADJUSTMENT">
                                  🔢 Apply Verified Count Adjustment (Trained/Courses - High Risk)
                                </option>
                                <option value="CONFIRM_SUPPLEMENTARY_COURSE">
                                  ➕ Confirm Supplementary Course / Venue (SUPPLEMENTARY_NEW_VENUE - High Risk)
                                </option>
                              </select>
                            </div>

                            {/* Target Canonical Venue Dropdown (if not new venue) */}
                            {selectedActionType !== "CONFIRM_SUPPLEMENTARY_COURSE" && (
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                                  Target Canonical Physical Venue
                                </label>
                                <select
                                  value={selectedTargetCanonicalId}
                                  onChange={(e) => setSelectedTargetCanonicalId(e.target.value)}
                                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                                >
                                  {implData?.canonicalVenues.map((v) => (
                                    <option key={v.canonicalVenueId} value={v.canonicalVenueId}>
                                      [{v.canonicalVenueId}] {v.canonicalVenueName} ({v.city}) — Baseline: {v.baselineReportedTrained} trained
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Dynamic Target Input Fields */}
                            {(selectedActionType === "APPLY_METADATA_CORRECTION" || selectedActionType === "CONFIRM_SUPPLEMENTARY_COURSE") && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                                    Target Venue Name
                                  </label>
                                  <input
                                    type="text"
                                    value={customProposedVenueName}
                                    onChange={(e) => setCustomProposedVenueName(e.target.value)}
                                    placeholder="Correct venue name..."
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                                    Target City
                                  </label>
                                  <input
                                    type="text"
                                    value={customProposedCity}
                                    onChange={(e) => setCustomProposedCity(e.target.value)}
                                    placeholder="Correct city..."
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                                  />
                                </div>
                              </div>
                            )}

                            {(selectedActionType === "APPLY_COUNT_ADJUSTMENT" || selectedActionType === "CONFIRM_SUPPLEMENTARY_COURSE") && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                                    Verified Trained Count
                                  </label>
                                  <input
                                    type="number"
                                    value={customProposedTrained}
                                    onChange={(e) => setCustomProposedTrained(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="Verified trained..."
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                                    Course Count
                                  </label>
                                  <input
                                    type="number"
                                    value={customProposedCourses}
                                    onChange={(e) => setCustomProposedCourses(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="Courses Conducted..."
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                                  />
                                </div>
                              </div>
                            )}

                            {selectedActionType === "UPDATE_FACULTY_ATTRIBUTION" && (
                              <div className="space-y-2 pt-1">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                                    Additional Coordinators (Comma-separated)
                                  </label>
                                  <input
                                    type="text"
                                    value={customCoordinators}
                                    onChange={(e) => setCustomCoordinators(e.target.value)}
                                    placeholder="Dr. Coordinator Name..."
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                                    Additional Champions (Comma-separated)
                                  </label>
                                  <input
                                    type="text"
                                    value={customChampions}
                                    onChange={(e) => setCustomChampions(e.target.value)}
                                    placeholder="Champion Name..."
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Authoritative Layer Information */}
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 space-y-1">
                              <span className="font-bold text-slate-800 block text-[10px] uppercase">Authoritative Layer:</span>
                              <p>
                                Writes to Reconciliation Overlay (<code>data/cpr_venue_metadata_overrides.json</code>).
                                Baseline Raw JSON (<code>data/cpr_day_baseline_venues.json</code>) remains completely untouched.
                              </p>
                            </div>
                          </div>

                          {/* 2. Prospective Impact Preview Card */}
                          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white p-4 space-y-3 border border-slate-800 shadow-md">
                            <div className="flex items-center justify-between border-b border-teal-800/60 pb-2">
                              <h4 className="font-black text-xs uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                                <span>📊</span>
                                <span>Prospective Impact Preview (Before Write)</span>
                              </h4>
                              <span className="text-[10px] font-bold bg-teal-900 text-teal-200 px-2 py-0.5 rounded">
                                Preview Only
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {/* State Trained */}
                              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                  {implSub.state} Trained Total
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-slate-400 line-through text-xs">{currentReportTrained.toLocaleString("en-IN")}</span>
                                  <span className="text-teal-300 font-black text-sm">→ {prospectiveStateTrained.toLocaleString("en-IN")}</span>
                                </div>
                                <span className={`text-[10px] font-bold ${liveTrainedDelta > 0 ? "text-emerald-400" : liveTrainedDelta < 0 ? "text-rose-400" : "text-slate-400"}`}>
                                  Delta: {liveTrainedDelta >= 0 ? `+${liveTrainedDelta}` : liveTrainedDelta}
                                </span>
                              </div>

                              {/* National Trained */}
                              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                  National Reconciled Total
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-slate-400 line-through text-xs">47,033</span>
                                  <span className="text-teal-300 font-black text-sm">→ {prospectiveNationalTrained.toLocaleString("en-IN")}</span>
                                </div>
                                <span className={`text-[10px] font-bold ${liveTrainedDelta > 0 ? "text-emerald-400" : liveTrainedDelta < 0 ? "text-rose-400" : "text-slate-400"}`}>
                                  Delta: {liveTrainedDelta >= 0 ? `+${liveTrainedDelta}` : liveTrainedDelta}
                                </span>
                              </div>

                              {/* State Courses */}
                              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                  {implSub.state} Courses
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-slate-400 line-through text-xs">{currentReportCourses}</span>
                                  <span className="text-teal-300 font-black text-sm">→ {prospectiveStateCourses}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                  Delta: {liveCourseDelta >= 0 ? `+${liveCourseDelta}` : liveCourseDelta}
                                </span>
                              </div>

                              {/* National Courses */}
                              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                  National Courses
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-slate-400 line-through text-xs">395</span>
                                  <span className="text-teal-300 font-black text-sm">→ {prospectiveNationalCourses}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                  Delta: {liveCourseDelta >= 0 ? `+${liveCourseDelta}` : liveCourseDelta}
                                </span>
                              </div>
                            </div>

                            <p className="text-[10px] text-teal-200/80 italic border-t border-slate-800 pt-2">
                              Note: Historical Draft V1 census snapshot remains frozen. Recalculated values will appear on the Live Post-Verification state report.
                            </p>
                          </div>

                          {/* 3. Mandatory Audit Trail & Execution Confirmation */}
                          <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-3 border border-slate-800">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                              <span>✍️</span>
                              <span>Implementation Audit Trail &amp; Confirmation</span>
                            </h4>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                                Implementation Note <span className="text-amber-400">(Mandatory)</span>
                              </label>
                              <textarea
                                value={implNote}
                                onChange={(e) => setImplNote(e.target.value)}
                                placeholder="Describe the downstream action completed and verified..."
                                rows={2}
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                                Evidence Reference <span className="text-slate-500">(Recommended for High-Risk)</span>
                              </label>
                              <input
                                type="text"
                                value={implEvidenceRef}
                                onChange={(e) => setImplEvidenceRef(e.target.value)}
                                placeholder="e.g. Verified via State Coordinator WhatsApp Attendance Log / Letter #402..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                              />
                            </div>

                            {/* Explicit Confirmation Checkbox */}
                            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={implConfirmed}
                                onChange={(e) => setImplConfirmed(e.target.checked)}
                                disabled={isTestData}
                                className="mt-0.5 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-300 font-medium">
                                I confirm this downstream correction has been verified and authorize applying it to the reconciliation overlay.
                              </span>
                            </label>

                            {/* Action Button */}
                            <div className="pt-2">
                              <button
                                type="button"
                                disabled={implSubmitting || isTestData || !implNote.trim() || !implConfirmed}
                                onClick={handleExecuteImplementation}
                                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 text-slate-950 font-black py-3 text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                              >
                                {implSubmitting ? (
                                  <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></span>
                                    <span>Applying &amp; Verifying State Report...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>⚡</span>
                                    <span>
                                      {selectedActionType === "APPLY_METADATA_CORRECTION"
                                        ? "APPLY REPORT METADATA CORRECTION"
                                        : selectedActionType === "UPDATE_FACULTY_ATTRIBUTION"
                                        ? "UPDATE REPORT ATTRIBUTION"
                                        : selectedActionType === "APPLY_VENUE_MAPPING"
                                        ? "APPLY VENUE MAPPING DECISION"
                                        : selectedActionType === "APPLY_COUNT_ADJUSTMENT"
                                        ? "APPLY VERIFIED COUNT ADJUSTMENT"
                                        : "CONFIRM AS GENUINE SUPPLEMENTARY COURSE"}
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Implementation Modal Footer */}
              <div className="bg-slate-100 p-4 flex items-center justify-between border-t border-slate-200 shrink-0 text-xs">
                <span className="text-slate-500 text-[11px]">
                  🔒 Closed-Loop Verification: Recalculates and verifies State Report before setting status to IMPLEMENTED.
                </span>
                <button
                  type="button"
                  onClick={handleCloseImplementation}
                  className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 font-bold transition cursor-pointer"
                >
                  Close Desk
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
