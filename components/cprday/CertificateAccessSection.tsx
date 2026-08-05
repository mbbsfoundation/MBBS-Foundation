"use client";

import { useState } from "react";

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
  const [searchMode, setSearchMode] = useState<"cert_id" | "hierarchy">("cert_id");
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

  const sampleIds = ["IAPCPR/PA/HP/0101", "IAPCPR/PA/HP/0102", "IAPCPR/PA/HP/0103"];

  // Fetch initial states list when hierarchy mode opens
  const loadStates = async () => {
    if (statesList.length > 0) return;
    try {
      const res = await fetch("/api/cprday/certificates?action=states");
      const data = await res.json();
      if (res.ok && data.success) {
        setStatesList(data.states);
      }
    } catch (e) {
      console.error("Error loading states:", e);
    }
  };

  const handleModeSwitch = (mode: "cert_id" | "hierarchy") => {
    setSearchMode(mode);
    setError(null);
    setCertificates(null);
    if (mode === "hierarchy") {
      loadStates();
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
      const res = await fetch(`/api/cprday/certificates?action=cities&state=${encodeURIComponent(stateVal)}`);
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
        `/api/cprday/certificates?action=venues&state=${encodeURIComponent(selectedState)}&city=${encodeURIComponent(cityVal)}`
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
        )}&city=${encodeURIComponent(selectedCity)}&venue=${encodeURIComponent(venueVal)}`
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
      const res = await fetch(`/api/cprday/certificates?id=${encodeURIComponent(targetId)}`);
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
      setError("Please complete all 4 selection fields (State, City, Venue, and Participant Name).");
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
      )}&participant=${encodeURIComponent(selectedParticipant)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success && data.certificates) {
        setCertificates(data.certificates);
      } else {
        setError(data.error || "No certificate found matching this combination.");
      }
    } catch (err) {
      console.error("Error searching by location hierarchy:", err);
      setError("Failed to connect to certificate server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            Search by your unique Certificate ID or consecutively select your State, City, Training Venue, and Participant Name to unlock your certificate.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-8 flex rounded-2xl border border-purple-200 bg-white p-1.5 shadow-md">
          <button
            type="button"
            onClick={() => handleModeSwitch("cert_id")}
            className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              searchMode === "cert_id"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            🎫 Search by Certificate ID
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("hierarchy")}
            className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              searchMode === "hierarchy"
                ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md"
                : "text-slate-600 hover:text-purple-700"
            }`}
          >
            📍 Search by Location & Venue (State → City → Venue → Name)
          </button>
        </div>

        {/* Certificate Access Form Box */}
        <div className="mt-6 rounded-2xl sm:rounded-3xl border border-purple-200/80 bg-white p-4 sm:p-8 shadow-xl">
          {searchMode === "cert_id" ? (
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
                  placeholder="e.g. IAPCPR/PA/HP/0101"
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
          ) : (
            <form onSubmit={handleSearchByHierarchy} className="space-y-4">
              <div className="border-b border-purple-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Step-by-Step Guided Location Verification
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select your State, City/District, Training Venue, and Participant Name in order to unlock your certificate.
                </p>
              </div>

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

                {/* Step 4: Select Participant Name */}
                <div>
                  <label htmlFor="select-participant" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 4: Select Participant Name *
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
                      {!selectedVenue ? "-- Select Venue First --" : "-- Choose Participant Name --"}
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
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm flex items-center gap-3">
              <svg className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Render Certificate Cards */}
          {certificates && certificates.length > 0 && (
            <div className="mt-8 sm:mt-10 border-t border-sky-100 pt-6 sm:pt-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 shrink-0"></span>
                  Verified Certificate Found ({certificates.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setCertificates(null)}
                  className="text-xs text-slate-500 hover:text-purple-700 underline"
                >
                  Clear Results
                </button>
              </div>

              <div className="grid gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.certificateNumber}
                    className="relative overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-sky-50 via-purple-50 to-indigo-50 p-4 sm:p-8 shadow-xl text-slate-900"
                  >
                    {/* Decorative Top Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-200/80 pb-4 sm:pb-5">
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-purple-800">
                          Indian Academy of Pediatrics
                        </p>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-0.5 sm:mt-1">
                          CPR Sanjeevani
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        <svg className="h-4 w-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Official Certificate
                      </div>
                    </div>

                    {/* Participant Details */}
                    <div className="my-4 sm:my-6">
                      <p className="text-[11px] sm:text-xs font-medium uppercase text-slate-500 tracking-wider">
                        Certificate Issued To:
                      </p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 break-words">
                        {cert.participantName}
                      </p>
                      <p className="mt-2 sm:mt-3 text-slate-700 leading-relaxed text-xs sm:text-sm max-w-2xl">
                        Has successfully completed the hands-on Cardiopulmonary Resuscitation (CPR) training and awareness module conducted during CPR Sanjeevani.
                      </p>
                    </div>

                    {/* Certificate Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 rounded-xl border border-purple-200 bg-white/90 p-3.5 sm:p-4 text-xs">
                      <div>
                        <span className="text-slate-500 uppercase font-semibold block text-[10px]">Certificate ID</span>
                        <span className="font-mono font-bold text-purple-800 text-xs sm:text-sm mt-0.5 block break-all">{cert.certificateNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-semibold block text-[10px]">Issue Date</span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">{cert.issueDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-semibold block text-[10px]">Venue</span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block truncate">{cert.venueName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase font-semibold block text-[10px]">Location</span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">{cert.city}, {cert.state}</span>
                      </div>
                      {cert.courseCoordinator && (
                        <div>
                          <span className="text-slate-500 uppercase font-semibold block text-[10px]">Coordinator</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block truncate">{cert.courseCoordinator}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {(cert.downloadUrl || cert.driveLink) && (
                        <a
                          href={cert.downloadUrl || cert.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 sm:px-6 py-3.5 font-bold text-white hover:from-emerald-700 hover:to-teal-800 transition shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm text-center"
                        >
                          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Certificate
                        </a>
                      )}

                      {(cert.previewUrl || cert.driveLink) && (
                        <a
                          href={cert.previewUrl || cert.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto rounded-xl border-2 border-purple-300 bg-white px-5 py-3 font-bold text-purple-800 hover:bg-purple-50 transition shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm text-center"
                        >
                          <svg className="h-4 w-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview Certificate
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
