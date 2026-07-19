"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
          National IAP CPR Day 2026
        </p>

        <h1 className="mt-3 text-center text-3xl font-bold text-slate-900">
          Reset Password
        </h1>

        <p className="mt-3 text-center leading-7 text-slate-600">
          Enter your registered email address. Password-reset email delivery
          will be enabled shortly.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-800">
              Request received.
            </p>

            <p className="mt-2 text-sm leading-6 text-emerald-700">
              If an account exists with this email address, password-reset
              instructions will be sent when email delivery is enabled.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Registered Email Address
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-sky-700 py-3 font-semibold text-white transition hover:bg-sky-800"
            >
              Request Password Reset
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/cprday/login"
            className="text-sm font-semibold text-sky-700 hover:text-sky-800 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}