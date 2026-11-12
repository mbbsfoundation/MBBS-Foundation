"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface RevivePdfSlideViewerProps {
  pdfUrl?: string;
  initialSlide?: number;
  maxAllowedSlides?: number;
  isGuestPreview?: boolean;
  onSlideChange?: (currentSlide: number, totalSlides: number) => void;
  onPreviewLimitReached?: () => void;
  className?: string;
}

export default function RevivePdfSlideViewer({
  pdfUrl = "/api/mbbs-foundation/learn/courseware/revive",
  initialSlide = 1,
  maxAllowedSlides,
  isGuestPreview = false,
  onSlideChange,
  onPreviewLimitReached,
  className = "",
}: RevivePdfSlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // PDF.js State
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [numPages, setNumPages] = useState<number>(isGuestPreview ? 20 : 53);
  const [currentSlide, setCurrentSlide] = useState<number>(initialSlide || 1);
  const [docLoading, setDocLoading] = useState<boolean>(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [jumpInput, setJumpInput] = useState<string>("");
  const [showJumpDialog, setShowJumpDialog] = useState<boolean>(false);

  // Sync initialSlide when prop changes (e.g. navigation with ?slide=21)
  useEffect(() => {
    if (initialSlide && initialSlide >= 1) {
      setCurrentSlide(initialSlide);
    }
  }, [initialSlide]);

  // 1. Initialize and load PDF Document with PDF.js
  useEffect(() => {
    let isMounted = true;
    setDocLoading(true);
    setDocError(null);

    async function loadPdfDocument() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        // Configure local worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: true,
          disableRange: false,
          rangeChunkSize: 256 * 1024,
          disableAutoFetch: false,
          cMapUrl: "/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setDocLoading(false);
        const startingSlide =
          initialSlide >= 1 && initialSlide <= doc.numPages ? initialSlide : 1;
        setCurrentSlide(startingSlide);
      } catch (err: any) {
        console.error("Failed to load PDF document:", err);
        if (isMounted) {
          setDocError(err?.message || "Failed to load masterclass presentation PDF.");
          setDocLoading(false);
        }
      }
    }

    loadPdfDocument();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
      }
    };
  }, [pdfUrl]);

  // 2. Render active slide page onto high-resolution canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      setIsRendering(true);

      // Cancel previous render task if still active
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDocRef.current.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        // High-DPI rendering for crisp typography and vector diagrams
        // Standard slide is 960x540. Scale factor of 2.0x gives 1920x1080 (Full HD).
        const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const renderScale = Math.min(Math.max(pixelRatio, 2.0), 3.0);

        const viewport = page.getViewport({ scale: renderScale });
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          intent: "display",
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
        setIsRendering(false);

        if (onSlideChange) {
          onSlideChange(pageNumber, pdfDocRef.current.numPages);
        }
      } catch (err: any) {
        // If cancelled, do nothing
        if (err?.name === "RenderingCancelledException") {
          return;
        }
        console.error("Slide render error:", err);
        setIsRendering(false);
      }
    },
    [onSlideChange]
  );

  // Trigger render whenever currentSlide changes or document loads
  useEffect(() => {
    if (!docLoading && pdfDocRef.current) {
      renderPage(currentSlide);
    }
  }, [currentSlide, docLoading, renderPage]);

  // Helper to trigger preview limit and gracefully exit fullscreen if active
  const triggerPreviewLimit = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    if (onPreviewLimitReached) {
      onPreviewLimitReached();
    }
  }, [onPreviewLimitReached]);

  // 3. Slide Navigation Handlers
  const goToNextSlide = useCallback(() => {
    const limit = maxAllowedSlides || numPages;
    if (isGuestPreview && currentSlide >= limit) {
      triggerPreviewLimit();
      return;
    }
    setCurrentSlide((prev) => Math.min(prev + 1, numPages));
  }, [isGuestPreview, currentSlide, maxAllowedSlides, numPages, triggerPreviewLimit]);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToSlide = useCallback(
    (slideNum: number) => {
      const limit = maxAllowedSlides || numPages;
      if (isGuestPreview && slideNum > limit) {
        triggerPreviewLimit();
        return;
      }
      if (slideNum >= 1 && slideNum <= numPages) {
        setCurrentSlide(slideNum);
      }
    },
    [isGuestPreview, maxAllowedSlides, numPages, triggerPreviewLimit]
  );

  // 4. Fullscreen Mode
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // 5. Keyboard Navigation (Left/Right Arrows, Space, F for Fullscreen)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === "Home") {
        e.preventDefault();
        goToSlide(1);
      } else if (e.key === "End") {
        e.preventDefault();
        const limit = maxAllowedSlides || numPages;
        goToSlide(limit);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, goToSlide, maxAllowedSlides, numPages, toggleFullscreen]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // 6. Mobile Touch Gesture Handling (Horizontal Swipes)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const diffY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Trigger if horizontal distance is > 45px and dominant over vertical
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swiped left -> next slide
        goToNextSlide();
      } else {
        // Swiped right -> previous slide
        goToPrevSlide();
      }
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      goToSlide(parsed);
      setShowJumpDialog(false);
      setJumpInput("");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex flex-col bg-slate-950 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-0 h-screen w-screen flex flex-col justify-between"
          : className
      }`}
    >
      {/* ---------------------------------------------------------------- */}
      {/* TOP BAR: Context, Slide Counter, Fullscreen & Controls           */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-slate-300 font-bold tracking-wide">
            REVIVE Masterclass
          </span>
        </div>

        {/* Slide Counter Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-bold text-slate-100">
            <span className="text-teal-400 font-extrabold">Slide {currentSlide}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-200">{numPages}</span>
            {isGuestPreview && (
              <span className="text-amber-300 font-semibold ml-1 text-xs sm:text-sm">
                · Preview
              </span>
            )}
          </div>

          {/* Jump to Slide Button */}
          <button
            type="button"
            onClick={() => setShowJumpDialog((prev) => !prev)}
            className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition"
            title="Jump to slide number"
          >
            Jump ▾
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm sm:text-base font-bold transition shadow-xs"
            title="Toggle Fullscreen presentation mode (Shortcut: F)"
          >
            <span className="text-base sm:text-lg">{isFullscreen ? "✕" : "⛶"}</span>
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </span>
          </button>
        </div>
      </div>

      {/* Jump to Slide Popover */}
      {showJumpDialog && (
        <div className="absolute top-16 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-32 z-30 bg-slate-900 border border-slate-700 p-3.5 rounded-2xl shadow-2xl flex items-center gap-2 text-sm">
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2.5">
            <label htmlFor="jump-slide-input" className="text-slate-200 font-semibold whitespace-nowrap text-sm">
              Go to slide (1–{numPages}):
            </label>
            <input
              id="jump-slide-input"
              type="number"
              min={1}
              max={numPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={String(currentSlide)}
              className="w-20 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-white font-bold text-center text-sm focus:outline-teal-400"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl transition"
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => setShowJumpDialog(false)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* SLIDE CANVAS STAGE (16:9 Aspect Ratio Container)                  */}
      {/* ---------------------------------------------------------------- */}
      <div
        className={`relative w-full flex items-center justify-center bg-slate-950 overflow-hidden ${
          isFullscreen
            ? "flex-1 min-h-0 w-full p-2 sm:p-4"
            : "w-full aspect-video"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner / Document State */}
        {docLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-3 z-20">
            <div className="h-10 w-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold tracking-wide">
              Loading Official REVIVE Masterclass Presentation...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {docError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-rose-300 p-6 text-center gap-3 z-20">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-bold">{docError}</p>
            <button
              type="button"
              onClick={() => {
                setDocLoading(true);
                setDocError(null);
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500 transition shadow-xs"
            >
              <span>Retry Loading Presentation</span>
            </button>
          </div>
        )}

        {/* Slide Rendering Indicator Overlay */}
        {isRendering && !docLoading && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-[11px] text-teal-300 font-semibold shadow-lg">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
            <span>Rendering Slide {currentSlide}...</span>
          </div>
        )}

        {/* Canvas that holds the rendered slide bitmap */}
        <canvas
          ref={canvasRef}
          onContextMenu={(e) => e.preventDefault()}
          className="max-w-full max-h-full aspect-video object-contain block mx-auto rounded-lg shadow-2xl transition-opacity duration-150"
          style={{ opacity: isRendering ? 0.92 : 1 }}
        />

        {/* Desktop On-Screen Navigation Chevrons (Hover visible) */}
        <button
          type="button"
          onClick={goToPrevSlide}
          disabled={currentSlide <= 1}
          aria-label="Previous Slide"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 text-white/80 hover:text-white border border-white/10 flex items-center justify-center text-xl sm:text-2xl transition disabled:opacity-0 disabled:pointer-events-none backdrop-blur-xs z-10 shadow-lg"
          title="Previous Slide (or Left Arrow)"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={goToNextSlide}
          disabled={!isGuestPreview && currentSlide >= numPages}
          aria-label="Next Slide"
          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-14 sm:w-14 rounded-2xl ${
            isGuestPreview && currentSlide >= numPages
              ? "bg-amber-500/90 hover:bg-amber-400 text-slate-950 border border-amber-300"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-white/80 hover:text-white border border-white/10"
          } flex items-center justify-center text-xl sm:text-2xl transition disabled:opacity-0 disabled:pointer-events-none backdrop-blur-xs z-10 shadow-lg`}
          title={
            isGuestPreview && currentSlide >= numPages
              ? "Advance to Slide 21 (Free Registration)"
              : "Next Slide (or Right Arrow)"
          }
        >
          ›
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* BOTTOM CONTROLS STRIP: Scrubber, Navigation & Shortcuts           */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-t border-slate-800 flex flex-col gap-2.5 shrink-0 z-10">
        {/* Scrubber Range Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold text-slate-400 w-10">
            01
          </span>
          <input
            type="range"
            min={1}
            max={numPages}
            value={currentSlide}
            onChange={(e) => goToSlide(Number(e.target.value))}
            aria-label="Slide timeline scrubber"
            className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-hidden"
          />
          <span className="text-xs sm:text-sm font-bold text-slate-400 w-10 text-right">
            {numPages}
          </span>
        </div>

        {/* Buttons & Status Row */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Previous Button */}
          <button
            type="button"
            onClick={goToPrevSlide}
            disabled={currentSlide <= 1}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-700 shadow-xs"
            title="Previous Slide (← Left Arrow)"
          >
            <span className="text-base sm:text-lg">&larr;</span>
            <span className="hidden sm:inline">Previous Slide</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {/* Center Info */}
          <div className="text-center">
            <span className="font-extrabold text-base sm:text-lg text-slate-100">
              {currentSlide} <span className="text-slate-500 font-normal">/</span> {numPages}
              {isGuestPreview && (
                <span className="text-amber-400 text-xs sm:text-sm ml-1.5 font-semibold">
                  · Preview
                </span>
              )}
            </span>
            <div className="text-xs text-slate-400 hidden sm:block mt-0.5">
              {isGuestPreview ? "Slides 1–20 Preview" : "← / → Arrow keys or swipe"}
            </div>
          </div>

          {/* Next Button */}
          {isGuestPreview && currentSlide >= numPages ? (
            <button
              type="button"
              onClick={goToNextSlide}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition border border-amber-400 shadow-xs"
              title="Continue to Slide 21 (Free Registration)"
            >
              <span className="hidden sm:inline">Continue to Slide 21</span>
              <span className="sm:hidden">Slide 21</span>
              <span className="text-base sm:text-lg">&rarr;</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={goToNextSlide}
              disabled={currentSlide >= numPages}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition border border-teal-500/50 shadow-xs"
              title="Next Slide (→ Right Arrow or Space)"
            >
              <span className="hidden sm:inline">Next Slide</span>
              <span className="sm:hidden">Next</span>
              <span className="text-base sm:text-lg">&rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
