"use client";

import { useState, useEffect } from "react";

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
};

export default function CertificateAccessSection() {
  const [portalType, setPortalType] = useState<"participant" | "coordinator">("participant");
  const [searchMode, setSearchMode] = useState<"hierarchy" | "cert_id">("hierarchy");
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const sampleIds = portalType === "participant"
    ? ["IAPCPR/PA/HP/0101", "IAPCPR/PA/HP/0102", "IAPCPR/PA/HP/0103"]
    : ["IAPCPR/CC/ML/0101", "IAPCPR/CC/HP/0101", "IAPCPR/CC/BR/0101"];

  // Fetch initial states list when portalType or hierarchy mode changes
  const loadStates = async (targetPortal: "participant" | "coordinator" = portalType) => {
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
    setCitiesList([]);
    setVenuesList([]);
    setParticipantsList([]);
    setError(null);
    setCertificates(null);
    setCertId("");

    loadStates(portalType);
  }, [portalType]);

  const handlePortalSwitch = (type: "participant" | "coordinator") => {
    if (type === portalType) return;
    setPortalType(type);
  };

  const handleModeSwitch = (mode: "hierarchy" | "cert_id") => {
    setSearchMode(mode);
    setError(null);
    setCertificates(null);
    if (mode === "hierarchy") {
      loadStates(portalType);
    }
  };

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
      if (res.ok && data.success) {
        setCitiesList(data.cities);
      }
    } catch (e) {}
  };

  const handleCitySelect = async (cityVal: string) => {
    setSelectedCity(cityVal);
    setSelectedVenue("");
    setSelectedParticipant("");
    setVenuesList([]);
    setParticipantsList([]);
    setError(null);

    if (!cityVal) return;
    try {
      const res = await fetch(
        `/api/cprday/certificates?action=venues&state=${encodeURIComponent(
          selectedState
        )}&city=${encodeURIComponent(cityVal)}&portal=${portalType}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setVenuesList(data.venues);
      }
    } catch (e) {}
  };

  const handleVenueSelect = async (venueVal: string) => {
    setSelectedVenue(venueVal);
    setSelectedParticipant("");
    setParticipantsList([]);
    setError(null);

    if (!venueVal) return;
    try {
      const res = await fetch(
        `/api/cprday/certificates?action=participants&state=${encodeURIComponent(
          selectedState
        )}&city=${encodeURIComponent(selectedCity)}&venue=${encodeURIComponent(venueVal)}&portal=${portalType}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setParticipantsList(data.participants);
      }
    } catch (e) {}
  };

  const handleSearchByCertId = async (idToSearch?: string) => {
    const targetId = (idToSearch || certId).trim();
    if (!targetId) {
      setError("Please enter a Certificate ID.");
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
        setError(data.error || `No certificate found matching ID "${targetId}".`);
      }
    } catch (err) {
      console.error("Error retrieving certificate:", err);
      setError("Failed to connect to certificate server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByHierarchy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState || !selectedCity || !selectedVenue || !selectedParticipant) {
      setError("Please select all 4 options (State, City, Venue, and Name).");
      return;
    }

    setLoading(true);
    setError(null);
    setCertificates(null);

    try {
      const url = `/api/cprday/certificates?action=search-hierarchy&state=${encodeURIComponent(
        selectedState
      )}&city=${encodeURIComponent(selectedCity)}&venue=${encodeURIComponent(
        selectedVenue
      )}&participant=${encodeURIComponent(selectedParticipant)}&portal=${portalType}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success && data.certificates) {
        setCertificates(data.certificates);
      } else {
        setError(data.error || "No certificate found matching this combination.");
      }
    } catch (err) {
      console.error("Error searching location hierarchy:", err);
      setError("Failed to connect to certificate server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isCoordinatorPortal = portalType === "coordinator";

  return (
    <section id="certificate-access" className="scroll-mt-24 bg-gradient-to-b from-purple-50/60 via-sky-50/70 to-indigo-50/40 px-4 sm:px-6 py-12 sm:py-16 text-slate-900 border-t border-purple-200">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-purple-800 bg-purple-100/90 border border-purple-300 inline-block px-3.5 sm:px-4 py-1.5 rounded-full">
            Official Certificate Portal
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Access Your CPR Sanjeevani Certificate
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-slate-600">
            Select your dedicated portal below to search, verify, and download official Google Drive certificates.
          </p>
        </div>

        {/* Dedicated Portal Tabs: Participant vs Course Coordinator */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-200/80 border border-purple-200 shadow-inner">
          <button
            type="button"
            onClick={() => handlePortalSwitch("participant")}
            className={`rounded-xl py-3.5 px-5 text-sm sm:text-base font-extrabold transition flex items-center justify-center gap-2.5 ${
              portalType === "participant"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-purple-800 hover:bg-white/50"
            }`}
          >
            🎓 Participant Certificate Portal
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch("coordinator")}
            className={`rounded-xl py-3.5 px-5 text-sm sm:text-base font-extrabold transition flex items-center justify-center gap-2.5 ${
              portalType === "coordinator"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-purple-800 hover:bg-white/50"
            }`}
          >
            🎗️ Course Coordinator Certificate Portal
          </button>
        </div>

        {/* Mode Selector Tabs inside active portal */}
        <div className="mt-6 flex rounded-2xl border border-purple-200 bg-white p-1.5 shadow-md">
          <button
            type="button"
            onClick={() => handleModeSwitch("hierarchy")}
            className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              searchMode === "hierarchy"
                ? "bg-purple-900 text-white shadow-md"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            📍 Search by Location & Venue (State → City → Venue → Name)
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("cert_id")}
            className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              searchMode === "cert_id"
                ? "bg-purple-900 text-white shadow-md"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            🎫 Search by Certificate ID
          </button>
        </div>

        {/* Certificate Access Form Box */}
        <div className="mt-6 rounded-2xl sm:rounded-3xl border border-purple-200/80 bg-white p-4 sm:p-8 shadow-xl">
          <div className="mb-4 pb-3 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                {isCoordinatorPortal ? "Dedicated Portal: Course Coordinator" : "Dedicated Portal: Participant"}
              </span>
              <h3 className="mt-1.5 text-lg font-bold text-slate-900">
                {isCoordinatorPortal
                  ? "Course Coordinator Certificate Access"
                  : "Participant Certificate Access"}
              </h3>
            </div>
          </div>

          {searchMode === "hierarchy" ? (
            <form onSubmit={handleSearchByHierarchy} className="space-y-4">
              <p className="text-xs text-slate-600">
                Consecutively select State, City/District, Training Venue, and {isCoordinatorPortal ? "Coordinator Name" : "Participant Name"} to unlock your official certificate.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Step 1: Select State */}
                <div>
                  <label htmlFor="select-state" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                    {statesList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select City */}
                <div>
                  <label htmlFor="select-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 2: Select City / District *
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
                      {!selectedState ? "-- Select State First --" : "-- Choose City / District --"}
                    </option>
                    {citiesList.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Step 3: Select Venue */}
                <div>
                  <label htmlFor="select-venue" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 3: Select Training Venue *
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

                {/* Step 4: Select Name */}
                <div>
                  <label htmlFor="select-participant" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 4: Select {isCoordinatorPortal ? "Course Coordinator Name" : "Participant Name"} *
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
                      {!selectedVenue
                        ? "-- Select Venue First --"
                        : `-- Choose ${isCoordinatorPortal ? "Course Coordinator Name" : "Participant Name"} --`}
                    </option>
                    {participantsList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !selectedParticipant}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-8 py-3.5 font-bold text-white hover:from-sky-700 hover:to-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm sm:text-base shadow-md"
                >
                  {loading ? "Unlocking Certificate..." : "Access Certificate"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <label htmlFor="certificate-id-input" className="block text-xs sm:text-sm font-semibold text-slate-700">
                Enter Individual Certificate ID
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
                  onChange={(e) => setCertId(e.target.value.toUpperCase())}
                  placeholder={isCoordinatorPortal ? "e.g. IAPCPR/CC/ML/0101" : "e.g. IAPCPR/PA/HP/0101"}
                  className="w-full flex-1 rounded-xl border border-sky-200 bg-slate-50/60 px-4 py-3 sm:py-3.5 text-sm sm:text-base text-slate-900 font-mono tracking-wider placeholder-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                />
                <button
                  id="btn-access-certificate"
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-6 sm:px-7 py-3.5 font-bold text-white hover:from-sky-700 hover:to-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm sm:text-base"
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
                <span className="w-full sm:w-auto">Try Sample Certificate IDs:</span>
                {sampleIds.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setCertId(sample);
                      handleSearchByCertId(sample);
                    }}
                    className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 font-mono text-purple-700 hover:bg-purple-100 transition break-all"
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
                <p className="font-bold text-red-800">Certificate Not Found</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Display Certificate Results */}
          {certificates && certificates.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <h4 className="text-base sm:text-lg font-bold text-emerald-800 flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  Official Certificate Verified ({certificates.length})
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
                          Verified Official Certificate
                        </span>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-mono font-bold text-white shadow-sm">
                          {cert.certificateNumber || "Official Certificate"}
                        </span>
                      </div>

                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {cert.participantName}
                      </h4>

                      <p className="text-xs sm:text-sm font-semibold text-purple-900">
                        {cert.courseTitle}
                      </p>

                      <div className="grid gap-2 text-xs sm:text-sm text-slate-700 sm:grid-cols-2 pt-2 border-t border-emerald-200/60">
                        <div>
                          <span className="font-semibold text-slate-500">Training Venue: </span>
                          <span className="font-medium text-slate-900">{cert.venueName}</span>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-500">Location: </span>
                          <span className="font-medium text-slate-900">
                            {cert.city ? `${cert.city}, ` : ""}
                            {cert.state}
                          </span>
                        </div>

                        {cert.courseCoordinator && (
                          <div>
                            <span className="font-semibold text-slate-500">Coordinator: </span>
                            <span className="font-medium text-slate-900">{cert.courseCoordinator}</span>
                          </div>
                        )}

                        <div>
                          <span className="font-semibold text-slate-500">Issue Date: </span>
                          <span className="font-medium text-slate-900">{cert.issueDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* View and Download Action Buttons */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 justify-center">
                      {cert.downloadUrl && (
                        <a
                          href={cert.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition active:scale-95 text-center"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Certificate
                        </a>
                      )}

                      {cert.previewUrl && (
                        <a
                          href={cert.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-6 py-3.5 text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 transition active:scale-95 text-center"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview Certificate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
