"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CoordinatorMappedCourseItem {
  canonicalVenueId: string;
  venueName: string;
  city: string;
  state: string;
  stateCode: string;
  reconciledTrained: number;
  baselineReportedTrained: number;
  participantsCertified: number;
  coursesCount: number;
  coordinators: string[];
  champions: string[];
  classification: string;
  statusBadge: "AWAITING_VERIFICATION" | "VERIFICATION_SUBMITTED" | "CORRECTION_SUBMITTED";
}

export default function StateCoordinatorVerificationPage({
  params,
}: {
  params?: Promise<{ state: string }>;
}) {
  const urlParams = useParams();
  const rawStateSlug = (urlParams?.state as string) || "";

  // State info
  const [stateName, setStateName] = useState<string>("");
  const [stateCode, setStateCode] = useState<string>("");
  const [coordinators, setCoordinators] = useState<string[]>([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState<string>("");
  const [courses, setCourses] = useState<CoordinatorMappedCourseItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [verifyModalCourse, setVerifyModalCourse] = useState<CoordinatorMappedCourseItem | null>(null);
  const [correctionModalCourse, setCorrectionModalCourse] = useState<CoordinatorMappedCourseItem | null>(null);
  const [showMissingModal, setShowMissingModal] = useState<boolean>(false);

  // Form states for Verify Correct
  const [verifyMobile, setVerifyMobile] = useState<string>("");
  const [verifyEmail, setVerifyEmail] = useState<string>("");
  const [verifyAgreed, setVerifyAgreed] = useState<boolean>(false);
  const [verifySubmitting, setVerifySubmitting] = useState<boolean>(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState<string | null>(null);
  const [verifyErrorMsg, setVerifyErrorMsg] = useState<string | null>(null);

  // Form states for Submit Correction
  const [corrFields, setCorrFields] = useState<{
    venueName: boolean;
    city: boolean;
    trainedCount: boolean;
    coordinators: boolean;
    champions: boolean;
    coursesCount: boolean;
    other: boolean;
  }>({
    venueName: false,
    city: false,
    trainedCount: false,
    coordinators: false,
    champions: false,
    coursesCount: false,
    other: false,
  });
  const [corrProposedVenue, setCorrProposedVenue] = useState<string>("");
  const [corrProposedCity, setCorrProposedCity] = useState<string>("");
  const [corrProposedTrained, setCorrProposedTrained] = useState<string>("");
  const [corrProposedCoords, setCorrProposedCoords] = useState<string>("");
  const [corrProposedChamps, setCorrProposedChamps] = useState<string>("");
  const [corrProposedSessions, setCorrProposedSessions] = useState<string>("");
  const [corrNote, setCorrNote] = useState<string>("");
  const [corrMobile, setCorrMobile] = useState<string>("");
  const [corrEmail, setCorrEmail] = useState<string>("");
  const [corrEvidenceNote, setCorrEvidenceNote] = useState<string>("");
  const [corrSubmitting, setCorrSubmitting] = useState<boolean>(false);
  const [corrSuccessMsg, setCorrSuccessMsg] = useState<string | null>(null);
  const [corrErrorMsg, setCorrErrorMsg] = useState<string | null>(null);

  // Form states for Missing Course
  const [missingCoordName, setMissingCoordName] = useState<string>("");
  const [missingMobile, setMissingMobile] = useState<string>("");
  const [missingEmail, setMissingEmail] = useState<string>("");
  const [missingVenue, setMissingVenue] = useState<string>("");
  const [missingCity, setMissingCity] = useState<string>("");
  const [missingDate, setMissingDate] = useState<string>("2026-07-21");
  const [missingTrained, setMissingTrained] = useState<string>("");
  const [missingOtherCoords, setMissingOtherCoords] = useState<string>("");
  const [missingChamps, setMissingChamps] = useState<string>("");
  const [missingComments, setMissingComments] = useState<string>("");
  const [missingEvidenceNote, setMissingEvidenceNote] = useState<string>("");
  const [missingSubmitting, setMissingSubmitting] = useState<boolean>(false);
  const [missingSuccessMsg, setMissingSuccessMsg] = useState<string | null>(null);
  const [missingErrorMsg, setMissingErrorMsg] = useState<string | null>(null);

  // 1. Load State & Coordinator List on Mount
  useEffect(() => {
    async function loadStateData() {
      setLoadingInitial(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/cprsanjeevani/verify?state=${encodeURIComponent(rawStateSlug)}`
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setStateName(data.state);
          setStateCode(data.stateCode);
          setCoordinators(data.coordinators || []);
        } else {
          setError(data.error || "Failed to load state verification details.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Network error while loading state data.");
      } finally {
        setLoadingInitial(false);
      }
    }

    if (rawStateSlug) {
      loadStateData();
    }
  }, [rawStateSlug]);

  // 2. Load Courses when Coordinator is selected
  const handleCoordinatorChange = async (coordName: string) => {
    setSelectedCoordinator(coordName);
    if (!coordName) {
      setCourses([]);
      return;
    }

    setLoadingCourses(true);
    try {
      const res = await fetch(
        `/api/cprsanjeevani/verify?state=${encodeURIComponent(
          stateName || rawStateSlug
        )}&coordinator=${encodeURIComponent(coordName)}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCourses(data.courses || []);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error("Error fetching coordinator courses:", err);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // 3. Open Verify Modal
  const openVerifyModal = (item: CoordinatorMappedCourseItem) => {
    setVerifyModalCourse(item);
    setVerifyAgreed(false);
    setVerifySuccessMsg(null);
    setVerifyErrorMsg(null);
  };

  // 4. Submit Verify Correct
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalCourse || !verifyAgreed) return;

    if (!verifyMobile || verifyMobile.replace(/\D/g, "").length < 10) {
      setVerifyErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setVerifySubmitting(true);
    setVerifyErrorMsg(null);

    try {
      const res = await fetch("/api/cprsanjeevani/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: stateName,
          submissionType: "VERIFY_CORRECT",
          canonicalVenueId: verifyModalCourse.canonicalVenueId,
          venue: verifyModalCourse.venueName,
          city: verifyModalCourse.city,
          mappedCoordinatorName: selectedCoordinator,
          submittedByName: selectedCoordinator,
          submittedByMobile: verifyMobile,
          submittedByEmail: verifyEmail || undefined,
          currentDataJson: {
            venue: verifyModalCourse.venueName,
            city: verifyModalCourse.city,
            state: stateName,
            participantsTrained: verifyModalCourse.reconciledTrained,
            coordinators: verifyModalCourse.coordinators,
            champions: verifyModalCourse.champions,
            coursesCount: verifyModalCourse.coursesCount,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifySuccessMsg(data.message || "Course verified successfully!");
        // Refresh courses list
        setTimeout(() => {
          handleCoordinatorChange(selectedCoordinator);
        }, 1500);
      } else {
        setVerifyErrorMsg(data.error || "Failed to submit verification.");
      }
    } catch (err) {
      console.error(err);
      setVerifyErrorMsg("Network error submitting verification.");
    } finally {
      setVerifySubmitting(false);
    }
  };

  // 5. Open Correction Modal
  const openCorrectionModal = (item: CoordinatorMappedCourseItem) => {
    setCorrectionModalCourse(item);
    setCorrFields({
      venueName: false,
      city: false,
      trainedCount: false,
      coordinators: false,
      champions: false,
      coursesCount: false,
      other: false,
    });
    setCorrProposedVenue(item.venueName);
    setCorrProposedCity(item.city);
    setCorrProposedTrained(String(item.reconciledTrained));
    setCorrProposedCoords(item.coordinators.join(", "));
    setCorrProposedChamps(item.champions.join(", "));
    setCorrProposedSessions(String(item.coursesCount));
    setCorrNote("");
    setCorrEvidenceNote("");
    setCorrSuccessMsg(null);
    setCorrErrorMsg(null);
  };

  // 6. Submit Correction
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionModalCourse) return;

    if (!corrMobile || corrMobile.replace(/\D/g, "").length < 10) {
      setCorrErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    const modifiedFields = Object.entries(corrFields)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (modifiedFields.length === 0 && !corrNote.trim()) {
      setCorrErrorMsg("Please select at least one field to correct or enter a correction note.");
      return;
    }

    setCorrSubmitting(true);
    setCorrErrorMsg(null);

    try {
      const res = await fetch("/api/cprsanjeevani/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: stateName,
          submissionType: "SUBMIT_CORRECTION",
          canonicalVenueId: correctionModalCourse.canonicalVenueId,
          venue: correctionModalCourse.venueName,
          city: correctionModalCourse.city,
          mappedCoordinatorName: selectedCoordinator,
          submittedByName: selectedCoordinator,
          submittedByMobile: corrMobile,
          submittedByEmail: corrEmail || undefined,
          currentDataJson: {
            venue: correctionModalCourse.venueName,
            city: correctionModalCourse.city,
            state: stateName,
            participantsTrained: correctionModalCourse.reconciledTrained,
            coordinators: correctionModalCourse.coordinators,
            champions: correctionModalCourse.champions,
            coursesCount: correctionModalCourse.coursesCount,
          },
          proposedChangesJson: {
            venue: corrFields.venueName ? corrProposedVenue : undefined,
            city: corrFields.city ? corrProposedCity : undefined,
            participantsTrained: corrFields.trainedCount ? parseInt(corrProposedTrained, 10) || undefined : undefined,
            coordinators: corrFields.coordinators
              ? corrProposedCoords.split(",").map((s) => s.trim()).filter(Boolean)
              : undefined,
            champions: corrFields.champions
              ? corrProposedChamps.split(",").map((s) => s.trim()).filter(Boolean)
              : undefined,
            coursesCount: corrFields.coursesCount ? parseInt(corrProposedSessions, 10) || undefined : undefined,
            fieldsModified: modifiedFields,
          },
          correctionNote: corrNote,
          evidenceNote: corrEvidenceNote || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCorrSuccessMsg(data.message || "Correction submitted for Admin Review!");
        setTimeout(() => {
          handleCoordinatorChange(selectedCoordinator);
        }, 1500);
      } else {
        setCorrErrorMsg(data.error || "Failed to submit correction.");
      }
    } catch (err) {
      console.error(err);
      setCorrErrorMsg("Network error submitting correction.");
    } finally {
      setCorrSubmitting(false);
    }
  };

  // 7. Submit Missing Course
  const handleMissingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missingVenue.trim() || !missingCity.trim()) {
      setMissingErrorMsg("Venue Name and City are required.");
      return;
    }

    const coordName = missingCoordName.trim() || selectedCoordinator;
    if (!coordName) {
      setMissingErrorMsg("Coordinator name is required.");
      return;
    }

    if (!missingMobile || missingMobile.replace(/\D/g, "").length < 10) {
      setMissingErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setMissingSubmitting(true);
    setMissingErrorMsg(null);

    try {
      const res = await fetch("/api/cprsanjeevani/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: stateName,
          submissionType: "MISSING_COURSE",
          venue: missingVenue.trim(),
          city: missingCity.trim(),
          mappedCoordinatorName: coordName,
          submittedByName: coordName,
          submittedByMobile: missingMobile,
          submittedByEmail: missingEmail || undefined,
          proposedChangesJson: {
            venue: missingVenue.trim(),
            city: missingCity.trim(),
            courseDate: missingDate,
            participantsTrained: parseInt(missingTrained, 10) || 0,
            coordinators: missingOtherCoords
              ? [coordName, ...missingOtherCoords.split(",").map((s) => s.trim()).filter(Boolean)]
              : [coordName],
            champions: missingChamps ? missingChamps.split(",").map((s) => s.trim()).filter(Boolean) : [],
          },
          correctionNote: missingComments,
          evidenceNote: missingEvidenceNote || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMissingSuccessMsg(data.message || "Missing course reported successfully!");
        setMissingVenue("");
        setMissingCity("");
        setMissingTrained("");
        setMissingOtherCoords("");
        setMissingChamps("");
        setMissingComments("");
        setMissingEvidenceNote("");
      } else {
        setMissingErrorMsg(data.error || "Failed to submit missing course.");
      }
    } catch (err) {
      console.error(err);
      setMissingErrorMsg("Network error submitting missing course.");
    } finally {
      setMissingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Top Header Banner */}
      <header className="bg-gradient-to-r from-teal-900 via-teal-800 to-indigo-950 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🫀</span>
                <span className="text-xs font-black uppercase tracking-widest text-teal-300">
                  CPR DAY 2026 CENSUS VERIFICATION
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                {stateName ? stateName.toUpperCase() : "STATE VERIFICATION"}
                <span className="inline-block text-xs uppercase px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold tracking-wider">
                  DRAFT — FOR STATE VERIFICATION
                </span>
              </h1>
            </div>

            <button
              onClick={() => {
                setMissingCoordName(selectedCoordinator || "");
                setShowMissingModal(true);
                setMissingSuccessMsg(null);
                setMissingErrorMsg(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>➕</span> Report Missing Course
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Instruction Alert */}
        <div className="bg-white border-l-4 border-teal-600 rounded-r-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Course Coordinator Verification Portal
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Course Coordinators are requested to verify the course(s) mapped to them.
                Please select your name below to view and review your course and venue records.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Coordinator Selector Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            1. Select Your Name (Course Coordinator)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <select
                value={selectedCoordinator}
                onChange={(e) => handleCoordinatorChange(e.target.value)}
                disabled={loadingInitial}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 cursor-pointer"
              >
                <option value="">-- Choose your name from list ({coordinators.length} Coordinators) --</option>
                {coordinators.map((c, idx) => (
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {selectedCoordinator && (
              <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span>
                  Showing courses mapped to: <strong>{selectedCoordinator}</strong>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Mapped Courses Section */}
        {selectedCoordinator && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                2. Mapped Courses &amp; Venues ({courses.length})
              </h3>
              {loadingCourses && (
                <span className="text-xs text-teal-600 animate-pulse font-medium">
                  Loading courses...
                </span>
              )}
            </div>

            {courses.length === 0 && !loadingCourses ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                <p className="text-base font-semibold">No pre-mapped course found under this coordinator name.</p>
                <p className="text-xs text-slate-400 mt-1">
                  If you conducted a course that is not appearing here, please use the &quot;Report Missing Course&quot; button above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {courses.map((item, idx) => {
                  const badgeClass =
                    item.statusBadge === "VERIFICATION_SUBMITTED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : item.statusBadge === "CORRECTION_SUBMITTED"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-300";

                  const badgeLabel =
                    item.statusBadge === "VERIFICATION_SUBMITTED"
                      ? "✓ Verification Submitted (Under Review)"
                      : item.statusBadge === "CORRECTION_SUBMITTED"
                      ? "✎ Correction Submitted (Under Review)"
                      : "Awaiting Verification";

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold border ${badgeClass}`}
                          >
                            {badgeLabel}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {item.canonicalVenueId}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-black text-slate-900 leading-snug">
                            {item.venueName}
                          </h4>
                          <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mt-0.5">
                            📍 {item.city}, {item.state}
                          </p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                          <div className="bg-slate-50 p-2.5 rounded-xl">
                            <span className="block text-[11px] font-bold text-slate-400 uppercase">
                              Trained (Draft V1)
                            </span>
                            <span className="text-base font-black text-slate-900">
                              {item.reconciledTrained.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl">
                            <span className="block text-[11px] font-bold text-slate-400 uppercase">
                              Certified Records
                            </span>
                            <span className="text-base font-black text-teal-700">
                              {item.participantsCertified.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                            <span className="block text-[11px] font-bold text-slate-400 uppercase">
                              Sessions / Courses
                            </span>
                            <span className="text-base font-black text-slate-900">
                              {item.coursesCount}
                            </span>
                          </div>
                        </div>

                        {/* People */}
                        <div className="text-xs space-y-1 pt-1 text-slate-600">
                          <div>
                            <span className="font-bold text-slate-700">Course Coordinators: </span>
                            <span>{item.coordinators.join(", ") || "—"}</span>
                          </div>
                          {item.champions.length > 0 && (
                            <div>
                              <span className="font-bold text-slate-700">CPR Champions: </span>
                              <span>{item.champions.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => openVerifyModal(item)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <span>✓</span> VERIFY CORRECT
                        </button>
                        <button
                          onClick={() => openCorrectionModal(item)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <span>✎</span> SUBMIT CORRECTION
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* 1. MODAL: VERIFY CORRECT                             */}
      {/* ---------------------------------------------------- */}
      {verifyModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Confirm Course As Correct
              </h3>
              <button
                onClick={() => setVerifyModalCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4 mt-4">
              {/* Summary of Venue */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800 text-sm">
                  {verifyModalCourse.venueName}
                </p>
                <p className="text-slate-600">
                  📍 {verifyModalCourse.city}, {verifyModalCourse.state}
                </p>
                <p className="text-slate-600">
                  Participants Trained: <strong>{verifyModalCourse.reconciledTrained.toLocaleString()}</strong>
                </p>
              </div>

              {/* Submitter Info */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coordinator Name
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedCoordinator}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number (e.g. 9876543210)"
                  value={verifyMobile}
                  onChange={(e) => setVerifyMobile(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Used by administrators to authenticate coordinator submissions.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="coordinator@example.com"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Checkbox Declaration */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifyAgreed}
                    onChange={(e) => setVerifyAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span>
                    I have reviewed this course/venue information and confirm that it is correct to the best of my knowledge.
                  </span>
                </label>
              </div>

              {verifyErrorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                  {verifyErrorMsg}
                </div>
              )}

              {verifySuccessMsg && (
                <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 font-bold">
                  {verifySuccessMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalCourse(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifySubmitting || !verifyAgreed}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {verifySubmitting ? "Submitting..." : "CONFIRM AS CORRECT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. MODAL: SUBMIT CORRECTION                          */}
      {/* ---------------------------------------------------- */}
      {correctionModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="text-indigo-600">✎</span> Submit Course Correction
              </h3>
              <button
                onClick={() => setCorrectionModalCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 mt-4">
              {/* Current Data Overview */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="block font-black uppercase tracking-wider text-slate-400 text-[10px]">
                  Current Website Data
                </span>
                <p className="font-bold text-slate-800 text-sm">
                  {correctionModalCourse.venueName}
                </p>
                <p className="text-slate-600">
                  📍 {correctionModalCourse.city}, {correctionModalCourse.state}
                </p>
                <p className="text-slate-600">
                  Reported Trained: <strong>{correctionModalCourse.reconciledTrained.toLocaleString()}</strong> | Coordinators: {correctionModalCourse.coordinators.join(", ") || "—"}
                </p>
              </div>

              {/* What needs correction? Checkboxes */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  What needs correction?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: "venueName", label: "Venue Name" },
                    { key: "city", label: "City" },
                    { key: "trainedCount", label: "Participants Trained" },
                    { key: "coordinators", label: "Coordinators" },
                    { key: "champions", label: "CPR Champions" },
                    { key: "coursesCount", label: "Sessions Count" },
                    { key: "other", label: "Other / General" },
                  ].map((f) => (
                    <label
                      key={f.key}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={(corrFields as any)[f.key]}
                        onChange={(e) =>
                          setCorrFields({
                            ...corrFields,
                            [f.key]: e.target.checked,
                          })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="font-medium text-slate-700">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic Inputs */}
              {corrFields.venueName && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corrected Venue Name
                  </label>
                  <input
                    type="text"
                    value={corrProposedVenue}
                    onChange={(e) => setCorrProposedVenue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {corrFields.city && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corrected City
                  </label>
                  <input
                    type="text"
                    value={corrProposedCity}
                    onChange={(e) => setCorrProposedCity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {corrFields.trainedCount && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corrected Participants Trained
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={corrProposedTrained}
                    onChange={(e) => setCorrProposedTrained(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {corrFields.coordinators && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corrected Course Coordinators (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={corrProposedCoords}
                    onChange={(e) => setCorrProposedCoords(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {corrFields.champions && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corrected CPR Champions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={corrProposedChamps}
                    onChange={(e) => setCorrProposedChamps(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {corrFields.coursesCount && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corrected Session / Course Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={corrProposedSessions}
                    onChange={(e) => setCorrProposedSessions(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correction Details / Explanatory Note
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the discrepancy and requested correction in detail..."
                  value={corrNote}
                  onChange={(e) => setCorrNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submitter Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={corrMobile}
                    onChange={(e) => setCorrMobile(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="coordinator@example.com"
                    value={corrEmail}
                    onChange={(e) => setCorrEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supporting Reference / Drive Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Link to attendance sheet, photos, or verification letter"
                  value={corrEvidenceNote}
                  onChange={(e) => setCorrEvidenceNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {corrErrorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                  {corrErrorMsg}
                </div>
              )}

              {corrSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 font-bold">
                  {corrSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectionModalCourse(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={corrSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {corrSubmitting ? "Submitting..." : "SUBMIT CORRECTION"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MODAL: REPORT MISSING COURSE                      */}
      {/* ---------------------------------------------------- */}
      {showMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>➕</span> Report Missing Course / Venue
              </h3>
              <button
                onClick={() => setShowMissingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMissingSubmit} className="space-y-4 mt-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                Please provide details for the unlisted CPR Day 2026 course conducted in <strong>{stateName || "this state"}</strong>. All submissions go to Admin Review.
              </div>

              {/* Submitter Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coordinator Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={missingCoordName}
                    onChange={(e) => setMissingCoordName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={missingMobile}
                    onChange={(e) => setMissingMobile(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Venue & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Venue / Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Government Medical College Hospital"
                    value={missingVenue}
                    onChange={(e) => setMissingVenue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={missingCity}
                    onChange={(e) => setMissingCity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Date & Trained */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Date
                  </label>
                  <input
                    type="text"
                    value={missingDate}
                    onChange={(e) => setMissingDate(e.target.value)}
                    placeholder="2026-07-21"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Participants Trained
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150"
                    value={missingTrained}
                    onChange={(e) => setMissingTrained(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Other Coordinators & Champions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Other Course Coordinators (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A. Sharma, Dr. B. Patel"
                  value={missingOtherCoords}
                  onChange={(e) => setMissingOtherCoords(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CPR Champions / Instructors (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. X, Dr. Y"
                  value={missingChamps}
                  onChange={(e) => setMissingChamps(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comments / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional details about the course, participants, or reasons for omission..."
                  value={missingComments}
                  onChange={(e) => setMissingComments(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supporting Drive Link / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Google Drive link or reference note"
                  value={missingEvidenceNote}
                  onChange={(e) => setMissingEvidenceNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {missingErrorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                  {missingErrorMsg}
                </div>
              )}

              {missingSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 font-bold">
                  {missingSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMissingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={missingSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {missingSubmitting ? "Submitting..." : "SUBMIT MISSING COURSE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
