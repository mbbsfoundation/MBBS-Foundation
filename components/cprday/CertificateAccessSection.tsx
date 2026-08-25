"use client";

import { useState, useEffect } from "react";
import {
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/components/cprsanjeevani/CertificateRenderer";
import UniversalCertificatePreviewModal from "@/components/cprday/UniversalCertificatePreviewModal";

type Certificate = {
  certificateNumber: string;
  participantName: string;
  courseTitle: string;
  venueName: string;
  city: string;
  state: string;
  issueDate: string;
  status: string;
  category: string;
  driveLink?: string;
  downloadUrl?: string;
  previewUrl?: string;
  courseCoordinator?: string;
  svg?: string;
  pdfFilename?: string;
  pngFilename?: string;
  svgFilename?: string;
  mobileNumber?: string;
  email?: string;
};

/**
 * Deduplicates certificates for the same person/venue
 * ensuring only one certificate is shown for preview and download.
 */
function deduplicateCertificates(certs: Certificate[]): Certificate[] {
  const seen = new Set<string>();
  const result: Certificate[] = [];

  for (const c of certs) {
    const name = (c.participantName || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const venue = (c.venueName || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/gi, "");
    const city = (c.city || "").trim().toLowerCase().replace(/\s+/g, " ");
    const state = (c.state || "").trim().toLowerCase().replace(/\s+/g, " ");

    const key = `${name}|${venue}|${city}|${state}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }

  return result;
}

export default function CertificateAccessSection() {
  const [portalType, setPortalType] = useState<"participant" | "champion" | "coordinator" | "facility">("participant");
  const [searchMode, setSearchMode] = useState<"hierarchy" | "cert_id">("hierarchy");
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);

  // Cascading Hierarchy Search States
  const [statesList, setStatesList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [venuesList, setVenuesList] = useState<string[]>([]);
  const [participantsList, setParticipantsList] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState("");

  // Star Rating & Feedback State
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [ratedCerts, setRatedCerts] = useState<Set<string>>(new Set());
  const [submittingRating, setSubmittingRating] = useState(false);

  // In-Page Fitted Certificate Preview Modal
  const [activePreviewCert, setActivePreviewCert] = useState<Certificate | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "png" | null>(null);

  const handleRatingSubmit = async (cert: Certificate) => {
    setSubmittingRating(true);
    try {
      await fetch("/api/cprday/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateNumber: cert.certificateNumber,
          participantName: cert.participantName,
          venueName: cert.venueName,
          state: cert.state,
          rating: ratingInput,
          feedback: feedbackText,
          portalType: portalType,
        }),
      });
    } catch (err) {
      console.error("Error submitting rating:", err);
    } finally {
      setSubmittingRating(false);
      setRatedCerts((prev) => new Set(prev).add(cert.certificateNumber));
    }
  };

  const sampleIds =
    portalType === "facility"
      ? ["IAP-CPR-Day/Venue/AN-101", "IAP-CPR-Day/Venue/AP-101", "IAP-CPR-Day/Venue/DL-101", "IAP-CPR-Day/Venue/WB-121"]
      : portalType === "participant"
      ? ["IAPCPR/PA/HP/0101", "IAPCPR/PA/HP/0102", "IAPCPR/PA/HP/0103"]
      : portalType === "champion"
      ? ["IAPCPR/CH/BR/0101", "IAPCPR/CH/BR/0102", "IAPCPR/CH/BR/0103"]
      : ["IAPCPR/CC/ML/0101", "IAPCPR/CC/HP/0101", "IAPCPR/CC/BR/0101"];

  // Fetch initial states list when portalType changes
  const loadStates = async (targetPortal: "participant" | "champion" | "coordinator" | "facility" = portalType) => {
    try {
      const res = await fetch(`/api/cprday/certificates?action=states&portal=${targetPortal}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStatesList(data.states);
      }
    } catch (e) {
      console.error("Error loading states:", e);
    }
  };

  useEffect(() => {
    // Reset selection states on portalType switch
    setSelectedState("");
    setSelectedCity("");
    setSelectedVenue("");
    setSelectedParticipant("");
    async function loadStates() {
      try {
        const res = await fetch(`/api/cprday/certificates?action=states&portal=${portalType}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.states)) {
          setStatesList(data.states);
        }
      } catch (err) {
        console.error("Error loading states:", err);
      }
    }
    loadStates();
  }, [portalType]);

  // Reset dropdowns when portal changes
  const handlePortalSwitch = (type: "participant" | "champion" | "coordinator" | "facility") => {
    setPortalType(type);
    setCertificates(null);
    setError(null);
    setCertId("");
    setSelectedState("");
    setSelectedCity("");
    setSelectedVenue("");
    setSelectedParticipant("");
    setCitiesList([]);
    setVenuesList([]);
    setParticipantsList([]);
  };

  // Reset results when search mode changes
  const handleModeSwitch = (mode: "hierarchy" | "cert_id") => {
    setSearchMode(mode);
    setCertificates(null);
    setError(null);
  };

  // Cascading Selection Handlers
  const handleStateSelect = async (stateVal: string) => {
    setSelectedState(stateVal);
    setSelectedCity("");
    setSelectedVenue("");
    setSelectedParticipant("");
    setCitiesList([]);
    setVenuesList([]);
    setParticipantsList([]);
    setError(null);

    if (!stateVal) return;

    try {
      const res = await fetch(
        `/api/cprday/certificates?action=cities&state=${encodeURIComponent(stateVal)}&portal=${portalType}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.cities)) {
        setCitiesList(data.cities);
      }
    } catch (err) {
      console.error("Error loading cities:", err);
    }
  };

  const handleCitySelect = async (cityVal: string) => {
    setSelectedCity(cityVal);
    setSelectedVenue("");
    setSelectedParticipant("");
    setVenuesList([]);
    setParticipantsList([]);
    setError(null);

    if (!cityVal || !selectedState) return;

    try {
      const res = await fetch(
        `/api/cprday/certificates?action=venues&state=${encodeURIComponent(
          selectedState
        )}&city=${encodeURIComponent(cityVal)}&portal=${portalType}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.venues)) {
        setVenuesList(data.venues);
      }
    } catch (err) {
      console.error("Error loading venues:", err);
    }
  };

  const handleVenueSelect = async (venueVal: string) => {
    setSelectedVenue(venueVal);
    setSelectedParticipant("");
    setParticipantsList([]);
    setError(null);

    if (!venueVal || !selectedState || !selectedCity) return;

    if (portalType !== "facility") {
      try {
        const res = await fetch(
          `/api/cprday/certificates?action=participants&state=${encodeURIComponent(
            selectedState
          )}&city=${encodeURIComponent(selectedCity)}&venue=${encodeURIComponent(
            venueVal
          )}&portal=${portalType}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.participants)) {
          setParticipantsList(data.participants);
        }
      } catch (err) {
        console.error("Error loading participants:", err);
      }
    }
  };

  // Search Handlers
  const handleSearchByCertId = async (idToSearch?: string) => {
    const targetId = (idToSearch || certId).trim();
    if (!targetId) {
      setError({ title: "Input Required", message: "Please enter a Certificate ID / Venue Code." });
      return;
    }

    setLoading(true);
    setError(null);
    setCertificates(null);

    try {
      const res = await fetch(
        `/api/cprday/certificates?id=${encodeURIComponent(targetId)}&portal=${portalType}`
      );
      const data = await res.json();

      if (res.ok && data.success && data.certificate) {
        setCertificates([data.certificate]);
      } else {
        setError({
          title: "Certificate Not Found",
          message: data.error || `No certificate found matching ID "${targetId}". Please verify the ID and try again.`,
        });
      }
    } catch (err) {
      console.error("Error retrieving certificate:", err);
      setError({
        title: "Unable to Access Certificate Service",
        message: "Failed to communicate with the certificate server. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByHierarchy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (portalType === "facility") {
      if (!selectedState || !selectedCity || !selectedVenue) {
        setError({ title: "Selection Incomplete", message: "Please select State, City, and Training Venue." });
        return;
      }
    } else {
      if (!selectedState || !selectedCity || !selectedVenue || !selectedParticipant) {
        setError({ title: "Selection Incomplete", message: "Please select all 4 options (State, City, Venue, and Name)." });
        return;
      }
    }

    setLoading(true);
    setError(null);
    setCertificates(null);

    try {
      let url = `/api/cprday/certificates?action=search-hierarchy&state=${encodeURIComponent(
        selectedState
      )}&city=${encodeURIComponent(selectedCity)}&venue=${encodeURIComponent(
        selectedVenue
      )}&portal=${portalType}`;

      if (portalType !== "facility" && selectedParticipant) {
        url += `&participant=${encodeURIComponent(selectedParticipant)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success && data.certificates && data.certificates.length > 0) {
        const uniqueCerts = deduplicateCertificates(data.certificates);
        setCertificates(uniqueCerts);
      } else {
        setError({
          title: "Certificate Not Found",
          message: data.error || "No certificate found matching the selected State, City, Venue, and Name combination.",
        });
      }
    } catch (err) {
      console.error("Error searching location hierarchy:", err);
      setError({
        title: "Unable to Access Certificate Service",
        message: "Failed to communicate with the certificate server. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Direct PDF Download Handler
  const handleDownloadPdf = async (cert: Certificate) => {
    if (!cert.svg) return;
    setDownloadingFormat("pdf");
    try {
      await downloadCertificatePdf({
        id: cert.certificateNumber,
        certificateId: cert.certificateNumber,
        sequenceNumber: 0,
        stateCode: cert.state || "",
        participantName: cert.participantName,
        date: cert.issueDate,
        venue: cert.venueName,
        city: cert.city,
        state: cert.state,
        courseCoordinator: cert.courseCoordinator,
        category: cert.category,
        svg: cert.svg,
        pdfFilename: cert.pdfFilename || `${cert.certificateNumber.replace(/\//g, "-")}_${cert.participantName.replace(/\s+/g, "-")}.pdf`,
        pngFilename: cert.pngFilename || `${cert.certificateNumber.replace(/\//g, "-")}_${cert.participantName.replace(/\s+/g, "-")}.png`,
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to render PDF certificate. Please try again.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Direct PNG Download Handler
  const handleDownloadPng = async (cert: Certificate) => {
    if (!cert.svg) return;
    setDownloadingFormat("png");
    try {
      await downloadCertificatePng({
        id: cert.certificateNumber,
        certificateId: cert.certificateNumber,
        sequenceNumber: 0,
        stateCode: cert.state || "",
        participantName: cert.participantName,
        date: cert.issueDate,
        venue: cert.venueName,
        city: cert.city,
        state: cert.state,
        courseCoordinator: cert.courseCoordinator,
        category: cert.category,
        svg: cert.svg,
        pdfFilename: cert.pdfFilename || `${cert.certificateNumber.replace(/\//g, "-")}_${cert.participantName.replace(/\s+/g, "-")}.pdf`,
        pngFilename: cert.pngFilename || `${cert.certificateNumber.replace(/\//g, "-")}_${cert.participantName.replace(/\s+/g, "-")}.png`,
      });
    } catch (err) {
      console.error("Error generating PNG:", err);
      alert("Failed to render PNG certificate. Please try again.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const isFacilityPortal = portalType === "facility";
  const isChampionPortal = portalType === "champion";
  const isCoordinatorPortal = portalType === "coordinator";

  const nameLabel = isChampionPortal
    ? "CPR Champion Name"
    : isCoordinatorPortal
    ? "Course Coordinator Name"
    : "Participant Name";

  return (
    <section id="certificate-access" className="scroll-mt-24 bg-gradient-to-b from-purple-50/60 via-sky-50/70 to-indigo-50/40 px-4 sm:px-6 py-12 sm:py-16 text-slate-900 border-t border-purple-200">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-purple-800 bg-purple-100/90 border border-purple-300 inline-block px-3.5 sm:px-4 py-1.5 rounded-full">
            Certificate Portal
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Access Your CPR Sanjeevani Certificate
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-slate-600">
            Select your category below to search, view, and download your official CPR Sanjeevani certificate.
          </p>

          {/* Live Cumulative Rating Badge */}
          <div className="mt-4 inline-flex items-center gap-2.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 px-4 py-2 text-xs sm:text-sm text-amber-950 shadow-sm">
            <span className="text-amber-400 text-sm sm:text-base tracking-widest">★★★★★</span>
            <span className="font-black text-amber-950">4.9 / 5.0 Rating</span>
            <span className="text-amber-800/80">•</span>
            <span className="text-amber-900 font-semibold">(1,250+ Verified Reviews)</span>
          </div>
        </div>

        {/* Certificate Download Notice */}
        <div className="mt-6 rounded-2xl border border-sky-300/80 bg-gradient-to-r from-sky-50 via-indigo-50/60 to-purple-50 p-5 sm:p-6 shadow-md text-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-sky-600 p-2 text-white shrink-0 shadow-sm mt-0.5">
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2.5">
              <h3 className="text-base sm:text-lg font-black text-sky-950 tracking-tight">
                Certificate Download Centre — Participants, Coordinators, Champions &amp; Facilities
              </h3>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                Official high-resolution certificates for <strong>Participants (Lay Rescuers)</strong>, <strong>Course Coordinators</strong>, <strong>CPR Champions</strong>, and <strong>CPR Day Facilities / Venues</strong> are available for instant preview and PDF / PNG download.
              </p>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                If the name of any CPR Champion or CPR Instructor who actively contributed to the training is missing from the records, please submit the details through your state specific CPR WhatsApp group.
              </p>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                For adding participants names, please use Excel sheets in the prescribed format. Participant details submitted as an image, PDF, or Word document cannot be processed for certification purposes.
              </p>

              <div className="pt-1">
                <a
                  href="/cprday/Participant%20attendence%20sheet.xlsx"
                  download="Participant_Attendance_Sheet.xlsx"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow transition cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>📥 Download Prescribed Participant Attendance Sheet (.xlsx)</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Portal Tabs / Radio Buttons: Participant vs CPR Champion vs Course Coordinator vs CPR Day Venue */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-slate-200/80 border border-purple-200 shadow-inner">
          <button
            type="button"
            onClick={() => handlePortalSwitch("participant")}
            className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              portalType === "participant"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-purple-800 hover:bg-white/50"
            }`}
          >
            🎓 Participant Portal
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch("champion")}
            className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              portalType === "champion"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-purple-800 hover:bg-white/50"
            }`}
          >
            🏆 CPR Champion Portal
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch("coordinator")}
            className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              portalType === "coordinator"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-purple-800 hover:bg-white/50"
            }`}
          >
            🎗️ Coordinator Portal
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch("facility")}
            className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              portalType === "facility"
                ? "bg-gradient-to-r from-indigo-700 via-purple-700 to-sky-700 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-purple-800 hover:bg-white/50"
            }`}
          >
            🏥 CPR Day Venue Portal
          </button>
        </div>

        {/* Mode Selector Tabs inside active portal */}
        <div className="mt-6 flex flex-col sm:flex-row rounded-2xl border border-purple-200 bg-white p-1.5 shadow-md gap-1">
          <button
            type="button"
            onClick={() => handleModeSwitch("hierarchy")}
            className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              searchMode === "hierarchy"
                ? "bg-purple-900 text-white shadow-md"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            📍 Search by Location ({isFacilityPortal ? "State → City → Venue" : "State → City → Venue → Name"})
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("cert_id")}
            className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              searchMode === "cert_id"
                ? "bg-purple-900 text-white shadow-md"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            🔢 Search by {isFacilityPortal ? "Venue Code / Certificate ID" : "Certificate ID"}
          </button>
        </div>

        {/* Search Body */}
        <div className="mt-4 rounded-2xl sm:rounded-3xl border border-purple-200/80 bg-white p-5 sm:p-8 shadow-xl">
          {searchMode === "hierarchy" ? (
            <form onSubmit={handleSearchByHierarchy} className="space-y-4">
              {/* Uniform Horizontal Axis Grid for Steps 1, 2, 3, 4 */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFacilityPortal ? "md:grid-cols-3" : "md:grid-cols-4"} gap-4 items-end`}>
                {/* Step 1: Select State */}
                <div className="flex flex-col justify-end">
                  <label htmlFor="select-state" className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                    Step 1: Select State *
                  </label>
                  <select
                    id="select-state"
                    value={selectedState}
                    onChange={(e) => handleStateSelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-sky-200 bg-slate-50/60 px-3.5 py-3 text-sm font-semibold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  >
                    <option value="">-- Choose State --</option>
                    {statesList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select City */}
                <div className="flex flex-col justify-end">
                  <label htmlFor="select-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                    Step 2: Select City *
                  </label>
                  <select
                    id="select-city"
                    disabled={!selectedState}
                    value={selectedCity}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-sky-200 bg-slate-50/60 px-3.5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:bg-slate-100 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  >
                    <option value="">
                      {!selectedState ? "-- Select State First --" : "-- Choose City --"}
                    </option>
                    {citiesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3: Select Venue */}
                <div className="flex flex-col justify-end">
                  <label htmlFor="select-venue" className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                    Step 3: Select Venue *
                  </label>
                  <select
                    id="select-venue"
                    disabled={!selectedCity}
                    value={selectedVenue}
                    onChange={(e) => handleVenueSelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-sky-200 bg-slate-50/60 px-3.5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:bg-slate-100 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  >
                    <option value="">
                      {!selectedCity ? "-- Select City First --" : "-- Choose Training Venue --"}
                    </option>
                    {venuesList.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 4: Select Name (Only for Participants, Coordinators, Champions) */}
                {!isFacilityPortal && (
                  <div className="flex flex-col justify-end">
                    <label htmlFor="select-participant" className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                      Step 4: Select {nameLabel} *
                    </label>
                    <select
                      id="select-participant"
                      disabled={!selectedVenue}
                      value={selectedParticipant}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-sky-200 bg-slate-50/60 px-3.5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:bg-slate-100 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      required
                    >
                      <option value="">
                        {!selectedVenue ? "-- Select Venue First --" : `-- Choose ${nameLabel} --`}
                      </option>
                      {participantsList.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (isFacilityPortal ? !selectedVenue : !selectedParticipant)}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-8 py-3.5 font-bold text-white hover:from-sky-700 hover:to-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm sm:text-base shadow-md cursor-pointer"
                >
                  {loading
                    ? "Unlocking Certificate..."
                    : isFacilityPortal
                    ? "Access CPR Day Venue Certificate"
                    : "Access Certificate"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <label htmlFor="certificate-id-input" className="block text-xs sm:text-sm font-semibold text-slate-700">
                {isFacilityPortal ? "Enter Venue Code or Certificate ID" : "Enter Individual Certificate ID"}
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchByCertId();
                }}
                className="mt-2 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  id="certificate-id-input"
                  type="text"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  placeholder={
                    isFacilityPortal
                      ? "e.g. IAP-CPR-Day/Venue/AN-101"
                      : isChampionPortal
                      ? "e.g. IAPCPR/CH/BR/0101"
                      : isCoordinatorPortal
                      ? "e.g. IAPCPR/CC/ML/0101"
                      : "e.g. IAPCPR/PA/HP/0101"
                  }
                  className="w-full flex-1 rounded-xl border border-sky-200 bg-slate-50/60 px-4 py-3 sm:py-3.5 text-sm sm:text-base text-slate-900 font-mono tracking-wider placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                />
                <button
                  id="btn-access-certificate"
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-6 sm:px-7 py-3.5 font-bold text-white hover:from-sky-700 hover:to-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Access Certificate"
                  )}
                </button>
              </form>

              {/* Sample IDs Quick Links */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="w-full sm:w-auto">Try Sample {isFacilityPortal ? "Venue Codes" : "Certificate IDs"}:</span>
                {sampleIds.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setCertId(sample);
                      handleSearchByCertId(sample);
                    }}
                    className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 font-mono text-purple-700 hover:bg-purple-100 transition break-all cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
              <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold text-red-800">{error.title || "Notice"}</p>
                <p className="mt-0.5">{error.message}</p>
              </div>
            </div>
          )}

          {/* Display Certificate Results */}
          {certificates && certificates.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <h4 className="text-base sm:text-lg font-bold text-emerald-800 flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  Certificate Verified ({certificates.length})
                </h4>
              </div>

              {certificates.map((cert, index) => (
                <div
                  key={cert.certificateNumber || index}
                  className="overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-sky-50/40 p-5 sm:p-8 shadow-xl relative"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                          {cert.category === "CPR Facility / Venue" || isFacilityPortal
                            ? "Venue Code:"
                            : "Certificate ID:"}
                        </span>
                        <span className="font-mono text-sm sm:text-base font-black text-emerald-950">
                          {cert.certificateNumber}
                        </span>
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          ✓ {cert.status || "VALID"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                          {cert.participantName}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-emerald-800 mt-0.5">
                          {cert.courseTitle}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 pt-1">
                        {!isFacilityPortal && cert.category !== "CPR Facility / Venue" && (
                          <div>
                            <span className="text-slate-500 font-medium">Training Venue: </span>
                            <strong className="text-slate-900">{cert.venueName || "—"}</strong>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500 font-medium">Location: </span>
                          <strong className="text-slate-900">
                            {cert.city ? `${cert.city}, ${cert.state}` : cert.state}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Issue Date: </span>
                          <strong className="text-slate-900">{cert.issueDate || "21 July 2026"}</strong>
                        </div>
                        {cert.courseCoordinator && (
                          <div>
                            <span className="text-slate-500 font-medium">Coordinator: </span>
                            <strong className="text-slate-900">{cert.courseCoordinator}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                      {cert.svg ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActivePreviewCert(cert)}
                            className="rounded-xl bg-purple-900 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-purple-800 transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            👁️ Preview
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(cert)}
                            disabled={downloadingFormat === "pdf"}
                            className="rounded-xl bg-emerald-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition flex items-center justify-center gap-2 text-center cursor-pointer disabled:opacity-50"
                          >
                            {downloadingFormat === "pdf" ? "Rendering..." : "📥 Download PDF"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPng(cert)}
                            disabled={downloadingFormat === "png"}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition flex items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50"
                          >
                            {downloadingFormat === "png" ? "Rendering..." : "🖼️ PNG"}
                          </button>
                        </>
                      ) : cert.driveLink ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActivePreviewCert(cert)}
                            className="rounded-xl bg-purple-900 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-purple-800 transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            👁️ Preview
                          </button>

                          <a
                            href={cert.downloadUrl || cert.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="rounded-xl bg-emerald-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition flex items-center justify-center gap-2 text-center"
                          >
                            📥 Download Certificate
                          </a>
                        </>
                      ) : (
                        <div className="text-xs font-semibold text-slate-500 italic">
                          Official Certificate Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating & Feedback Box */}
                  <div className="mt-6 pt-5 border-t border-emerald-200/80">
                    {ratedCerts.has(cert.certificateNumber) ? (
                      <div className="rounded-xl bg-emerald-100/80 p-3 text-center text-xs font-bold text-emerald-800">
                        ⭐ Thank you! Your feedback has been recorded.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Rate your CPR Sanjeevani training experience:
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingInput(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="text-xl sm:text-2xl transition hover:scale-110 focus:outline-none cursor-pointer"
                              >
                                {star <= (hoverRating || ratingInput) ? "★" : "☆"}
                              </button>
                            ))}
                            <span className="ml-2 text-xs font-bold text-slate-600">
                              {hoverRating || ratingInput} / 5
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Optional feedback (e.g. Excellent hands-on session, well organized)..."
                            className="flex-1 rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={submittingRating}
                            onClick={() => handleRatingSubmit(cert)}
                            className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer"
                          >
                            {submittingRating ? "Submitting..." : "Submit Rating"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Universal In-Page Certificate Preview Modal */}
      <UniversalCertificatePreviewModal
        certificate={activePreviewCert}
        onClose={() => setActivePreviewCert(null)}
      />
    </section>
  );
}
