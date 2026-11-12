"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { INDIAN_STATES_AND_UTS } from "@/lib/mbbs-foundation/consultationTypes";

export const VALID_CATEGORIES = [
  { value: "MBBS_STUDENT", label: "MBBS Student" },
  { value: "INTERN", label: "Medical Intern (CRMI)" },
  { value: "POSTGRADUATE_RESIDENT", label: "Postgraduate Resident (MD / MS / DNB)" },
  { value: "DOCTOR", label: "Medical Doctor / Physician" },
  { value: "MEDICAL_FACULTY", label: "Medical Faculty / Professor" },
  { value: "RESOURCE_PERSON", label: "Resource Person / Clinical Trainer" },
  { value: "OTHER_HEALTHCARE_PROFESSIONAL", label: "Other Healthcare Professional" },
] as const;

export const MBBS_YEARS = [
  "1st Year (Phase I)",
  "2nd Year (Phase II)",
  "3rd Year Part 1 (Phase III Part 1)",
  "Final Year Part 2 (Phase III Part 2)",
  "Internship",
] as const;

interface CollegeItem {
  id: string;
  collegeName: string;
  state?: string;
  city?: string;
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Core Component States
  const [phase, setPhase] = useState<"checking" | "send_email" | "email_sent" | "register_profile" | "success">("checking");
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; email: string } | null>(null);

  // Email entry state
  const [emailInput, setEmailInput] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSentTarget, setEmailSentTarget] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Profile registration form states
  const [fullName, setFullName] = useState<string>("");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [learnerCategory, setLearnerCategory] = useState<string>("MBBS_STUDENT");
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);
  const [selectedCollegeName, setSelectedCollegeName] = useState<string>("");
  const [isCustomInstitution, setIsCustomInstitution] = useState<boolean>(false);
  const [customInstitutionName, setCustomInstitutionName] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [pinCode, setPinCode] = useState<string>("");
  const [mbbsYear, setMbbsYear] = useState<string>("1st Year (Phase I)");
  const [departmentDesignation, setDepartmentDesignation] = useState<string>("");

  // College autocomplete state
  const [collegeSearchQuery, setCollegeSearchQuery] = useState<string>("");
  const [collegeSearchResults, setCollegeSearchResults] = useState<CollegeItem[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState<boolean>(false);
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState<boolean>(false);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // Form submission state
  const [isSubmittingProfile, setIsSubmittingProfile] = useState<boolean>(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // 2. Initial Session & Verification State Check
  useEffect(() => {
    let isMounted = true;

    // Cache redirect in sessionStorage if present in URL
    const redirectParam = searchParams.get("redirect");
    if (redirectParam && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("mbbsf_learn_redirect", redirectParam);
      } catch {}
    }

    async function checkInitialState() {
      try {
        // First check if user is already authenticated
        const meRes = await fetch("/api/mbbs-foundation/learn/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (isMounted && meData.authenticated && meData.user) {
            setCurrentUser(meData.user);
            const storedRedirect =
              typeof window !== "undefined"
                ? sessionStorage.getItem("mbbsf_learn_redirect")
                : null;
            const targetRedirect = redirectParam || storedRedirect;
            if (
              targetRedirect &&
              targetRedirect.startsWith("/") &&
              !targetRedirect.startsWith("//")
            ) {
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.removeItem("mbbsf_learn_redirect");
                } catch {}
              }
              router.replace(targetRedirect);
              return;
            }
            setPhase("checking");
            return;
          }
        }

        // Check if returning from email verification (?verified=1)
        const isVerifiedParam = searchParams.get("verified") === "1";
        const emailParam = searchParams.get("email");

        if (isVerifiedParam) {
          setPhase("register_profile");
          if (emailParam) {
            setVerifiedEmail(decodeURIComponent(emailParam));
          }
        } else {
          setPhase("send_email");
        }
      } catch (err) {
        if (isMounted) setPhase("send_email");
      }
    }

    checkInitialState();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  // 3. Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // 4. College Search Autocomplete (Debounced)
  useEffect(() => {
    if (!collegeSearchQuery || collegeSearchQuery.trim().length < 2 || isCustomInstitution) {
      setCollegeSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingColleges(true);
        const res = await fetch(
          `/api/counselling/colleges?query=${encodeURIComponent(collegeSearchQuery.trim())}&pageSize=20`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.items) {
            setCollegeSearchResults(data.items);
            setIsCollegeDropdownOpen(true);
          }
        }
      } catch (e) {
        console.error("College search error:", e);
      } finally {
        setIsSearchingColleges(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [collegeSearchQuery, isCustomInstitution]);

  // Close college dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target as Node)) {
        setIsCollegeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 5. Send Verification Link Handler
  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const email = emailInput.trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSendingEmail(true);
      const res = await fetch("/api/mbbs-foundation/learn/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429) {
          setEmailError(data.message || "Too many requests. Please wait a few minutes before trying again.");
          setResendCooldown(data.retryAfterSeconds || 60);
          return;
        }
        setEmailError(data.message || "Unable to send verification email. Please try again.");
        return;
      }

      setEmailSentTarget(email);
      setPhase("email_sent");
      setResendCooldown(60);
    } catch (err) {
      setEmailError("Network connection error. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 6. Handle College Selection from Dropdown
  const handleSelectCollege = (col: CollegeItem) => {
    setSelectedCollegeId(col.id);
    setSelectedCollegeName(col.collegeName);
    setCollegeSearchQuery(col.collegeName);
    setIsCollegeDropdownOpen(false);

    if (col.state) setState(col.state);
    if (col.city) setCity(col.city);

    // Clear any college error
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next.college;
      return next;
    });
  };

  // 7. Profile Registration Submission Handler
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setProfileErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (minimum 2 characters).";
    }

    const cleanMobile = mobileNumber.replace(/^(\+91|0)/, "").replace(/[\s-]/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.mobileNumber = "Please enter a valid 10-digit Indian mobile number.";
    }

    if (isCustomInstitution) {
      if (!customInstitutionName.trim() || customInstitutionName.trim().length < 2) {
        errors.college = "Please enter your institution or hospital name.";
      }
    } else {
      if (!selectedCollegeId) {
        errors.college = "Please search and select your medical college, or check 'Institution not listed'.";
      }
    }

    if (!state) {
      errors.state = "Please select your state.";
    }

    if (!district.trim()) {
      errors.district = "District is required.";
    }

    if (!city.trim()) {
      errors.city = "City is required.";
    }

    if (!/^\d{6}$/.test(pinCode.trim())) {
      errors.pinCode = "Please enter a valid 6-digit PIN code.";
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    // Prepare payload
    const payload = {
      fullName: fullName.trim(),
      email: verifiedEmail.trim(),
      mobileNumber: cleanMobile,
      learnerCategory,
      collegeId: isCustomInstitution ? null : selectedCollegeId,
      institutionName: isCustomInstitution ? customInstitutionName.trim() : selectedCollegeName,
      state,
      district: district.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
      mbbsYear: learnerCategory === "MBBS_STUDENT" ? mbbsYear : null,
      departmentDesignation: learnerCategory !== "MBBS_STUDENT" ? departmentDesignation.trim() || null : null,
    };

    try {
      setIsSubmittingProfile(true);
      const res = await fetch("/api/mbbs-foundation/learn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setProfileErrors(data.errors);
        }
        setGeneralError(data.message || "Registration failed. Please check the details provided.");
        return;
      }

      setPhase("success");
      const redirectParam = searchParams.get("redirect");
      const storedRedirect =
        typeof window !== "undefined"
          ? sessionStorage.getItem("mbbsf_learn_redirect")
          : null;
      const targetRedirect = redirectParam || storedRedirect;
      const safeDestination =
        targetRedirect &&
        targetRedirect.startsWith("/") &&
        !targetRedirect.startsWith("//")
          ? targetRedirect
          : "/mbbs-foundation/learn";

      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("mbbsf_learn_redirect");
        } catch {}
      }

      setTimeout(() => {
        router.push(safeDestination);
      }, 2000);
    } catch (err) {
      setGeneralError("Network connection error. Please try again.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // 8. Logout Handler for already signed-in user
  const handleLogout = async () => {
    try {
      await fetch("/api/mbbs-foundation/learn/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setPhase("send_email");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/mbbs-foundation/learn"
            className="flex items-center gap-2 text-slate-900 hover:text-red-800 transition-colors"
          >
            <span className="text-xl">🩺</span>
            <div>
              <span className="block text-xs font-black uppercase tracking-wider text-red-700">
                MBBS Foundation
              </span>
              <span className="block text-sm font-bold text-slate-950">
                Online Learning Programme
              </span>
            </div>
          </Link>
          <Link
            href="/mbbs-foundation/learn"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            &larr; Back to Curriculum
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
          {/* ============================================================== */}
          {/* STATE 0: ALREADY AUTHENTICATED                                 */}
          {/* ============================================================== */}
          {currentUser && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-950">
                You Are Signed In
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Signed in as <strong>{currentUser.fullName}</strong> ({currentUser.email}).
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/mbbs-foundation/learn"
                  className="rounded-xl bg-gradient-to-r from-red-700 to-rose-700 px-6 py-3 text-sm font-bold text-white shadow-md hover:from-red-800 hover:to-rose-800 transition-all text-center"
                >
                  Go to Learning Dashboard &rarr;
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STATE 1: SEND VERIFICATION EMAIL                               */}
          {/* ============================================================== */}
          {!currentUser && phase === "send_email" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
              <div className="text-center max-w-md mx-auto">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-800 uppercase tracking-wider">
                  <span>🔐</span> Passwordless Authentication
                </div>
                <h1 className="mt-4 text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Learner Registration &amp; Sign In
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Enter your email address to receive a single-use verification link.
                  New learners can complete their profile; returning learners log in instantly.
                </p>
              </div>

              <form onSubmit={handleSendVerification} className="mt-8 max-w-md mx-auto space-y-4">
                <div>
                  <label htmlFor="learner-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="learner-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. yourname@college.edu"
                    disabled={isSendingEmail}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 text-sm transition-all"
                  />
                </div>

                {emailError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 flex items-start gap-2">
                    <span className="text-red-600 font-bold">!</span>
                    <span>{emailError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white font-bold py-3.5 px-6 shadow-md transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSendingEmail ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Sending verification link...</span>
                    </>
                  ) : (
                    <span>Send Verification Link &rarr;</span>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 max-w-md mx-auto">
                <p>
                  No password required. A single-use verification link valid for <strong>15 minutes</strong> will be sent to your inbox.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STATE 2: EMAIL SENT CONFIRMATION                               */}
          {/* ============================================================== */}
          {!currentUser && phase === "email_sent" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-sm text-center max-w-md mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-950">
                Check Your Inbox
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We sent a secure single-use verification link to:
              </p>
              <div className="mt-2 font-bold text-slate-900 bg-slate-100 rounded-lg py-1.5 px-3 inline-block text-sm">
                {emailSentTarget}
              </div>

              <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 text-left space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <span>⏱</span> Link valid for 15 minutes
                </div>
                <p>
                  Click the link inside the email to verify your address. If you do not see it within a minute, please check your spam or promotions folder.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isSendingEmail}
                  onClick={handleSendVerification}
                  className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 py-3 px-4 text-xs font-bold text-slate-800 transition-colors disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Resend Verification Email"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase("send_email");
                    setEmailError(null);
                  }}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STATE 3: COMPLETE PROFILE REGISTRATION FORM                    */}
          {/* ============================================================== */}
          {!currentUser && phase === "register_profile" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span>✓</span> Email Verified
                </div>
                <h1 className="mt-3 text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Complete Your Learner Profile
                </h1>
                <p className="mt-1.5 text-sm text-slate-600">
                  Please provide your academic and professional details to access learning modules and certificates.
                </p>
              </div>

              {generalError && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800">
                  <strong>Registration Error:</strong> {generalError}
                </div>
              )}

              <form onSubmit={handleSubmitProfile} className="space-y-6">
                {/* 1. Full Name */}
                <div>
                  <label htmlFor="reg-fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name (as it should appear on certificates) *
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Aryan Verma"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 text-sm"
                  />
                  {profileErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">{profileErrors.fullName}</p>
                  )}
                </div>

                {/* 2. Verified Email (Read-Only) */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Verified Email Address (Read-only)
                  </label>
                  <div className="relative">
                    <input
                      id="reg-email"
                      type="email"
                      readOnly
                      value={verifiedEmail}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 text-sm font-semibold cursor-not-allowed pr-28"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <span>✓</span> Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Mobile Number */}
                <div>
                  <label htmlFor="reg-mobile" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100">
                    <span className="bg-slate-100 px-3.5 py-3 text-xs font-bold text-slate-600 border-r border-slate-200 flex items-center">
                      +91
                    </span>
                    <input
                      id="reg-mobile"
                      type="tel"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3 text-slate-900 focus:outline-none text-sm"
                    />
                  </div>
                  {profileErrors.mobileNumber && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">{profileErrors.mobileNumber}</p>
                  )}
                </div>

                {/* 4. Learner Category */}
                <div>
                  <label htmlFor="reg-category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Learner Category *
                  </label>
                  <select
                    id="reg-category"
                    value={learnerCategory}
                    onChange={(e) => setLearnerCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 text-sm bg-white"
                  >
                    {VALID_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Conditional: MBBS Year (if student) */}
                {learnerCategory === "MBBS_STUDENT" && (
                  <div className="rounded-xl bg-red-50/50 border border-red-100 p-4">
                    <label htmlFor="reg-year" className="block text-xs font-bold uppercase tracking-wider text-red-900 mb-1.5">
                      MBBS Academic Year *
                    </label>
                    <select
                      id="reg-year"
                      value={mbbsYear}
                      onChange={(e) => setMbbsYear(e.target.value)}
                      className="w-full rounded-xl border border-red-200 px-4 py-3 text-slate-900 focus:border-red-600 focus:outline-none text-sm bg-white"
                    >
                      {MBBS_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 6. Conditional: Department / Designation (if doctor/faculty) */}
                {learnerCategory !== "MBBS_STUDENT" && (
                  <div className="rounded-xl bg-purple-50/50 border border-purple-100 p-4">
                    <label htmlFor="reg-dept" className="block text-xs font-bold uppercase tracking-wider text-purple-900 mb-1.5">
                      Department / Clinical Designation (Optional)
                    </label>
                    <input
                      id="reg-dept"
                      type="text"
                      value={departmentDesignation}
                      onChange={(e) => setDepartmentDesignation(e.target.value)}
                      placeholder="e.g. Department of Medicine / Assistant Professor"
                      className="w-full rounded-xl border border-purple-200 px-4 py-3 text-slate-900 focus:border-purple-600 focus:outline-none text-sm bg-white"
                    />
                  </div>
                )}

                {/* 7. Medical College Search / Selection */}
                <div ref={collegeDropdownRef} className="relative">
                  <label htmlFor="reg-college-search" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Medical College / Institution *
                  </label>

                  {!isCustomInstitution ? (
                    <div>
                      <div className="relative">
                        <input
                          id="reg-college-search"
                          type="text"
                          value={collegeSearchQuery}
                          onChange={(e) => {
                            setCollegeSearchQuery(e.target.value);
                            setSelectedCollegeId(null);
                            setSelectedCollegeName("");
                          }}
                          onFocus={() => {
                            if (collegeSearchResults.length > 0) setIsCollegeDropdownOpen(true);
                          }}
                          placeholder="Search medical college name..."
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 text-sm pr-10"
                        />
                        {isSearchingColleges && (
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Dropdown Results */}
                      {isCollegeDropdownOpen && collegeSearchResults.length > 0 && (
                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg border border-slate-200 text-sm">
                          {collegeSearchResults.map((col) => (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => handleSelectCollege(col)}
                              className="w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-900 transition-colors border-b border-slate-100 last:border-b-0"
                            >
                              <div className="font-semibold text-slate-900">{col.collegeName}</div>
                              <div className="text-xs text-slate-500">
                                {col.city ? `${col.city}, ` : ""}
                                {col.state || ""}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedCollegeId && (
                        <p className="mt-1 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <span>✓ Selected:</span> {selectedCollegeName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        required
                        value={customInstitutionName}
                        onChange={(e) => setCustomInstitutionName(e.target.value)}
                        placeholder="Enter full hospital / institution name"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 text-sm"
                      />
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="custom-inst-check"
                      type="checkbox"
                      checked={isCustomInstitution}
                      onChange={(e) => {
                        setIsCustomInstitution(e.target.checked);
                        setSelectedCollegeId(null);
                        setSelectedCollegeName("");
                        setCollegeSearchQuery("");
                      }}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <label htmlFor="custom-inst-check" className="text-xs text-slate-600 cursor-pointer">
                      My medical college or hospital is not listed
                    </label>
                  </div>
                  {profileErrors.college && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">{profileErrors.college}</p>
                  )}
                </div>

                {/* 8. Location Grid: State, District, City, PIN Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label htmlFor="reg-state" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      State / UT *
                    </label>
                    <select
                      id="reg-state"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-900 focus:border-red-600 focus:outline-none text-sm bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES_AND_UTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {profileErrors.state && (
                      <p className="mt-1 text-xs text-red-600 font-semibold">{profileErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-district" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      District *
                    </label>
                    <input
                      id="reg-district"
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Central Delhi"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-900 focus:border-red-600 focus:outline-none text-sm"
                    />
                    {profileErrors.district && (
                      <p className="mt-1 text-xs text-red-600 font-semibold">{profileErrors.district}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      City *
                    </label>
                    <input
                      id="reg-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-900 focus:border-red-600 focus:outline-none text-sm"
                    />
                    {profileErrors.city && (
                      <p className="mt-1 text-xs text-red-600 font-semibold">{profileErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-pincode" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      id="reg-pincode"
                      type="text"
                      required
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit PIN code"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-900 focus:border-red-600 focus:outline-none text-sm"
                    />
                    {profileErrors.pinCode && (
                      <p className="mt-1 text-xs text-red-600 font-semibold">{profileErrors.pinCode}</p>
                    )}
                  </div>
                </div>

                {/* Submit Profile Button */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="w-full rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white font-bold py-3.5 px-6 shadow-md transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmittingProfile ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Registering your learner profile...</span>
                      </>
                    ) : (
                      <span>Complete Registration &amp; Access Dashboard &rarr;</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* STATE 4: SUCCESS CONFIRMATION                                  */}
          {/* ============================================================== */}
          {phase === "success" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-sm text-center max-w-md mx-auto">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">
                Registration Complete!
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Your MBBS Foundation learning profile is ready. Welcome to the programme!
              </p>
              <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
                Redirecting to your Learning Dashboard...
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center font-bold text-slate-600 text-sm">
            Loading MBBS Foundation learner portal...
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
