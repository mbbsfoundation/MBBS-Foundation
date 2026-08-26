"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CertificateItem,
  CertificatePreviewModal,
  downloadAllCertificatesZip,
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/components/cprsanjeevani/CertificateRenderer";
import CPRStateReportViewer from "@/components/cpr/CPRStateReportViewer";

interface PreviewRow {
  rowNumber: number;
  name: string;
  date: string;
  venue: string;
  venueCode?: string;
  city: string;
  state: string;
  stateCode: string;
  mobileNumber?: string;
  email?: string;
  courseCoordinator?: string;
  isValid: boolean;
  errors: string[];
  category: "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY";
  proposedCertificateId: string;
  proposedSequence: number;
  isDuplicate: boolean;
  existingCertificateId?: string;
  templateUsed?: string;
}

interface StateSummary {
  category: "CPR_DAY" | "SANJEEVANI" | "CPR_CHAMPION" | "CPR_FACILITY";
  categoryName: string;
  stateCode: string;
  stateName?: string;
  lastIssuedSequence: number;
  lastCertificateId: string | null;
  startingSequence: number;
  startingCertificateId: string;
  countGenerating: number;
  endingSequence: number;
  endingCertificateId: string;
  templateUsed: string;
}

const INDIAN_STATES_AND_CODES = [
  { name: "Andaman & Nicobar Islands", code: "AN" },
  { name: "Andhra Pradesh", code: "AP" },
  { name: "Arunachal Pradesh", code: "AR" },
  { name: "Assam", code: "AS" },
  { name: "Bihar", code: "BR" },
  { name: "Chandigarh", code: "CH" },
  { name: "Chhattisgarh", code: "CG" },
  { name: "Dadra & Nagar Haveli and Daman & Diu", code: "DD" },
  { name: "Delhi", code: "DL" },
  { name: "Goa", code: "GA" },
  { name: "Gujarat", code: "GJ" },
  { name: "Haryana", code: "HR" },
  { name: "Himachal Pradesh", code: "HP" },
  { name: "Jammu & Kashmir", code: "JK" },
  { name: "Jharkhand", code: "JH" },
  { name: "Karnataka", code: "KA" },
  { name: "Kerala", code: "KL" },
  { name: "Ladakh", code: "LA" },
  { name: "Lakshadweep", code: "LD" },
  { name: "Madhya Pradesh", code: "MP" },
  { name: "Maharashtra", code: "MH" },
  { name: "Manipur", code: "MN" },
  { name: "Meghalaya", code: "ML" },
  { name: "Mizoram", code: "MZ" },
  { name: "Nagaland", code: "NL" },
  { name: "Odisha", code: "OD" },
  { name: "Puducherry", code: "PY" },
  { name: "Punjab", code: "PB" },
  { name: "Rajasthan", code: "RJ" },
  { name: "Sikkim", code: "SK" },
  { name: "Tamil Nadu", code: "TN" },
  { name: "Telangana", code: "TG" },
  { name: "Tripura", code: "TR" },
  { name: "Uttar Pradesh", code: "UP" },
  { name: "Uttarakhand", code: "UK" },
  { name: "West Bengal", code: "WB" },
];

export default function SanjeevaniAdminPortalPage() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Top-Level Mode: Batch Generation vs Individual Addition vs State Reports
  const [adminMode, setAdminMode] = useState<"batch" | "individual" | "reports">("batch");

  // Batch Module Category Selector: Participant Certificates vs CPR Champion vs CPR Facility
  const [moduleCategory, setModuleCategory] = useState<"PARTICIPANT" | "CHAMPION" | "FACILITY">("PARTICIPANT");

  // Individual Certificate Addition States
  const [individualCategory, setIndividualCategory] = useState<
    "PARTICIPANT" | "CHAMPION" | "COORDINATOR" | "FACILITY"
  >("PARTICIPANT");
  const [indName, setIndName] = useState<string>("");
  const [indState, setIndState] = useState<string>("");
  const [indStateCode, setIndStateCode] = useState<string>("");
  const [indCity, setIndCity] = useState<string>("");
  const [indVenue, setIndVenue] = useState<string>("");
  const [indDate, setIndDate] = useState<string>("21 July 2026");
  const [indMobile, setIndMobile] = useState<string>("");
  const [indEmail, setIndEmail] = useState<string>("");
  const [indCoordinator, setIndCoordinator] = useState<string>("");
  const [indCustomCertId, setIndCustomCertId] = useState<string>("");
  const [indNotes, setIndNotes] = useState<string>("");

  const [proposedCertId, setProposedCertId] = useState<string>("");
  const [loadingProposed, setLoadingProposed] = useState<boolean>(false);
  const [submittingIndividual, setSubmittingIndividual] = useState<boolean>(false);
  const [individualSuccessResult, setIndividualSuccessResult] = useState<CertificateItem | null>(null);
  const [individualError, setIndividualError] = useState<string | null>(null);

  // Batch generation states
  const [file, setFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    fileName: string;
    totalRows: number;
    validCount: number;
    errorCount: number;
    duplicateCount: number;
    rows: PreviewRow[];
    stateSummaries: StateSummary[];
  } | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [generationResults, setGenerationResults] = useState<{
    batch: any;
    summary: {
      totalRequested: number;
      successfullyGenerated: number;
      skippedCount: number;
      duplicateCount: number;
      failedCount: number;
    };
    certificates: CertificateItem[];
  } | null>(null);

  const [inspectItem, setInspectItem] = useState<CertificateItem | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number } | null>(null);
  const [filterDuplicateOnly, setFilterDuplicateOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Verify existing session on component mount
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

  // Handle Admin Login with Password
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
      setPreviewData(null);
      setGenerationResults(null);
      setFile(null);
      setIndividualSuccessResult(null);
    }
  };

  // Update state code when state is chosen in individual form
  const handleIndividualStateChange = (stateName: string) => {
    setIndState(stateName);
    const found = INDIAN_STATES_AND_CODES.find((s) => s.name === stateName);
    const code = found ? found.code : "";
    setIndStateCode(code);
  };

  // Fetch proposed ID whenever stateCode, category, or date changes
  useEffect(() => {
    if (adminMode === "individual" && indStateCode) {
      let isMounted = true;
      const fetchProposed = async () => {
        setLoadingProposed(true);
        try {
          let catParam = "PARTICIPANT";
          if (individualCategory === "CHAMPION") catParam = "CPR_CHAMPION";
          else if (individualCategory === "COORDINATOR") catParam = "COURSE_COORDINATOR";
          else if (individualCategory === "FACILITY") catParam = "CPR_FACILITY";

          const res = await fetch(
            `/api/cprsanjeevani/admin-certificate?category=${catParam}&stateCode=${indStateCode}&date=${encodeURIComponent(
              indDate
            )}`
          );
          const data = await res.json();
          if (isMounted && res.ok && data.success && data.proposed) {
            setProposedCertId(data.proposed.certificateId);
          }
        } catch (err) {
          console.error("Failed to fetch proposed certificate ID:", err);
        } finally {
          if (isMounted) setLoadingProposed(false);
        }
      };
      fetchProposed();
      return () => {
        isMounted = false;
      };
    } else {
      setProposedCertId("");
    }
  }, [adminMode, individualCategory, indStateCode, indDate]);

  // Submit Individual Certificate Form
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIndividualError(null);
    setIndividualSuccessResult(null);

    if (!indName.trim()) {
      setIndividualError(
        individualCategory === "FACILITY"
          ? "Please enter Venue / Facility Name."
          : "Please enter Candidate Full Name."
      );
      return;
    }
    if (!indState || !indStateCode) {
      setIndividualError("Please select a valid State.");
      return;
    }

    setSubmittingIndividual(true);

    try {
      let catParam = "PARTICIPANT";
      if (individualCategory === "CHAMPION") catParam = "CPR_CHAMPION";
      else if (individualCategory === "COORDINATOR") catParam = "COURSE_COORDINATOR";
      else if (individualCategory === "FACILITY") catParam = "CPR_FACILITY";

      const res = await fetch("/api/cprsanjeevani/admin-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: catParam,
          name: indName.trim(),
          state: indState,
          stateCode: indStateCode,
          city: indCity.trim(),
          venueName: indVenue.trim() || indName.trim(),
          certificateDate: indDate.trim() || "21 July 2026",
          mobileNumber: indMobile.trim() || undefined,
          email: indEmail.trim() || undefined,
          courseCoordinator: indCoordinator.trim() || undefined,
          customCertificateId: indCustomCertId.trim() || undefined,
          notes: indNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIndividualError(data.error || "Failed to create certificate.");
        return;
      }

      setIndividualSuccessResult(data.certificate);
    } catch (err: any) {
      console.error(err);
      setIndividualError("Network connection error. Please try again.");
    } finally {
      setSubmittingIndividual(false);
    }
  };

  const resetIndividualForm = () => {
    setIndividualSuccessResult(null);
    setIndividualError(null);
    setIndName("");
    setIndCity("");
    setIndVenue("");
    setIndMobile("");
    setIndEmail("");
    setIndCoordinator("");
    setIndCustomCertId("");
    setIndNotes("");
  };

  const handleDownloadSample = () => {
    if (moduleCategory === "FACILITY") {
      const headers = "S No,Venue,Venue Code,City,State,State Code,Name of Course Coordinator\n";
      const sampleRows = [
        '1,"Kendriya Vidyalaya No. 2",IAP-CPR-Day/Venue/AN-101,"Andaman & Nikobar Island","Andaman & Nikobar Island",AN,Dr Prof Bal Mukund',
        '2,"Navy Children School",IAP-CPR-Day/Venue/AN-102,"Andaman & Nikobar Island","Andaman & Nikobar Island",AN,Dr Prof Bal Mukund',
        '3,"ACSR Government Medical College, Nellore",IAP-CPR-Day/Venue/AP-101,Nellore,"Andhra Pradesh",AP,Dr A S Kireeti',
        '4,"Sri Balaji Medical College Hospital and Research Institute",IAP-CPR-Day/Venue/AP-103,Renigunta,"Andhra Pradesh",AP,Dr Manu M A',
      ].join("\n");

      const blob = new Blob([headers + sampleRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "IAP_CPR_Facility_Certificates_Sample.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (moduleCategory === "CHAMPION") {
      const headers = "CPR Champion Name,Date,Venue,City,State,State Code,Mobile Number,Email ID\n";
      const sampleRows = [
        "Dr. Amit Sharma,21-07-2026,City Hospital Auditorium,Mumbai,Maharashtra,MH,9876543210,amit.sharma@example.com",
        "Dr. Priya Verma,21-07-2026,AIIMS Seminar Hall,Patna,Bihar,BR,9876543211,priya.verma@example.com",
        "Dr. Rahul Nair,15-08-2026,Apollo Clinic Training Center,Kochi,Kerala,KL,9876543212,rahul.nair@example.com",
        "Dr. Sneha Patel,05-09-2026,Civil Hospital Hall,Ahmedabad,Gujarat,GJ,9876543213,sneha.patel@example.com",
      ].join("\n");

      const blob = new Blob([headers + sampleRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "IAP_CPR_Champion_Certificates_Sample.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const headers = "Participant Name,Course Date,Venue,City,State,State Code,Mobile Number,Email ID\n";
      const sampleRows = [
        "Amit Sharma,21-07-2026,City Hospital Auditorium,Mumbai,Maharashtra,MH,9876543210,amit.sharma@example.com",
        "Dr. Priya Verma,21-07-2026,AIIMS Seminar Hall,Patna,Bihar,BR,9876543211,priya.verma@example.com",
        "Rahul Nair,15-08-2026,Apollo Clinic Training Center,Kochi,Kerala,KL,9876543212,rahul.nair@example.com",
        "Sneha Patel,05-09-2026,Civil Hospital Hall,Ahmedabad,Gujarat,GJ,9876543213,sneha.patel@example.com",
      ].join("\n");

      const blob = new Blob([headers + sampleRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "IAP_Participant_Certificates_Sample.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Switch category
  const handleCategorySwitch = (cat: "PARTICIPANT" | "CHAMPION" | "FACILITY") => {
    if (cat === moduleCategory) return;
    setModuleCategory(cat);
    setFile(null);
    setPreviewData(null);
    setGenerationResults(null);
  };

  // Upload file and obtain preview
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoadingPreview(true);
    setPreviewData(null);
    setGenerationResults(null);

    const formData = new FormData();
    formData.append("file", file);
    if (moduleCategory === "FACILITY") {
      formData.append("category", "CPR_FACILITY");
    } else if (moduleCategory === "CHAMPION") {
      formData.append("category", "CPR_CHAMPION");
    }

    try {
      const res = await fetch("/api/cprsanjeevani/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to process upload file");
        return;
      }

      setPreviewData({
        fileName: file.name,
        totalRows: data.preview.totalRows,
        validCount: data.preview.validCount,
        errorCount: data.preview.errorCount,
        duplicateCount: data.preview.duplicateCount,
        rows: data.preview.rows,
        stateSummaries: data.preview.stateSummaries,
      });
    } catch (err: any) {
      console.error(err);
      alert("Error uploading file. Please check connection.");
    } finally {
      setLoadingPreview(false);
    }
  };

  // Execute bulk generation
  const handleGenerateBatch = async () => {
    if (!previewData || previewData.validCount === 0) return;

    let confirmMsg = "";
    if (moduleCategory === "FACILITY") {
      confirmMsg =
        `Are you sure you want to generate ${previewData.validCount} CPR Facility certificates?\n\n` +
        `• Category: CPR Facility / Venue\n` +
        `• Certificate ID: Preserved exact Venue Code from CSV (e.g. IAP-CPR-Day/Venue/AN-101)\n` +
        `• Master Template: 'CPR Facility Certificate.svg'`;
    } else if (moduleCategory === "CHAMPION") {
      confirmMsg =
        `Are you sure you want to generate ${previewData.validCount} CPR Champion certificates?\n\n` +
        `• Category: CPR Champion (IAPCPR/CH/{STATE}/{XXXX})\n` +
        `• Master Template: 'CPR Champions.svg'\n` +
        `• Sequences: Starts from 0101 or continues from existing state sequences.`;
    } else {
      confirmMsg =
        `Are you sure you want to generate ${previewData.validCount} participant certificates?\n\n` +
        `• National IAP CPR Day (21-07-2026): Numbered as IAPCPR/PA/{STATE}/{XXXX} (continuing existing sequences) using 'Lay Rescuer CPR Day.svg'\n` +
        `• IAP CPR Sanjeevani (Other Dates): Numbered as IAPCPR/Sanjeevani/{STATE}/{XXXX} (starting from 0101) using 'cpr sanjeevani certificate 2.svg'`;
    }

    const confirmed = confirm(confirmMsg);
    if (!confirmed) return;

    setGenerating(true);
    setGenerationProgress({ current: 0, total: previewData.validCount });

    try {
      const res = await fetch("/api/cprsanjeevani/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: previewData.fileName,
          rows: previewData.rows,
          allowDuplicates: false,
          category:
            moduleCategory === "FACILITY"
              ? "CPR_FACILITY"
              : moduleCategory === "CHAMPION"
              ? "CPR_CHAMPION"
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Batch generation failed");
        return;
      }

      setGenerationResults({
        batch: data.batch,
        summary: data.summary,
        certificates: data.certificates,
      });

      // Scroll to results
      setTimeout(() => {
        const el = document.getElementById("generation-results-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Batch generation failed due to network error.");
    } finally {
      setGenerating(false);
      setGenerationProgress(null);
    }
  };

  // 1-Click ZIP Download
  const handleDownloadAllZip = async () => {
    if (!generationResults || generationResults.certificates.length === 0) return;

    setDownloadingZip(true);
    setZipProgress({ current: 0, total: generationResults.certificates.length });

    try {
      const zipPrefix =
        moduleCategory === "FACILITY"
          ? "IAP_CPR_Facility_Certificates"
          : moduleCategory === "CHAMPION"
          ? "IAP_CPR_Champion_Certificates"
          : "IAP_CPR_Certificates";

      await downloadAllCertificatesZip(
        generationResults.certificates,
        `${zipPrefix}_Batch_${generationResults.batch?.id || "Export"}.zip`,
        (current, total) => {
          setZipProgress({ current, total });
        }
      );
    } catch (err) {
      console.error(err);
      alert("Failed to build ZIP archive.");
    } finally {
      setDownloadingZip(false);
      setZipProgress(null);
    }
  };

  const filteredRows = (previewData?.rows || []).filter((r) => {
    if (filterDuplicateOnly && !r.isDuplicate) return false;
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q) ||
      r.stateCode.toLowerCase().includes(q) ||
      r.venue.toLowerCase().includes(q) ||
      r.proposedCertificateId.toLowerCase().includes(q) ||
      (r.courseCoordinator && r.courseCoordinator.toLowerCase().includes(q)) ||
      r.date.toLowerCase().includes(q)
    );
  });

  // Loading Session View
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-teal-400 border-t-transparent animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider text-teal-200">
            Checking Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Admin Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white selection:bg-teal-500 selection:text-white">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="relative rounded-3xl border border-teal-500/30 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Header Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 shadow-lg shadow-teal-500/20 text-3xl">
              🔒
            </div>

            <div className="text-center mt-5">
              <span className="inline-block rounded-full bg-teal-500/10 border border-teal-400/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-teal-300">
                Restricted Admin Access
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Admin Portal Lock
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
                Enter your administrative password to manage certificate generation.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold uppercase tracking-wider text-teal-200 mb-2"
                >
                  Enter Admin Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter security key..."
                    autoFocus
                    required
                    className="w-full rounded-xl border border-teal-500/40 bg-slate-800/90 px-4 py-3.5 pr-11 text-sm sm:text-base text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 text-sm cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="rounded-xl border border-rose-500/50 bg-rose-950/80 p-3.5 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
                  <span className="text-base leading-none">⚠️</span>
                  <div>
                    <p className="font-bold">Access Denied</p>
                    <p className="mt-0.5 text-rose-300">{authError}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading || !passwordInput}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-lg hover:from-teal-600 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Admin Portal 🔓</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <Link
                href="/cprsanjeevani"
                className="text-xs text-slate-400 hover:text-teal-300 transition inline-flex items-center gap-1 font-medium"
              >
                ← Return to Admin Master Search Portal
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Indian Academy of Pediatrics • Unified Certificate Administration System
        </p>
      </div>
    );
  }

  // Authenticated Admin Portal View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <section className="bg-gradient-to-r from-teal-950 via-teal-900 to-indigo-950 text-white py-12 px-6 border-b border-teal-700/50 shadow-md">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 border border-teal-400/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-200">
                <span>🔒</span> Admin Portal • CPR Sanjeevani Certificate Engine
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                Certificate Administration
              </h1>
              <p className="mt-2 text-sm sm:text-base text-teal-100 max-w-3xl leading-relaxed">
                Generate official high-resolution certificates in bulk via spreadsheet upload or add individual records with automatic sequence allocation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {adminMode === "batch" && (
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow hover:bg-amber-300 transition text-center flex items-center gap-1.5 cursor-pointer"
                >
                  📥{" "}
                  {moduleCategory === "FACILITY"
                    ? "Facility Sample CSV"
                    : moduleCategory === "CHAMPION"
                    ? "Champion Sample CSV"
                    : "Participant Sample CSV"}
                </button>
              )}
              <Link
                href="/cprsanjeevani"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition text-center"
              >
                🔍 Master Search
              </Link>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="rounded-xl border border-rose-400/40 bg-rose-900/60 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-100 hover:bg-rose-800 transition text-center flex items-center gap-1.5 cursor-pointer"
                title="Lock Admin Portal & Logout"
              >
                🔒 Lock Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Top-Level Mode Selector: Batch Generation vs Individual Addition vs State Reports */}
      <div className="no-print mx-auto max-w-6xl px-6 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-teal-950/10 border border-teal-800/20 shadow-inner">
          <button
            type="button"
            onClick={() => setAdminMode("batch")}
            className={`rounded-xl py-3.5 px-3 text-xs sm:text-sm md:text-base font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              adminMode === "batch"
                ? "bg-gradient-to-r from-teal-800 to-indigo-900 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-teal-900 hover:bg-white/60 font-bold"
            }`}
          >
            <span>📦</span> Batch Generation
          </button>
          <button
            type="button"
            onClick={() => setAdminMode("individual")}
            className={`rounded-xl py-3.5 px-3 text-xs sm:text-sm md:text-base font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              adminMode === "individual"
                ? "bg-gradient-to-r from-teal-800 to-indigo-900 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-teal-900 hover:bg-white/60 font-bold"
            }`}
          >
            <span>➕</span> Individual Addition
          </button>
          <button
            type="button"
            onClick={() => setAdminMode("reports")}
            className={`rounded-xl py-3.5 px-3 text-xs sm:text-sm md:text-base font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              adminMode === "reports"
                ? "bg-gradient-to-r from-teal-800 to-indigo-900 text-white shadow-lg scale-[1.01]"
                : "text-slate-700 hover:text-teal-900 hover:bg-white/60 font-bold"
            }`}
          >
            <span>📊</span> State Reports (Census)
          </button>
        </div>
      </div>

      {adminMode === "batch" ? (
        <>
          {/* Module Category Selector: Participant vs Champion vs Facility */}
          <div className="mx-auto max-w-6xl px-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-slate-200 border border-slate-300 shadow-inner">
              <button
                type="button"
                onClick={() => handleCategorySwitch("PARTICIPANT")}
                className={`rounded-xl py-3 px-4 text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  moduleCategory === "PARTICIPANT"
                    ? "bg-teal-800 text-white shadow-md scale-[1.01]"
                    : "text-slate-700 hover:text-teal-900 hover:bg-white/50"
                }`}
              >
                🎓 Participant Certificates
              </button>

              <button
                type="button"
                onClick={() => handleCategorySwitch("CHAMPION")}
                className={`rounded-xl py-3 px-4 text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  moduleCategory === "CHAMPION"
                    ? "bg-amber-600 text-white shadow-md scale-[1.01]"
                    : "text-slate-700 hover:text-amber-900 hover:bg-white/50"
                }`}
              >
                🏆 CPR Champion Certificates
              </button>

              <button
                type="button"
                onClick={() => handleCategorySwitch("FACILITY")}
                className={`rounded-xl py-3 px-4 text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  moduleCategory === "FACILITY"
                    ? "bg-indigo-700 text-white shadow-md scale-[1.01]"
                    : "text-slate-700 hover:text-indigo-900 hover:bg-white/50"
                }`}
              >
                🏥 CPR Facility Certificates
              </button>
            </div>
          </div>

          {/* Main Container */}
          <main className="mx-auto max-w-6xl px-6 mt-6 space-y-8">
            {/* Step 1: Upload Box */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                  1
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {moduleCategory === "FACILITY"
                      ? "Upload CPR Facility / Venue Master Dataset"
                      : moduleCategory === "CHAMPION"
                      ? "Upload CPR Champion Dataset"
                      : "Upload Participant Dataset"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {moduleCategory === "FACILITY"
                      ? "Upload CSV or Excel (.xlsx / .xls) with columns: Venue, Venue Code, City, State, State Code, Name of Course Coordinator"
                      : "Upload CSV or Excel (.xlsx / .xls) with columns: Name, Date, Venue, City, State, State Code"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleFileUpload} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Select CSV or Excel File (
                      {moduleCategory === "FACILITY"
                        ? "CPR Facility Registry"
                        : moduleCategory === "CHAMPION"
                        ? "CPR Champions"
                        : "Participants"}
                      )
                    </label>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!file || loadingPreview}
                      className={`w-full rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                        moduleCategory === "FACILITY"
                          ? "bg-indigo-700 hover:bg-indigo-800"
                          : moduleCategory === "CHAMPION"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-teal-700 hover:bg-teal-800"
                      }`}
                    >
                      {loadingPreview ? (
                        <>
                          <span className="animate-spin">⏳</span> Validating Dataset...
                        </>
                      ) : (
                        <>
                          <span>🔍</span> Validate &amp; Preview Allocation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* Step 2: Preview & State Summary Cards */}
            {previewData && (
              <section className="space-y-6 animate-in fade-in duration-300">
                {/* Summary Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Rows</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{previewData.totalRows}</p>
                    <span className="text-[11px] text-slate-400">In {previewData.fileName}</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Valid to Generate</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-700">{previewData.validCount}</p>
                    <span className="text-[11px] text-emerald-600">✓ Ready for issuance</span>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Duplicates Detected</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-amber-700">{previewData.duplicateCount}</p>
                    <span className="text-[11px] text-amber-600">Already in system</span>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-800">Invalid / Error Rows</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-rose-700">{previewData.errorCount}</p>
                    <span className="text-[11px] text-rose-600">Missing required data</span>
                  </div>
                </div>

                {/* State Allocation Summaries */}
                {previewData.stateSummaries && previewData.stateSummaries.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span>🗺️</span> State Allocation &amp; ID Range Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {previewData.stateSummaries.map((summary) => (
                        <div
                          key={`summary_${summary.stateCode}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2">
                            <span>
                              {summary.stateName || summary.stateCode} ({summary.stateCode})
                            </span>
                            <span className="rounded-full bg-teal-100 text-teal-800 px-2 py-0.5 font-mono">
                              +{summary.countGenerating} certs
                            </span>
                          </div>
                          <div className="space-y-1 text-slate-600">
                            <div>
                              Last Issued:{" "}
                              <span className="font-mono font-semibold text-slate-800">
                                {summary.lastCertificateId || "None"}
                              </span>
                            </div>
                            <div>
                              Starting ID:{" "}
                              <span className="font-mono font-bold text-teal-700">
                                {summary.startingCertificateId}
                              </span>
                            </div>
                            <div>
                              Ending ID:{" "}
                              <span className="font-mono font-bold text-teal-700">
                                {summary.endingCertificateId}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Preview Table with Search & Duplicate Toggle */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>📋</span> Row-by-Row Sequence Allocation Preview
                    </h3>

                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        placeholder="Filter by name / state / ID..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none w-52"
                      />

                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl">
                        <input
                          type="checkbox"
                          checked={filterDuplicateOnly}
                          onChange={(e) => setFilterDuplicateOnly(e.target.checked)}
                          className="rounded text-teal-600"
                        />
                        Show duplicates only ({previewData.duplicateCount})
                      </label>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-2.5 px-3">S No</th>
                          <th className="py-2.5 px-3">
                            {moduleCategory === "FACILITY" ? "Venue / Facility" : "Name"}
                          </th>
                          <th className="py-2.5 px-3">City, State</th>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">
                            {moduleCategory === "FACILITY" ? "Course Coordinator" : "Date"}
                          </th>
                          <th className="py-2.5 px-3">Certificate ID</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRows.map((r, i) => (
                          <tr
                            key={`row_${r.rowNumber}_${i}`}
                            className={`hover:bg-slate-50 transition ${
                              !r.isValid ? "bg-rose-50/50" : r.isDuplicate ? "bg-amber-50/50" : ""
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-slate-400">{r.rowNumber - 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 max-w-[260px] truncate" title={r.venue || r.name}>
                              {r.venue || r.name || "—"}
                            </td>
                            <td className="py-2 px-3">
                              {r.city}, {r.state}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold">{r.stateCode}</td>
                            <td className="py-2 px-3 text-slate-600 max-w-[180px] truncate" title={r.courseCoordinator || r.date}>
                              {r.courseCoordinator || r.date || "—"}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-teal-800">
                              {r.proposedCertificateId || "—"}
                            </td>
                            <td className="py-2 px-3">
                              {!r.isValid ? (
                                <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800 text-[10px]" title={r.errors.join(", ")}>
                                  ⚠️ Invalid
                                </span>
                              ) : r.isDuplicate ? (
                                <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[10px]" title={`Already issued: ${r.existingCertificateId}`}>
                                  Duplicate ({r.existingCertificateId})
                                </span>
                              ) : (
                                <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[10px]">
                                  ✓ Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Generate Trigger Button */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      Ready to issue <strong className="text-slate-900">{previewData.validCount}</strong> official{" "}
                      {moduleCategory === "FACILITY"
                        ? "Facility certificates"
                        : moduleCategory === "CHAMPION"
                        ? "CPR Champion certificates"
                        : "Participant certificates"}
                      .
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateBatch}
                      disabled={generating || previewData.validCount === 0}
                      className={`rounded-xl px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg transition disabled:opacity-50 flex items-center gap-2 cursor-pointer ${
                        moduleCategory === "FACILITY"
                          ? "bg-indigo-700 hover:bg-indigo-800"
                          : moduleCategory === "CHAMPION"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-teal-700 hover:bg-teal-800"
                      }`}
                    >
                      {generating ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Generating Certificates ({generationProgress?.current || 0}/{generationProgress?.total || 0})...
                        </>
                      ) : (
                        <>
                          <span>⚡</span> Issue &amp; Generate {previewData.validCount} Certificates
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Step 3: Generation Results & Batch Downloads */}
            {generationResults && (
              <section className="space-y-6 animate-in fade-in duration-300">
                <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-teal-500/30 border border-teal-400/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-200">
                        Batch Generation Complete
                      </span>
                      <h3 className="mt-2 text-2xl font-black">
                        {generationResults.summary.successfullyGenerated} Official Certificates Generated!
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-teal-200">
                        Batch ID: <span className="font-mono text-white">{generationResults.batch.id}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadAllZip}
                        disabled={downloadingZip}
                        className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 shadow hover:bg-emerald-300 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {downloadingZip ? (
                          <>
                            <span className="animate-spin">⏳</span> Packaging Zip ({zipProgress?.current || 0}/{zipProgress?.total || 0})...
                          </>
                        ) : (
                          <>
                            <span>📦</span> Download All ({generationResults.summary.successfullyGenerated}) as ZIP
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Certificate Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generationResults.certificates.map((cert) => (
                    <div
                      key={cert.certificateId}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                          {cert.certificateId}
                        </span>
                        <span className="text-[10px] text-slate-400">{cert.date}</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm truncate" title={cert.participantName}>
                        {cert.participantName}
                      </h4>

                      <p className="text-xs text-slate-500 truncate">
                        {cert.city}, {cert.state}
                      </p>

                      {cert.courseCoordinator && (
                        <p className="text-[11px] text-slate-600 truncate">
                          👨‍⚕️ Coord: {cert.courseCoordinator}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setInspectItem(cert)}
                          className="flex-1 rounded-lg bg-teal-700 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition text-center cursor-pointer"
                        >
                          👁️ Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadCertificatePdf(cert)}
                          className="flex-1 rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition text-center cursor-pointer"
                        >
                          📥 PDF
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadCertificatePng(cert)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition text-center cursor-pointer"
                          title="Download PNG"
                        >
                          🖼️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </>
      ) : adminMode === "individual" ? (
        /* INDIVIDUAL CERTIFICATE ADDITION VIEW */
        <main className="mx-auto max-w-4xl px-6 mt-6 space-y-8 animate-in fade-in duration-300">
          {/* Individual Category Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-slate-200 border border-slate-300 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIndividualCategory("PARTICIPANT");
                setIndividualSuccessResult(null);
              }}
              className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                individualCategory === "PARTICIPANT"
                  ? "bg-teal-800 text-white shadow-md scale-[1.01]"
                  : "text-slate-700 hover:text-teal-900 hover:bg-white/50"
              }`}
            >
              🎓 Participant
            </button>

            <button
              type="button"
              onClick={() => {
                setIndividualCategory("CHAMPION");
                setIndividualSuccessResult(null);
              }}
              className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                individualCategory === "CHAMPION"
                  ? "bg-amber-600 text-white shadow-md scale-[1.01]"
                  : "text-slate-700 hover:text-amber-900 hover:bg-white/50"
              }`}
            >
              🏆 CPR Champion
            </button>

            <button
              type="button"
              onClick={() => {
                setIndividualCategory("COORDINATOR");
                setIndividualSuccessResult(null);
              }}
              className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                individualCategory === "COORDINATOR"
                  ? "bg-emerald-700 text-white shadow-md scale-[1.01]"
                  : "text-slate-700 hover:text-emerald-900 hover:bg-white/50"
              }`}
            >
              🎗️ Coordinator
            </button>

            <button
              type="button"
              onClick={() => {
                setIndividualCategory("FACILITY");
                setIndividualSuccessResult(null);
              }}
              className={`rounded-xl py-3 px-3 text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                individualCategory === "FACILITY"
                  ? "bg-indigo-700 text-white shadow-md scale-[1.01]"
                  : "text-slate-700 hover:text-indigo-900 hover:bg-white/50"
              }`}
            >
              🏥 Facility / Venue
            </button>
          </div>

          {/* Success Banner if created */}
          {individualSuccessResult && (
            <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 p-6 sm:p-8 text-white shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-emerald-400/20 border border-emerald-300/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                    ✓ Certificate Issued Successfully
                  </span>
                  <h3 className="mt-3 text-2xl sm:text-3xl font-black text-white">
                    {individualSuccessResult.participantName}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-teal-100">
                    <span className="font-mono font-bold bg-white/20 px-2.5 py-0.5 rounded text-white">
                      {individualSuccessResult.certificateId}
                    </span>
                    <span>• {individualSuccessResult.city}, {individualSuccessResult.state}</span>
                    <span>• Date: {individualSuccessResult.date}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-emerald-700/50 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setInspectItem(individualSuccessResult)}
                  className="rounded-xl bg-teal-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow hover:bg-teal-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  👁️ Preview Certificate
                </button>
                <button
                  type="button"
                  onClick={() => downloadCertificatePdf(individualSuccessResult)}
                  className="rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  📥 Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadCertificatePng(individualSuccessResult)}
                  className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  🖼️ Download PNG
                </button>
                <button
                  type="button"
                  onClick={resetIndividualForm}
                  className="rounded-xl border border-emerald-400/40 bg-emerald-900/60 px-5 py-2.5 text-xs sm:text-sm font-bold text-emerald-100 hover:bg-emerald-800 transition ml-auto cursor-pointer"
                >
                  ➕ Add Another Record
                </button>
              </div>
            </div>
          )}

          {/* Form Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {individualCategory === "FACILITY"
                  ? "Add Participating Venue / Facility Certificate"
                  : individualCategory === "COORDINATOR"
                  ? "Add Course Coordinator Certificate"
                  : individualCategory === "CHAMPION"
                  ? "Add CPR Champion Certificate"
                  : "Add Participant Certificate"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter details to issue an official certificate record with automatic unique numbering.
              </p>
            </div>

            {individualError && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
                <span>⚠️</span> {individualError}
              </div>
            )}

            <form onSubmit={handleIndividualSubmit} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {individualCategory === "FACILITY" ? "Venue / Facility Name *" : "Candidate Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      individualCategory === "FACILITY"
                        ? "e.g. AIIMS Auditorium, Patna"
                        : "e.g. Dr. Rajesh Sharma"
                    }
                    value={indName}
                    onChange={(e) => setIndName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* State Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    State *
                  </label>
                  <select
                    required
                    value={indState}
                    onChange={(e) => handleIndividualStateChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="">Select State...</option>
                    {INDIAN_STATES_AND_CODES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Kolkata, Patna"
                    value={indCity}
                    onChange={(e) => setIndCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* Venue Name (if participant/champion/coordinator) */}
                {individualCategory !== "FACILITY" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Training Venue Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. City Hospital Auditorium / Medical College Hall"
                      value={indVenue}
                      onChange={(e) => setIndVenue(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Course / Issue Date
                  </label>
                  <input
                    type="text"
                    value={indDate}
                    onChange={(e) => setIndDate(e.target.value)}
                    placeholder="21 July 2026"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* Course Coordinator Name */}
                {(individualCategory === "PARTICIPANT" || individualCategory === "FACILITY") && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Course Coordinator Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Punit Goenka"
                      value={indCoordinator}
                      onChange={(e) => setIndCoordinator(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={indMobile}
                    onChange={(e) => setIndMobile(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={indEmail}
                    onChange={(e) => setIndEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* Optional Custom Certificate ID Override */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Custom Certificate ID / Venue Code (Optional Override)</span>
                    <span className="text-[11px] text-slate-400 font-normal">Leave blank for automatic allocation</span>
                  </label>
                  <input
                    type="text"
                    placeholder={
                      proposedCertId ? `Leave blank to use auto-allocated ID: ${proposedCertId}` : "Auto-allocated upon state selection"
                    }
                    value={indCustomCertId}
                    onChange={(e) => setIndCustomCertId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Allocated Sequence Badge */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚡</span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      Proposed Certificate ID (Auto-Calculated)
                    </div>
                    <div className="font-mono text-base sm:text-lg font-black text-teal-950">
                      {loadingProposed ? (
                        <span className="text-sm font-normal text-teal-600 animate-pulse">Calculating next sequence...</span>
                      ) : proposedCertId ? (
                        proposedCertId
                      ) : (
                        <span className="text-xs font-normal text-slate-500">Select state above to calculate ID</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/80 px-2.5 py-1 rounded-md">
                  Strictly Unique • Non-Colliding
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetIndividualForm}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={submittingIndividual || !indName || !indState}
                  className="rounded-xl bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 px-8 py-3 text-xs sm:text-base font-black text-white shadow-lg hover:from-teal-800 hover:to-indigo-950 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submittingIndividual ? (
                    <>
                      <span className="animate-spin">⏳</span> Issuing Certificate...
                    </>
                  ) : (
                    <>
                      <span>➕</span> Issue &amp; Generate Certificate
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </main>
      ) : (
        /* STATE REPORTS VIEW */
        <main className="mx-auto max-w-6xl px-6 mt-6 animate-in fade-in duration-300">
          <CPRStateReportViewer isAdmin={true} />
        </main>
      )}

      {/* In-Page Vector Certificate Modal Preview */}
      {inspectItem && (
        <CertificatePreviewModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      )}
    </div>
  );
}
