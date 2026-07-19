"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CoordinatorSignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cprday/coordinator/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          mobileNumber,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        setLoading(false);
        return;
      }

      router.push("/cprday/my-venues");
    } catch {
      setMessage("Unable to create account.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-8">

        <h1 className="text-3xl font-bold text-center">
          Create Coordinator Account
        </h1>

        <p className="text-center text-slate-600 mt-2">
          National IAP CPR Day 2026
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 mt-8"
        >

          <div>
            <label className="block mb-2 text-sm font-medium">
              Full Name
            </label>

            <input
              required
              className="w-full rounded-lg border p-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Mobile Number
            </label>

            <input
              className="w-full rounded-lg border p-3"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Email Address
            </label>

            <input
              type="email"
              required
              className="w-full rounded-lg border p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              required
              className="w-full rounded-lg border p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && (
            <div className="rounded-lg bg-red-100 p-3 text-red-700">
              {message}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-sky-700 py-3 text-white font-semibold hover:bg-sky-800 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/cprday/login"
            className="font-semibold text-sky-700"
          >
            Sign In
          </Link>
        </p>

      </div>
    </main>
  );
}