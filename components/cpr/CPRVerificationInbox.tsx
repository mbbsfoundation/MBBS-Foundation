"use client";

import React, { useState, useEffect } from "react";
import type {
  CoordinatorVerificationSubmission,
  VerificationSubmissionStatus,
  VerificationSubmissionType,
  SubmitterIdentityStatus,
} from "@/lib/cprVerificationStore";

interface CPRVerificationInboxProps {
  initialStateFilter?: string;
  statesList?: string[];
}

export default function CPRVerificationInbox({
  initialStateFilter = "ALL",
  statesList = [],
}: CPRVerificationInboxProps) {
  const [submissions, setSubmissions] = useState<CoordinatorVerificationSubmission[]>([]);
  const [counts, setCounts] = useState<{
    total: number;
    pending: number;
    needsClarification: number;
    accepted: number;
    rejected: number;
    implemented: number;
  }>({
    total: 0,
    pending: 0,
    needsClarification: 0,
    accepted: 0,
    rejected: 0,
    implemented: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState<string>(initialStateFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Active Review Item Modal
  const [activeItem, setActiveItem] = useState<CoordinatorVerificationSubmission | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedState && selectedState !== "ALL" && selectedState !== "ALL_INDIA") {
        params.set("state", selectedState);
      }
      if (selectedStatus && selectedStatus !== "ALL") {
        params.set("status", selectedStatus);
      }
      if (selectedType && selectedType !== "ALL") {
        params.set("type", selectedType);
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
        setError(data.error || "Failed to load verification submissions.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error loading verification inbox.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [selectedState, selectedStatus, selectedType, searchQuery]);

  const handleOpenReview = (item: CoordinatorVerificationSubmission) => {
    setActiveItem(item);
    setAdminNoteInput(item.adminNote || "");
    setActionMessage(null);
  };

  const handleUpdateStatus = async (newStatus: VerificationSubmissionStatus) => {
    if (!activeItem) return;
    setIsUpdating(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/cprsanjeevani/verify/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeItem.id,
          status: newStatus,
          adminNote: adminNoteInput,
          adminReviewedBy: "Administrator",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(data.message || `Status updated to ${newStatus}`);
        setActiveItem(data.submission);
        // Refresh list
        fetchSubmissions();
      } else {
        setActionMessage(`Error: ${data.error || "Failed to update status"}`);
      }
    } catch (err: any) {
      console.error(err);
      setActionMessage("Network error updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getIdentityBadge = (status: SubmitterIdentityStatus) => {
    switch (status) {
      case "MAPPED_COORDINATOR_MATCHED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
            ✓ Mobile Matched
          </span>
        );
      case "MAPPED_COORDINATOR_MOBILE_NOT_MATCHED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
            ⚠️ Mobile Unmatched
          </span>
        );
      case "MAPPED_COORDINATOR_MOBILE_NOT_AVAILABLE":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-medium">
            ℹ️ No Mobile in Record
          </span>
        );
      case "OTHER_MANUAL_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 font-bold">
            🔍 Manual Review Required
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: VerificationSubmissionStatus) => {
    switch (status) {
      case "PENDING_ADMIN_REVIEW":
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black">
            PENDING REVIEW
          </span>
        );
      case "NEEDS_CLARIFICATION":
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-black">
            NEEDS CLARIFICATION
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black">
            ACCEPTED
          </span>
        );
      case "REJECTED":
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-black">
            REJECTED
          </span>
        );
      case "IMPLEMENTED":
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 font-black">
            IMPLEMENTED
          </span>
        );
    }
  };

  const getTypeBadge = (type: VerificationSubmissionType) => {
    switch (type) {
      case "VERIFY_CORRECT":
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            VERIFY CORRECT
          </span>
        );
      case "SUBMIT_CORRECTION":
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
            CORRECTION
          </span>
        );
      case "MISSING_COURSE":
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold">
            MISSING COURSE
          </span>
        );
    }
  };

  // Find related submissions for the active review item
  const relatedSubmissions = activeItem
    ? submissions.filter(
        (s) =>
          s.id !== activeItem.id &&
          ((s.canonicalVenueId && s.canonicalVenueId === activeItem.canonicalVenueId) ||
            (s.venue && activeItem.venue && s.venue.toLowerCase() === activeItem.venue.toLowerCase()) ||
            s.submittedByName.toLowerCase() === activeItem.submittedByName.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Summary Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Submissions
          </span>
          <span className="text-2xl font-black text-slate-900">{counts.total}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Pending Review
          </span>
          <span className="text-2xl font-black text-amber-900">{counts.pending}</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            Clarification
          </span>
          <span className="text-2xl font-black text-blue-900">{counts.needsClarification}</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Accepted
          </span>
          <span className="text-2xl font-black text-emerald-900">{counts.accepted}</span>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            Rejected
          </span>
          <span className="text-2xl font-black text-rose-900">{counts.rejected}</span>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-bold text-teal-600 uppercase tracking-wider">
            Implemented
          </span>
          <span className="text-2xl font-black text-teal-900">{counts.implemented}</span>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* State Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              State / UT
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="ALL">All States / UTs</option>
              {statesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Submission Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Submission Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="VERIFY_CORRECT">Verify Correct</option>
              <option value="SUBMIT_CORRECTION">Submit Correction</option>
              <option value="MISSING_COURSE">Missing Course</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_ADMIN_REVIEW">Pending Review</option>
              <option value="NEEDS_CLARIFICATION">Needs Clarification</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="IMPLEMENTED">Implemented</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Submitter / Venue
            </label>
            <input
              type="text"
              placeholder="Search coordinator, venue, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>
      </div>

      {/* 3. Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
            Coordinator Verification Submissions ({submissions.length})
          </h3>
          {loading && <span className="text-xs text-teal-600 animate-pulse font-bold">Loading...</span>}
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs border-b border-red-100">
            {error}
          </div>
        )}

        {submissions.length === 0 && !loading ? (
          <div className="p-12 text-center text-slate-400">
            <span className="text-3xl block mb-2">📥</span>
            <p className="font-semibold text-slate-600">No verification submissions found matching filters.</p>
            <p className="text-xs text-slate-400 mt-1">
              Submissions from the public coordinator verification page will appear here for admin review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Venue &amp; City</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Mobile &amp; Identity</th>
                  <th className="py-3 px-4">Submitted On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">{getTypeBadge(item.submissionType)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.state}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 max-w-[220px] truncate">
                        {item.venue || item.proposedChangesJson?.venue || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        📍 {item.city || item.proposedChangesJson?.city || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {item.submittedByName}
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <div className="font-mono text-slate-700 font-bold">
                        {item.submittedByMobile}
                      </div>
                      <div>{getIdentityBadge(item.identityStatus)}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.submissionStatus)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(item)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        REVIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Side-by-Side Admin Review Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-900">
                  Verification Review: {activeItem.id}
                </h3>
                {getTypeBadge(activeItem.submissionType)}
                {getStatusBadge(activeItem.submissionStatus)}
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 mt-4">
              {/* Submitter Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block text-slate-400 font-bold uppercase text-[10px]">
                    Coordinator Name
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {activeItem.submittedByName}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase text-[10px]">
                    Mobile &amp; Verification
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 block">
                    {activeItem.submittedByMobile}
                  </span>
                  <div className="mt-0.5">{getIdentityBadge(activeItem.identityStatus)}</div>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase text-[10px]">
                    Submission Time
                  </span>
                  <span className="text-xs text-slate-700">
                    {new Date(activeItem.createdAt).toLocaleString("en-IN")}
                  </span>
                  {activeItem.submittedByEmail && (
                    <span className="block text-[11px] text-slate-500">
                      ✉️ {activeItem.submittedByEmail}
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Current Website Data */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      1. Current Draft V1 Website Data
                    </span>
                  </div>

                  {activeItem.currentDataJson ? (
                    <div className="text-xs space-y-2 text-slate-700">
                      <div>
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">
                          Venue
                        </span>
                        <span className="font-black text-slate-900 text-sm">
                          {activeItem.currentDataJson.venue || "—"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-bold text-slate-500 block text-[10px] uppercase">
                            City
                          </span>
                          <span className="font-bold text-slate-800">
                            {activeItem.currentDataJson.city || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 block text-[10px] uppercase">
                            Reported Trained
                          </span>
                          <span className="font-black text-teal-700 text-sm">
                            {activeItem.currentDataJson.participantsTrained?.toLocaleString() || "—"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">
                          Mapped Coordinators
                        </span>
                        <span>{activeItem.currentDataJson.coordinators?.join(", ") || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">
                          CPR Champions
                        </span>
                        <span>{activeItem.currentDataJson.champions?.join(", ") || "—"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-4">
                      {activeItem.submissionType === "MISSING_COURSE"
                        ? "Course is currently unrecorded in baseline/draft census."
                        : "No prior snapshot recorded."}
                    </div>
                  )}
                </div>

                {/* Right Column: Coordinator Proposed Data / Confirmation */}
                <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                      2. Coordinator Submission
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700">
                      {activeItem.submissionType}
                    </span>
                  </div>

                  {activeItem.submissionType === "VERIFY_CORRECT" && (
                    <div className="text-xs text-emerald-800 space-y-2">
                      <div className="bg-emerald-100/70 p-3 rounded-lg border border-emerald-300 font-medium">
                        ✓ Coordinator confirmed that current course and venue information is fully correct.
                      </div>
                    </div>
                  )}

                  {activeItem.proposedChangesJson && (
                    <div className="text-xs space-y-2 text-slate-800">
                      {activeItem.proposedChangesJson.venue && (
                        <div>
                          <span className="font-bold text-indigo-600 block text-[10px] uppercase">
                            Proposed Venue
                          </span>
                          <span className="font-black text-slate-900 text-sm bg-amber-100 px-1.5 py-0.5 rounded">
                            {activeItem.proposedChangesJson.venue}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {activeItem.proposedChangesJson.city && (
                          <div>
                            <span className="font-bold text-indigo-600 block text-[10px] uppercase">
                              Proposed City
                            </span>
                            <span className="font-bold text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded">
                              {activeItem.proposedChangesJson.city}
                            </span>
                          </div>
                        )}

                        {activeItem.proposedChangesJson.participantsTrained !== undefined && (
                          <div>
                            <span className="font-bold text-indigo-600 block text-[10px] uppercase">
                              Proposed Trained
                            </span>
                            <span className="font-black text-indigo-900 bg-amber-100 px-1.5 py-0.5 rounded">
                              {activeItem.proposedChangesJson.participantsTrained.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {activeItem.proposedChangesJson.coordinators && (
                        <div>
                          <span className="font-bold text-indigo-600 block text-[10px] uppercase">
                            Proposed Coordinators
                          </span>
                          <span className="bg-amber-100 px-1.5 py-0.5 rounded block">
                            {activeItem.proposedChangesJson.coordinators.join(", ")}
                          </span>
                        </div>
                      )}

                      {activeItem.proposedChangesJson.champions && (
                        <div>
                          <span className="font-bold text-indigo-600 block text-[10px] uppercase">
                            Proposed Champions
                          </span>
                          <span className="bg-amber-100 px-1.5 py-0.5 rounded block">
                            {activeItem.proposedChangesJson.champions.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanatory Note & Evidence */}
                  {activeItem.correctionNote && (
                    <div className="pt-2 border-t border-indigo-100 text-xs">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">
                        Coordinator Note:
                      </span>
                      <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 italic">
                        &quot;{activeItem.correctionNote}&quot;
                      </p>
                    </div>
                  )}

                  {activeItem.evidenceNote && (
                    <div className="text-xs">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">
                        Evidence / Drive Reference:
                      </span>
                      <span className="text-blue-700 font-mono break-all block bg-white p-2 rounded border border-slate-200">
                        {activeItem.evidenceNote}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Submissions History (if multiple) */}
              {relatedSubmissions.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                    Submission History for this Coordinator / Venue ({relatedSubmissions.length})
                  </span>
                  <div className="space-y-2">
                    {relatedSubmissions.map((rs) => (
                      <div
                        key={rs.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold">{rs.id}</span> — {rs.submissionType} ({new Date(rs.createdAt).toLocaleDateString("en-IN")})
                          {rs.correctionNote && (
                            <p className="text-[11px] text-slate-500 truncate max-w-md">
                              {rs.correctionNote}
                            </p>
                          )}
                        </div>
                        <div>{getStatusBadge(rs.submissionStatus)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Note Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Audit Note (Internal)
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter administrator notes, reasons for decision, or instructions for manual correction..."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Action Message Feedback */}
              {actionMessage && (
                <div
                  className={`text-xs p-3 rounded-xl border font-bold ${
                    actionMessage.startsWith("Error")
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {actionMessage}
                </div>
              )}

              {/* Admin Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  ⚠️ Note: Accept records the decision. It does NOT automatically mutate frozen census totals.
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus("ACCEPTED")}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    ✓ ACCEPT
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("NEEDS_CLARIFICATION")}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    ❓ NEEDS CLARIFICATION
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    ✕ REJECT
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("IMPLEMENTED")}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    ★ MARK IMPLEMENTED
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
