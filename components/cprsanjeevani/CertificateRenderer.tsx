"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import JSZip from "jszip";

export interface CertificateItem {
  id: string;
  certificateId: string;
  sequenceNumber: number;
  stateCode: string;
  participantName: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  courseCoordinator?: string;
  category?: string;
  svg: string;
  pdfFilename: string;
  pngFilename: string;
  svgFilename?: string;
}

/**
 * Renders an SVG string onto an offscreen HTML5 Canvas and returns high-res data URL.
 */
export async function svgToPngDataUrl(svgString: string, scale: number = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const width = 2970 * (scale / 2); // Standard A4 ratio
        const height = 2100 * (scale / 2);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Could not create 2D canvas context"));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL("image/png", 0.95);
        resolve(pngUrl);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Generates a high-quality A4 Landscape PDF from an SVG string.
 */
export async function generateCertificatePdf(svgString: string): Promise<jsPDF> {
  const pngDataUrl = await svgToPngDataUrl(svgString, 2.5); // High-res 2.5x
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4", // 297 x 210 mm
    compress: true,
  });

  doc.addImage(pngDataUrl, "PNG", 0, 0, 297, 210, undefined, "FAST");
  return doc;
}

/**
 * Downloads a single certificate as PDF.
 */
export async function downloadCertificatePdf(item: CertificateItem) {
  const doc = await generateCertificatePdf(item.svg);
  doc.save(item.pdfFilename || `${item.certificateId.replace(/\//g, "-")}.pdf`);
}

/**
 * Downloads a single certificate as PNG.
 */
export async function downloadCertificatePng(item: CertificateItem) {
  const pngUrl = await svgToPngDataUrl(item.svg, 2.5);
  const a = document.createElement("a");
  a.href = pngUrl;
  a.download = item.pngFilename || `${item.certificateId.replace(/\//g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Generates a ZIP file containing all certificates as individual PDFs with canonical filenames.
 */
export async function downloadAllCertificatesZip(
  items: CertificateItem[],
  zipFilename: string = "IAP_CPR_Sanjeevani_Certificates.zip",
  onProgress?: (current: number, total: number) => void
) {
  const zip = new JSZip();
  const folder = zip.folder("IAP_CPR_Sanjeevani_Certificates") || zip;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, items.length);
    }

    try {
      const doc = await generateCertificatePdf(item.svg);
      const pdfArrayBuffer = doc.output("arraybuffer");
      folder.file(item.pdfFilename, pdfArrayBuffer);
    } catch (err) {
      console.error(`Failed to add PDF for ${item.certificateId}:`, err);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

interface CertificatePreviewModalProps {
  item: CertificateItem | null;
  onClose: () => void;
}

export function CertificatePreviewModal({ item, onClose }: CertificatePreviewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [svgContent, setSvgContent] = useState<string>(item?.svg || "");
  const [loadingSvg, setLoadingSvg] = useState<boolean>(!item?.svg);

  useEffect(() => {
    if (item && !item.svg) {
      setLoadingSvg(true);
      fetch(`/api/cprsanjeevani/certificates?id=${encodeURIComponent(item.certificateId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.certificate?.svg) {
            setSvgContent(data.certificate.svg);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSvg(false));
    } else if (item?.svg) {
      setSvgContent(item.svg);
      setLoadingSvg(false);
    }
  }, [item]);

  if (!item) return null;

  const currentItem = { ...item, svg: svgContent };

  const handleDownloadPdf = async () => {
    if (!svgContent) return;
    setDownloading(true);
    try {
      await downloadCertificatePdf(currentItem);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!svgContent) return;
    setDownloading(true);
    try {
      await downloadCertificatePng(currentItem);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download PNG. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[96vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-800 uppercase tracking-wider">
                  IAP CPR Sanjeevani
                </span>
                <span className="font-mono text-xs font-bold text-slate-600">
                  {item.certificateId}
                </span>
                <span className="hidden sm:inline-block rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  📐 A4 Landscape (297 × 210 mm)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate max-w-md sm:max-w-lg">
                {item.participantName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Certificate Display Area - Fitted Dimensions */}
        <div className="relative flex-1 overflow-hidden p-2 sm:p-5 bg-slate-900/10 flex items-center justify-center min-h-[250px] max-h-[calc(88vh-140px)]">
          <div className="relative w-full max-w-4xl max-h-[calc(86vh-160px)] aspect-[297/210] rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-300 flex items-center justify-center">
            {svgContent ? (
              <div
                className="w-full h-full flex items-center justify-center certificate-preview-container [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:object-contain [&_svg]:block"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <span className="animate-spin text-2xl">⏳</span>
                <p className="mt-2 text-sm font-semibold">{loadingSvg ? "Loading certificate vector..." : "Certificate preview unavailable."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3.5">
          <div className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">
            <strong>Filename:</strong> <code className="font-mono text-slate-700 font-bold">{item.pdfFilename}</code>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloading || !svgContent}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
            >
              🖼️ Download PNG
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading || !svgContent}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-teal-800 shadow-md transition disabled:opacity-50"
            >
              {downloading ? "Rendering PDF..." : "📥 Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
