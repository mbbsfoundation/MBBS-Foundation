import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicReviveCertificate, getModuleLogoConfig } from "@/lib/mbbs-foundation/reviveCertificateService";
import { QrCode } from "@/lib/mbbs-foundation/qr";

interface VerifyPageProps {
  params: Promise<{ certificateId: string }>;
}

export default async function CertificateVerificationPage({ params }: VerifyPageProps) {
  const { certificateId } = await params;
  const cert = await getPublicReviveCertificate(certificateId);

  if (!cert) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="h-14 w-14 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto text-2xl font-black">
            ✕
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Certificate Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            No valid academic credential was found matching the identifier{" "}
            <span className="font-mono font-bold text-slate-800 break-all">{certificateId}</span>.
          </p>
          <div className="pt-2">
            <Link
              href="/mbbs-foundation/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-5 py-2.5 text-xs sm:text-sm hover:bg-slate-800 transition"
            >
              &larr; Return to Learning Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Generate working QR SVG representation
  const verificationUrl = `https://mbbsfoundation.com/mbbs-foundation/learn/verify/${cert.certificateId}`;
  const qr = QrCode.encodeText(verificationUrl, "M");
  const qrSvg = qr.toSvg();
  const logoConfig = getModuleLogoConfig(cert.moduleCode || "REVIVE");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            href="/mbbs-foundation"
            className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-teal-800 transition"
          >
            <span>MBBS Foundation</span>
            <span className="text-slate-400 font-normal">/</span>
            <span className="text-teal-700 font-semibold">Credential Verification</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Verified Credential
          </span>
        </div>
      </header>

      {/* Main Verification Document */}
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Status Ribbon */}
          <div className="bg-emerald-700 text-white px-6 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Authentic Certificate of Module Completion</span>
            </div>
            <span className="font-mono text-emerald-100 text-xs tracking-wider">
              {cert.certificateId}
            </span>
          </div>

          {/* Certificate Credential Canvas */}
          <div className="relative p-6 sm:p-10 space-y-6 bg-[#fdfdfc] overflow-hidden">
            {/* Dedicated Central Watermark (MBBS Foundation Watermark ~5% opacity) */}
            <img
              src="/MBBS%20Foundation%20watermark.png"
              alt=""
              aria-hidden="true"
              className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 md:w-[380px] opacity-[0.05] pointer-events-none select-none object-contain z-0"
            />

            {/* Symmetrical Three-Column Header Row */}
            <div className="relative z-10 flex items-center justify-between gap-4 pb-2 border-b border-slate-100 sm:border-0 sm:pb-0">
              {/* LEFT: Official MBBS Foundation horizontal logo */}
              <div className="shrink-0 w-32 sm:w-40 md:w-44 flex items-center justify-start">
                <img
                  src="/MBBS%20Foundation%20Logo.png"
                  alt="MBBS Foundation"
                  className="w-full h-auto max-h-10 sm:max-h-12 object-contain"
                />
              </div>

              {/* CENTRE: Institutional Branding (2 Lines) */}
              <div className="text-center space-y-0.5 flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-slate-800">
                  {cert.organization}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-slate-500">
                  ONLINE LEARNING PROGRAMME
                </div>
              </div>

              {/* RIGHT: Combined Collaborating Organization Logo */}
              <div className="shrink-0 w-24 sm:w-28 md:w-32 flex items-center justify-end">
                {logoConfig.collaboratingOrgLogo ? (
                  <img
                    src={logoConfig.collaboratingOrgLogo.webPath}
                    alt={logoConfig.collaboratingOrgLogo.alt}
                    className="w-full h-auto max-h-10 sm:max-h-12 object-contain"
                  />
                ) : (
                  <div className="w-10 sm:w-12 h-10 sm:h-12" />
                )}
              </div>
            </div>

            {/* Full-Width Centered Title (Below Header Row) */}
            <div className="relative z-10 text-center pt-2 sm:pt-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-slate-950 tracking-tight">
                {cert.certificateTitle}
              </h1>
            </div>

            {/* Recipient Info */}
            <div className="relative z-10 text-center space-y-1.5 max-w-xl mx-auto py-1">
              <p className="text-xs sm:text-sm text-slate-500 font-serif italic">
                This is to certify that
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 tracking-normal border-b border-slate-200 pb-2">
                {cert.learnerName}
              </h2>
              {/* Medical College displayed immediately below name */}
              <p className="text-sm sm:text-base font-semibold text-slate-800 pt-1">
                from {cert.medicalCollege}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900 pt-2.5">
                has successfully completed Module 7 — REVIVE
              </p>
              <p className="text-base sm:text-lg font-bold text-teal-900 pt-0.5">
                {cert.moduleTitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 font-serif italic pt-1.5 leading-relaxed">
                through online educational presentations from the MBBS Foundation Series, instructional videos by the IAP ALS–BLS Group, and successful completion of the module&apos;s online knowledge assessment.
              </p>
            </div>

            {/* Coloured Module Progress Strip (14 Modules) */}
            <div className="relative z-10 py-1 text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((m) => {
                  const isCompletedRevive = m === 7;
                  const pastels = [
                    "bg-sky-50 border-sky-200 text-slate-500",
                    "bg-emerald-50/60 border-emerald-200 text-slate-500",
                    "bg-purple-50/70 border-purple-200 text-slate-500",
                    "bg-amber-50/70 border-amber-200 text-slate-500",
                  ];
                  const neutralStyle = pastels[(m - 1) % pastels.length];

                  if (isCompletedRevive) {
                    return (
                      <div
                        key={m}
                        className="flex items-center justify-center gap-0.5 w-6 sm:w-7 h-5 sm:h-6 rounded-md bg-emerald-100 border border-emerald-600 text-emerald-800 font-bold text-[10px] sm:text-xs shadow-2xs"
                        title="Module 7: REVIVE — Completed"
                      >
                        <span className="text-[9px] sm:text-[10px] leading-none">✓</span>
                        <span>7</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m}
                      className={`flex items-center justify-center w-6 sm:w-7 h-5 sm:h-6 rounded-md border font-medium text-[10px] sm:text-xs ${neutralStyle}`}
                      title={`Module ${m}`}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-teal-800/80 mt-1 tracking-tight">
                Module 7 of 14 — REVIVE completed
              </p>
            </div>

            {/* Approved Knowledge Assessment Disclaimer */}
            <div className="relative z-10 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-center">
              <p className="text-xs text-slate-600 italic font-serif leading-relaxed">
                &ldquo;{cert.disclaimer}&rdquo;
              </p>
            </div>

            {/* Bottom Institutional Attribution & QR Row (Strictly ABOVE Endorsement Area) */}
            <div className="relative z-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
              {/* QR Code Container */}
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <div className="text-left text-xs">
                  <div className="font-mono font-bold text-slate-800">
                    {cert.certificateId}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date of Issuance: {cert.completionDate}
                  </div>
                  <div className="text-[10px] text-teal-800 font-semibold">
                    Cryptographically Verified
                  </div>
                </div>
              </div>

              {/* Attribution */}
              <div className="text-center sm:text-right space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wider">
                  {cert.organization}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-600 font-medium">
                  {cert.initiative}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-700 font-semibold">
                  {cert.association}
                </div>
              </div>
            </div>

            {/* Institutional CPR Awareness Practice Session Area */}
            <div className="relative z-10 rounded-xl border border-slate-300 bg-slate-50/70 p-4 sm:p-5 text-left space-y-3">
              <div className="border-b border-slate-200 pb-2 text-center">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-900 uppercase">
                  INSTITUTIONAL CPR AWARENESS PRACTICE SESSION
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-600 font-serif italic text-center leading-relaxed">
                This section may be completed by trained and authorized medical college faculty following a supervised hands-on CPR Awareness Session.
              </p>

              {/* Endorsement Fields Grid */}
              <div className="space-y-3 pt-1 text-xs">
                {/* Row 1 — Two Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                      Student Enrollment No.:
                    </span>
                    <div className="h-6 border-b border-dashed border-slate-400" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                      Supervising Faculty Name &amp; Designation:
                    </span>
                    <div className="h-6 border-b border-dashed border-slate-400" />
                  </div>
                </div>

                {/* Row 2 — Three Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                      Hands-on Session Date:
                    </span>
                    <div className="h-6 flex items-end text-slate-400 text-xs border-b border-dashed border-slate-400 pb-0.5">
                      DD / MM / 202___
                    </div>
                  </div>

                  <div className="sm:col-span-5 space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                      Faculty Signature:
                    </span>
                    <div className="h-6 border-b border-dashed border-slate-400" />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block text-center">
                      INSTITUTIONAL STAMP
                    </span>
                    <div className="border border-slate-300 rounded-lg h-9 bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-6">
          <Link
            href="/mbbs-foundation/learn/modules/revive"
            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition underline underline-offset-4"
          >
            &larr; View Module 7: REVIVE Curriculum
          </Link>
        </div>
      </main>
    </div>
  );
}

