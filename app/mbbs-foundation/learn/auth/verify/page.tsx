"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyTokenContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "authenticated" | "needs_registration" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [learnerName, setLearnerName] = useState<string>("");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [redirectTarget, setRedirectTarget] = useState<string>("");

  // Persist the extracted token and redirect destination across React Strict Mode double-invoke.
  // tokenRef: captures the query-param value before the URL is wiped.
  // redirectRef: captures destination before search params are wiped.
  // submittedRef: ensures the single-use token is submitted exactly once.
  const tokenRef = useRef<string | null>(null);
  const redirectRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    // 1. Extract raw token & redirect from query params (only on first encounter)
    if (tokenRef.current === null) {
      tokenRef.current = searchParams.get("token") || "";
    }
    if (redirectRef.current === null) {
      const storedRedirect =
        typeof window !== "undefined"
          ? sessionStorage.getItem("mbbsf_learn_redirect")
          : null;
      redirectRef.current = searchParams.get("redirect") || storedRedirect || "";
    }

    const token = tokenRef.current;

    // 2. Security requirement: Immediately wipe the token from browser URL & history
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!token || !token.trim()) {
      setStatus("error");
      setErrorMessage("Missing or invalid verification link. Please request a new verification email.");
      return;
    }

    // 3. Gate: only fire the fetch once (the token is single-use).
    //    In Strict Mode the first run starts the fetch and sets the gate;
    //    the second run sees the gate and skips — but the first fetch is
    //    never cancelled, so its response still updates state normally.
    if (submittedRef.current) return;
    submittedRef.current = true;

    const validToken = token.trim();

    // 4. Call server-side verification API (no cancellation — must complete)
    async function verifyToken(authToken: string) {
      try {
        const response = await fetch("/api/mbbs-foundation/learn/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: authToken }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setStatus("error");
          setErrorMessage(
            data.message || "This verification link is invalid, expired, or has already been used."
          );
          return;
        }

        // Extract intended redirect destination (from ref or sessionStorage)
        const storedRedirect =
          typeof window !== "undefined"
            ? sessionStorage.getItem("mbbsf_learn_redirect")
            : null;
        const rawRedirect = redirectRef.current || storedRedirect;
        const safeDestination =
          rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
            ? rawRedirect
            : "/mbbs-foundation/learn";

        // Returning Learner -> Direct login
        if (data.status === "AUTHENTICATED") {
          setStatus("authenticated");
          setLearnerName(data.user?.fullName || "Learner");
          setRedirectTarget(safeDestination);
          if (typeof window !== "undefined") {
            try { sessionStorage.removeItem("mbbsf_learn_redirect"); } catch {}
          }
          return;
        }

        // New Learner -> Needs profile registration
        if (data.status === "REGISTRATION_REQUIRED") {
          setStatus("needs_registration");
          setVerifiedEmail(data.email || "");
          const registerTarget = `/mbbs-foundation/learn/register?verified=1&email=${encodeURIComponent(
            data.email || ""
          )}${safeDestination !== "/mbbs-foundation/learn" ? `&redirect=${encodeURIComponent(safeDestination)}` : ""}`;
          setRedirectTarget(registerTarget);
          return;
        }

        setStatus("error");
        setErrorMessage("Unexpected response from verification service. Please try again.");
      } catch (err) {
        setStatus("error");
        setErrorMessage("Network error verifying your credentials. Please check your internet connection.");
      }
    }

    verifyToken(validToken);
    // No cleanup — the single-use token request must always complete.
  }, [searchParams]);

  // 5. Dedicated automatic navigation effect:
  // Uses window.location.assign for a clean, guaranteed top-level browser navigation
  // that preserves HttpOnly cookies (session token or registration ticket) and
  // remains completely unaffected by React Strict Mode or client router history desync.
  useEffect(() => {
    if (!redirectTarget) return;

    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.assign(redirectTarget);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [redirectTarget]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link
          href="/mbbs-foundation/learn"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-800 hover:text-red-900 transition-colors"
        >
          <span>&larr;</span> MBBS Foundation Online Learning
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10 text-center">
          {/* STATE 1: LOADING */}
          {status === "loading" && (
            <div className="py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700 animate-spin">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Verifying your email...
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Please wait a moment while we validate your secure single-use verification link.
              </p>
            </div>
          )}

          {/* STATE 2: RETURNING LEARNER AUTHENTICATED */}
          {status === "authenticated" && (
            <div className="py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">
                Welcome Back, {learnerName}!
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Your email has been successfully verified and your session is active.
              </p>
              <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
                Redirecting to your Learning Dashboard...
              </div>
              <div className="mt-4">
                <a
                  href={redirectTarget || "/mbbs-foundation/learn"}
                  className="text-xs font-bold text-red-700 hover:text-red-800 underline"
                >
                  Click here if you are not redirected automatically
                </a>
              </div>
            </div>
          )}

          {/* STATE 3: NEW LEARNER REGISTRATION REQUIRED */}
          {status === "needs_registration" && (
            <div className="py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">
                Email Verified!
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                <strong>{verifiedEmail}</strong> has been verified. Let&apos;s complete your learner registration profile.
              </p>
              <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-semibold text-blue-800">
                Redirecting to registration form...
              </div>
              <div className="mt-4">
                <a
                  href={
                    redirectTarget ||
                    `/mbbs-foundation/learn/register?verified=1&email=${encodeURIComponent(verifiedEmail)}`
                  }
                  className="text-xs font-bold text-red-700 hover:text-red-800 underline"
                >
                  Click here if you are not redirected automatically
                </a>
              </div>
            </div>
          )}

          {/* STATE 4: ERROR / EXPIRED / INVALID */}
          {status === "error" && (
            <div className="py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-950">
                Verification Failed
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {errorMessage}
              </p>
              <div className="mt-6">
                <Link
                  href="/mbbs-foundation/learn/register"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-800 transition-colors"
                >
                  Request a New Verification Link &rarr;
                </Link>
              </div>
              <div className="mt-3">
                <Link
                  href="/mbbs-foundation/learn"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Return to Learning Programme
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center font-bold text-slate-600 text-sm">
            Loading verification service...
          </div>
        </div>
      }
    >
      <VerifyTokenContent />
    </Suspense>
  );
}
