"use client";

import React, { useState } from "react";
import {
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/components/cprsanjeevani/CertificateRenderer";

/**
 * Extracts the Google Drive File ID from any Drive share/view/preview link.
 */
function extractGoogleDriveFileId(url: string): string {
  if (!url) return "";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

export interface UniversalCertificateData {
  certificateNumber: string;
  participantName: string;
  courseTitle?: string;
  venueName?: string;
  city?: string;
  state?: string;
  issueDate?: string;
  category?: string;
  svg?: string;
  driveLink?: string;
  previewUrl?: string;
  downloadUrl?: string;
  pdfFilename?: string;
  pngFilename?: string;
  svgFilename?: string;
  courseCoordinator?: string;
  status?: string;
}

interface UniversalCertificatePreviewModalProps {
  certificate: UniversalCertificateData | null;
  onClose: () => void;
}

export default function UniversalCertificatePreviewModal({
  certificate,
  onClose,
}: UniversalCertificatePreviewModalProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "png" | null>(null);
  const [iframeError, setIframeError] = useState(false);

  if (!certificate) return null;

  const isDriveHosted = Boolean(certificate.driveLink && !certificate.svg);
  const driveFileId = certificate.driveLink ? extractGoogleDriveFileId(certificate.driveLink) : "";
  const embedDriveUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/preview`
    : certificate.previewUrl || certificate.driveLink || "";

  const directDownloadUrl = driveFileId
    ? `https://drive.google.com/uc?export=download&id=${driveFileId}`
    : certificate.downloadUrl || certificate.driveLink || "#";

  // Category badge style
  const categoryLabel = certificate.category || "CPR Lay Rescuer";

  const handleDownloadPdf = async () => {
    if (!certificate.svg) return;
    setDownloadingFormat("pdf");
    try {
      await downloadCertificatePdf({
        id: certificate.certificateNumber,
        certificateId: certificate.certificateNumber,
        sequenceNumber: 0,
        stateCode: certificate.state || "",
        participantName: certificate.participantName,
        date: certificate.issueDate || "21 July 2026",
        venue: certificate.venueName || "",
        city: certificate.city || "",
        state: certificate.state || "",
        courseCoordinator: certificate.courseCoordinator,
        category: certificate.category,
        svg: certificate.svg,
        pdfFilename:
          certificate.pdfFilename ||
          `${certificate.certificateNumber.replace(/\//g, "-")}_${certificate.participantName.replace(/\s+/g, "-")}.pdf`,
        pngFilename:
          certificate.pngFilename ||
          `${certificate.certificateNumber.replace(/\//g, "-")}_${certificate.participantName.replace(/\s+/g, "-")}.png`,
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to render PDF certificate. Please try again.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadPng = async () => {
    if (!certificate.svg) return;
    setDownloadingFormat("png");
    try {
      await downloadCertificatePng({
        id: certificate.certificateNumber,
        certificateId: certificate.certificateNumber,
        sequenceNumber: 0,
        stateCode: certificate.state || "",
        participantName: certificate.participantName,
        date: certificate.issueDate || "21 July 2026",
        venue: certificate.venueName || "",
        city: certificate.city || "",
        state: certificate.state || "",
        courseCoordinator: certificate.courseCoordinator,
        category: certificate.category,
        svg: certificate.svg,
        pdfFilename:
          certificate.pdfFilename ||
          `${certificate.certificateNumber.replace(/\//g, "-")}_${certificate.participantName.replace(/\s+/g, "-")}.pdf`,
        pngFilename:
          certificate.pngFilename ||
          `${certificate.certificateNumber.replace(/\//g, "-")}_${certificate.participantName.replace(/\s+/g, "-")}.png`,
      });
    } catch (err) {
      console.error("Error downloading PNG:", err);
      alert("Failed to render PNG certificate. Please try again.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[96vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-black text-purple-900 uppercase tracking-wider">
                  {categoryLabel}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">
                  {certificate.certificateNumber}
                </span>
                <span className="hidden sm:inline-block rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  📐 A4 Landscape (297 × 210 mm)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate max-w-md sm:max-w-lg">
                {certificate.participantName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Certificate Display Area - Standard A4 Landscape Container */}
        <div className="relative flex-1 overflow-hidden p-2 sm:p-5 bg-slate-900/10 flex items-center justify-center min-h-[260px] max-h-[calc(88vh-140px)]">
          <div className="relative w-full max-w-4xl max-h-[calc(86vh-160px)] aspect-[297/210] rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-300 flex items-center justify-center">
            {certificate.svg ? (
              <div
                className="w-full h-full flex items-center justify-center certificate-preview-container [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:object-contain [&_svg]:block"
                dangerouslySetInnerHTML={{ __html: certificate.svg }}
              />
            ) : isDriveHosted && embedDriveUrl ? (
              <div className="w-full h-full relative flex flex-col items-center justify-center bg-slate-100">
                {!iframeError ? (
                  <iframe
                    src={embedDriveUrl}
                    title={`Certificate Preview - ${certificate.participantName}`}
                    className="w-full h-full border-0 rounded-lg"
                    allow="autoplay"
                    loading="lazy"
                    onError={() => setIframeError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="text-4xl">📄</div>
                    <p className="text-sm font-bold text-slate-800">
                      Official Certificate Document
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Inline browser embedding was blocked by the browser. Click below to view or download your verified certificate file.
                    </p>
                    <a
                      href={directDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-purple-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-800 transition inline-flex items-center gap-2"
                    >
                      📥 Download Certificate
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <span className="text-3xl">📄</span>
                <p className="mt-2 text-sm font-semibold">Certificate vector or Drive source unavailable.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3.5 shrink-0">
          <div className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">
            <strong>Format:</strong> High-Resolution Print Ready A4
          </div>

          <div className="flex items-center gap-2.5">
            {certificate.svg ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={downloadingFormat === "png"}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {downloadingFormat === "png" ? "Rendering..." : "🖼️ Download PNG"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingFormat === "pdf"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-900 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-purple-800 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {downloadingFormat === "pdf" ? "Rendering PDF..." : "📥 Download PDF"}
                </button>
              </>
            ) : isDriveHosted ? (
              <a
                href={directDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 shadow-md transition cursor-pointer"
              >
                📥 Download Certificate
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
