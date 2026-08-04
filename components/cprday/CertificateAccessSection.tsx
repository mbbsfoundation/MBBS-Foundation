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
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);

  const sampleIds = ["IAPCPR/PA/HP/0101", "IAPCPR/PA/HP/0102", "IAPCPR/PA/HP/0103"];

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
            Enter your unique Certificate ID below to view, verify, and download your official CPR Sanjeevani certificate.
          </p>
        </div>

        {/* Certificate Access Form */}
        <div className="mt-8 sm:mt-10 rounded-2xl sm:rounded-3xl border border-purple-200/80 bg-white p-4 sm:p-8 shadow-xl">
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
