"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import UniversalCertificatePreviewModal from "@/components/cprday/UniversalCertificatePreviewModal";
import AdminHeader from "@/components/admin/AdminHeader";

interface CertificateRecord {
  certificateNumber: string;
  participantName: string;
  courseTitle: string;
  venueName: string;
  city: string;
  state: string;
  issueDate: string;
  status: string;
  category: string;
  mobileNumber?: string;
  email?: string;
  driveLink?: string;
  downloadUrl?: string;
  previewUrl?: string;
  courseCoordinator?: string;
  svg?: string;
  pdfFilename?: string;
  pngFilename?: string;
  svgFilename?: string;
  portalType?: string;
}

export default function SanjeevaniAdminProtectedPortalPage() {
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Portal & Search Mode States: all vs participant vs coordinator vs champion vs facility
  const [activePortalFilter, setActivePortalFilter] = useState<
    "all" | "participant" | "coordinator" | "champion" | "facility"
  >("all");
  const [searchMode, setSearchMode] = useState<"universal" | "hierarchy">("universal");
  const [universalQuery, setUniversalQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [certificatesList, setCertificatesList] = useState<CertificateRecord[]>([]);

  // Cascading Hierarchy States
  const [statesList, setStatesList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [venuesList, setVenuesList] = useState<string[]>([]);
  const [namesList, setNamesList] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedName, setSelectedName] = useState("");

  // In-Page Universal Preview Modal Item
  const [universalModalCert, setUniversalModalCert] = useState<CertificateRecord | null>(null);

  // Check existing admin session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("/api/cprsanjeevani/auth");
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Session verification error:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    verifySession();
  }, []);

  // Fetch states whenever authenticated and portal filter / mode changes
  const loadStates = async (portal: string = activePortalFilter) => {
    try {
      const res = await fetch(`/api/cprday/certificates?action=states&portal=${portal}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStatesList(data.states);
      }
    } catch (e) {
      console.error("Error loading states:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && searchMode === "hierarchy") {
      loadStates(activePortalFilter);
    }
  }, [isAuthenticated, activePortalFilter, searchMode]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      setAuthError("Please enter the administrator password.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/cprsanjeevani/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Incorrect password. Access denied.");
        return;
      }

      setIsAuthenticated(true);
      setPasswordInput("");
    } catch (err: any) {
      console.error(err);
      setAuthError("Authentication service unavailable. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Admin Logout / Lock
  const handleAdminLogout = async () => {
    try {
      await fetch("/api/cprsanjeevani/auth", { method: "DELETE" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthenticated(false);
      setCertificatesList([]);
      setSearched(false);
      setUniversalQuery("");
    }
  };

  // Hierarchy Cascading Handlers
  const handleStateSelect = async (stateVal: string) => {
    setSelectedState(stateVal);
    setSelectedCity("");
    setSelectedVenue("");
    setSelectedName("");
    setCitiesList([]);
    setVenuesList([]);
    setNamesList([]);
    setErrorMessage(null);

    if (!stateVal) return;
    try {
      const res = await fetch(
        `/api/cprday/certificates?action=cities&state=${encodeURIComponent(stateVal)}&portal=${activePortalFilter}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCitiesList(data.cities);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCitySelect = async (cityVal: string) => {
    setSelectedCity(cityVal);
    setSelectedVenue("");
    setSelectedName("");
    setVenuesList([]);
    setNamesList([]);
    setErrorMessage(null);

    if (!cityVal) return;
    try {
      const res = await fetch(
        `/api/cprday/certificates?action=venues&state=${encodeURIComponent(
          selectedState
        )}&city=${encodeURIComponent(cityVal)}&portal=${activePortalFilter}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setVenuesList(data.venues);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVenueSelect = async (venueVal: string) => {
    setSelectedVenue(venueVal);
    setSelectedName("");
    setNamesList([]);
    setErrorMessage(null);

    if (!venueVal) return;
    if (activePortalFilter === "facility") {
      // For facility certificate, venue itself is the certificate holder!
      return;
    }

    try {
      const res = await fetch(
        `/api/cprday/certificates?action=participants&state=${encodeURIComponent(
          selectedState
        )}&city=${encodeURIComponent(selectedCity)}&venue=${encodeURIComponent(venueVal)}&portal=${activePortalFilter}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setNamesList(data.participants);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Perform Hierarchy Search
  const handleHierarchySearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activePortalFilter === "facility") {
      if (!selectedState || !selectedCity || !selectedVenue) {
        setErrorMessage("Please select State, City, and Training Venue.");
        return;
      }
    } else {
      if (!selectedState || !selectedCity || !selectedVenue || !selectedName) {
        setErrorMessage("Please select all 4 dropdown fields (State, City, Venue, and Name).");
        return;
      }
    }

    setLoading(true);
    setSearched(true);
    setErrorMessage(null);
    setCertificatesList([]);

    try {
      let url = `/api/cprday/certificates?action=search-hierarchy&state=${encodeURIComponent(
        selectedState
      )}&city=${encodeURIComponent(selectedCity)}&venue=${encodeURIComponent(
        selectedVenue
      )}&portal=${activePortalFilter}`;

      if (activePortalFilter !== "facility" && selectedName) {
        url += `&participant=${encodeURIComponent(selectedName)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success && data.certificates) {
        setCertificatesList(data.certificates);
      } else {
        setErrorMessage(data.error || "No certificate found matching the selected combination.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error while searching location hierarchy.");
    } finally {
      setLoading(false);
    }
  };

  // Perform Universal Search
  const handleUniversalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = universalQuery.trim();
    if (!query) {
      setErrorMessage("Please enter a Certificate ID, Venue Code, Participant Name, Mobile Number, Email, or Venue.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorMessage(null);
    setCertificatesList([]);

    try {
      const isCertIdFormat =
        /^IAPCPR[/-]/i.test(query) ||
        /^CPR[/-]/i.test(query) ||
        /^IAP-CPR-Day/i.test(query) ||
        /^Venue/i.test(query);

      const url = isCertIdFormat
        ? `/api/cprday/certificates?id=${encodeURIComponent(query)}&portal=${activePortalFilter}`
        : `/api/cprday/certificates?query=${encodeURIComponent(query)}&portal=${activePortalFilter}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.certificate) {
          setCertificatesList([data.certificate]);
        } else if (Array.isArray(data.certificates)) {
          setCertificatesList(data.certificates);
        } else {
          setErrorMessage("No certificate record found.");
        }
      } else {
        setErrorMessage(data.error || `No certificate found matching "${query}". Please check spelling.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error while retrieving certificates.");
    } finally {
      setLoading(false);
    }
  };

  // Switch Portal Filter
  const handlePortalFilterSwitch = (portal: "all" | "participant" | "coordinator" | "champion" | "facility") => {
    setActivePortalFilter(portal);
    setErrorMessage(null);
    setCertificatesList([]);
    setSearched(false);
    setSelectedState("");
    setSelectedCity("");
    setSelectedVenue("");
    setSelectedName("");
    setCitiesList([]);
    setVenuesList([]);
    setNamesList([]);
    if (searchMode === "hierarchy") {
      loadStates(portal);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (cert: CertificateRecord) => {
    setUniversalModalCert(cert);
  };

  // ==========================================
  // 1. LOCKED / AUTHENTICATION GATE SCREEN
  // ==========================================
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-teal-400 border-t-transparent"></div>
          <p className="font-semibold text-slate-300">Checking admin authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 px-4 py-12 text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-teal-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/20 text-3xl text-teal-300 border border-teal-400/40 shadow-inner">
              🔒
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Admin Portal Protected
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Please enter the administrator password to search, inspect, and manage official CPR Sanjeevani certificates.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-teal-200 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/70 p-3 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || !passwordInput}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:from-teal-600 hover:to-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Verifying Password...
                </>
              ) : (
                "Unlock Certificate Portal"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link
              href="/cprday"
              className="text-xs text-teal-400 hover:text-teal-300 transition"
            >
              ← Return to CPR Day Public Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. UNLOCKED ADMIN SEARCH & RETRIEVAL PORTAL
  // ==========================================
  const isFacilityFilter = activePortalFilter === "facility";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-teal-500 selection:text-white">
      {/* Shared Admin Navigation Header */}
      <AdminHeader currentSection="cpr" onLogout={handleAdminLogout} />

      {/* Module Navbar */}
      <div className="bg-slate-950 text-white px-4 sm:px-8 py-3 border-b border-teal-900/60 shadow">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <div className="text-xs sm:text-sm font-bold text-teal-300">
              Admin Mode Active • IAP CPR Sanjeevani Certificate System
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/cprsanjeevani/generate"
              className="rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-300 transition flex items-center gap-1.5 shadow"
            >
              <span>📦</span> Batch Generator
            </Link>

            <Link
              href="/cprday"
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              🗓️ CPR Day Public
            </Link>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="rounded-xl border border-red-500/40 bg-red-950/60 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-900 transition cursor-pointer"
            >
              🔒 Lock Portal
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-950 text-white py-12 px-6 border-b border-teal-800/60 shadow-md">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 border border-teal-400/30 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-teal-200">
            <span>🛡️</span> All-Category Master Certificate Search
          </div>

          <h1 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl text-white">
            IAP CPR Sanjeevani Certificate Portal
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-300">
            Search, verify, inspect, and download official certificates for <strong>Participants (Lay Rescuers)</strong>, <strong>Course Coordinators</strong>, <strong>CPR Champions</strong>, and <strong>CPR Day Participating Facilities / Venues</strong>.
          </p>
        </div>
      </section>

      {/* Main Search Panel */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 -mt-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xl">
          {/* 1. Category / Role Filter Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Filter by Certificate Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => handlePortalFilterSwitch("all")}
                className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePortalFilter === "all"
                    ? "bg-teal-800 text-white shadow-md"
                    : "text-slate-700 hover:text-teal-900 hover:bg-white/60"
                }`}
              >
                🌐 All Certificates
              </button>

              <button
                type="button"
                onClick={() => handlePortalFilterSwitch("participant")}
                className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePortalFilter === "participant"
                    ? "bg-teal-800 text-white shadow-md"
                    : "text-slate-700 hover:text-teal-900 hover:bg-white/60"
                }`}
              >
                🎓 Participants
              </button>

              <button
                type="button"
                onClick={() => handlePortalFilterSwitch("champion")}
                className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePortalFilter === "champion"
                    ? "bg-teal-800 text-white shadow-md"
                    : "text-slate-700 hover:text-teal-900 hover:bg-white/60"
                }`}
              >
                🏆 Champions
              </button>

              <button
                type="button"
                onClick={() => handlePortalFilterSwitch("coordinator")}
                className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePortalFilter === "coordinator"
                    ? "bg-teal-800 text-white shadow-md"
                    : "text-slate-700 hover:text-teal-900 hover:bg-white/60"
                }`}
              >
                🎗️ Coordinators
              </button>

              <button
                type="button"
                onClick={() => handlePortalFilterSwitch("facility")}
                className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePortalFilter === "facility"
                    ? "bg-indigo-700 text-white shadow-md"
                    : "text-slate-700 hover:text-indigo-900 hover:bg-white/60"
                }`}
              >
                🏥 CPR Day Venues
              </button>
            </div>
          </div>

          {/* 2. Search Mode Selector (Universal Search vs Location Hierarchy) */}
          <div className="flex flex-col sm:flex-row rounded-2xl border border-slate-200 bg-slate-100/80 p-1 mb-6 gap-1">
            <button
              type="button"
              onClick={() => {
                setSearchMode("universal");
                setErrorMessage(null);
              }}
              className={`flex-1 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                searchMode === "universal"
                  ? "bg-white text-teal-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🔍 Universal Search ({isFacilityFilter ? "Venue Code / Name / City" : "ID / Name / Mobile / Venue / City"})
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode("hierarchy");
                setErrorMessage(null);
                loadStates(activePortalFilter);
              }}
              className={`flex-1 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                searchMode === "hierarchy"
                  ? "bg-white text-teal-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📍 Location Hierarchy ({isFacilityFilter ? "State → City → Venue" : "State → City → Venue → Name"})
            </button>
          </div>

          {/* 3A. Universal Search Form */}
          {searchMode === "universal" ? (
            <form onSubmit={handleUniversalSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Universal Search Term
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={universalQuery}
                    onChange={(e) => setUniversalQuery(e.target.value)}
                    placeholder={
                      isFacilityFilter
                        ? "e.g. IAP-CPR-Day/Venue/AN-101, Kendriya Vidyalaya, or Siliguri"
                        : "e.g. IAPCPR/PA/OD/1406, IAPCPR/CC/ML/0104, IAPCPR/CH/MP/0231, or Name / Mobile / City"
                    }
                    className="w-full flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm sm:text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !universalQuery.trim()}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 px-7 py-3 text-sm sm:text-base font-bold text-white shadow hover:from-teal-800 hover:to-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Searching...
                      </>
                    ) : (
                      "Search Certificates"
                    )}
                  </button>
                </div>
              </div>

              {/* Sample Quick Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                <span className="font-semibold text-slate-600">Quick Test Searches:</span>
                {isFacilityFilter ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setUniversalQuery("IAP-CPR-Day/Venue/AN-101")}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      IAP-CPR-Day/Venue/AN-101
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniversalQuery("IAP-CPR-Day/Venue/AP-101")}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      IAP-CPR-Day/Venue/AP-101
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniversalQuery("Kendriya Vidyalaya No. 2")}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      Kendriya Vidyalaya No. 2
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setUniversalQuery("IAPCPR/PA/OD/1406")}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      IAPCPR/PA/OD/1406
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniversalQuery("IAPCPR/CC/ML/0104")}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      IAPCPR/CC/ML/0104
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniversalQuery("IAPCPR/CH/MP/0231")}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      IAPCPR/CH/MP/0231
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniversalQuery("IAP-CPR-Day/Venue/AN-101")}
                      className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                    >
                      IAP-CPR-Day/Venue/AN-101 (Venue)
                    </button>
                  </>
                )}
              </div>
            </form>
          ) : (
            /* 3B. Cascading Hierarchy Form - Uniform Horizontal Axis */
            <form onSubmit={handleHierarchySearch} className="space-y-4">
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFacilityFilter ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4 items-end`}>
                {/* Step 1: Select State */}
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                    Step 1: Select State *
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateSelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-3 text-sm font-semibold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                    Step 2: Select City / District *
                  </label>
                  <select
                    disabled={!selectedState}
                    value={selectedCity}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:bg-slate-100 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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

                {/* Step 3: Select Venue */}
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                    Step 3: Select Venue *
                  </label>
                  <select
                    disabled={!selectedCity}
                    value={selectedVenue}
                    onChange={(e) => handleVenueSelect(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:bg-slate-100 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                {!isFacilityFilter && (
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 h-7 flex items-end">
                      Step 4: Select Name *
                    </label>
                    <select
                      disabled={!selectedVenue}
                      value={selectedName}
                      onChange={(e) => setSelectedName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:bg-slate-100 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      required
                    >
                      <option value="">
                        {!selectedVenue ? "-- Select Venue First --" : "-- Choose Name --"}
                      </option>
                      {namesList.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (isFacilityFilter ? !selectedVenue : !selectedName)}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 px-8 py-3.5 text-sm sm:text-base font-bold text-white hover:from-teal-800 hover:to-emerald-800 shadow transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading
                    ? "Searching..."
                    : isFacilityFilter
                    ? "Access CPR Day Venue Certificate"
                    : "Access Certificate"}
                </button>
              </div>
            </form>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3 animate-in fade-in">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold">Search Notice</p>
                <p className="text-xs sm:text-sm mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Search Results Display */}
          {searched && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Search Results ({certificatesList.length} Found)
                </h3>
              </div>

              {certificatesList.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  <p className="text-base font-semibold">No certificate records found.</p>
                  <p className="text-xs mt-1">Please verify the Certificate ID, Venue Code, or location spelling.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {certificatesList.map((cert, index) => {
                    const isWithdrawn =
                      cert.status === "WITHDRAWN" ||
                      cert.status === "RETIRED" ||
                      cert.status === "REVOKED" ||
                      Boolean((cert as any).isWithdrawn) ||
                      Boolean((cert as any).isRetired);

                    if (isWithdrawn) {
                      return (
                        <div
                          key={cert.certificateNumber || index}
                          className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md">
                              {cert.certificateNumber}
                            </span>
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-100 border border-red-300 text-red-800">
                              ⛔ WITHDRAWN
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-slate-900">
                              {cert.participantName}
                            </h4>
                            <p className="text-xs text-amber-800 font-semibold mt-0.5">
                              {cert.courseTitle}
                            </p>
                          </div>

                          <div className="rounded-xl border border-amber-300 bg-amber-100/70 p-3 text-xs text-amber-950 font-medium">
                            ⚠️ This certificate has been withdrawn by the national administration and is no longer valid.
                          </div>

                          <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-amber-200">
                            {cert.venueName && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Venue:</span>
                                <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate" title={cert.venueName}>
                                  {cert.venueName}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-500">Location:</span>
                              <span className="font-semibold text-slate-800">
                                {cert.city ? `${cert.city}, ${cert.state}` : cert.state}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Date:</span>
                              <span className="font-semibold text-slate-800">{cert.issueDate}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-amber-200 text-center text-xs font-bold text-red-700">
                            Downloads &amp; Verification Disabled
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cert.certificateNumber || index}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 hover:border-teal-500 transition shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                            {cert.certificateNumber}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              cert.category === "CPR Facility / Venue"
                                ? "bg-indigo-700 text-white"
                                : cert.category === "CPR Champion"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-teal-100 text-teal-900"
                            }`}
                          >
                            {cert.category || "Participant"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            {cert.participantName}
                          </h4>
                          <p className="text-xs text-teal-700 font-semibold mt-0.5">
                            {cert.courseTitle}
                          </p>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Venue:</span>
                            <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate" title={cert.venueName}>
                              {cert.venueName || "—"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-500">Location:</span>
                            <span className="font-semibold text-slate-800">
                              {cert.city ? `${cert.city}, ${cert.state}` : cert.state}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-500">Date:</span>
                            <span className="font-semibold text-slate-800">{cert.issueDate}</span>
                          </div>

                          {cert.courseCoordinator && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Coordinator:</span>
                              <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate" title={cert.courseCoordinator}>
                                {cert.courseCoordinator}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(cert)}
                            className="flex-1 rounded-xl bg-teal-800 py-2.5 text-xs font-bold text-white hover:bg-teal-900 transition text-center cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                          >
                            👁️ Preview
                          </button>

                          {cert.driveLink && (
                            <a
                              href={cert.downloadUrl || cert.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1"
                              title="Download Certificate"
                            >
                              📥 Download
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Universal In-Page Certificate Preview Modal */}
      <UniversalCertificatePreviewModal
        certificate={universalModalCert}
        onClose={() => setUniversalModalCert(null)}
      />
    </div>
  );
}
