import React from "react";
import Image from "next/image";

export interface GalleryPhoto {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

/**
 * Gallery photographs configuration.
 * Existing photographs located in public/home-gallery/
 * Captions are intentionally kept disabled from display until approved.
 */
export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    src: "/home-gallery/SMS 95.jpeg",
    alt: "Medical fraternity gathering and clinical alumni session",
    caption: "Medical fraternity gathering",
    width: 3336,
    height: 1876,
  },
  {
    src: "/home-gallery/Prof Meenu Singh.jpeg",
    alt: "Medical leadership and faculty engagement session",
    caption: "Faculty engagement session",
    width: 2560,
    height: 1647,
  },
  {
    src: "/home-gallery/NMC Office.jpeg",
    alt: "National Medical Commission office engagement on medical education",
    caption: "Medical education dialogue",
    width: 1448,
    height: 933,
  },
  {
    src: "/home-gallery/Prof Kuldeep Singh.jpeg",
    alt: "Senior medical faculty discussion on curriculum and student readiness",
    caption: "Curriculum discussion",
    width: 2252,
    height: 1376,
  },
  {
    src: "/home-gallery/Dean AIIMS R.jpeg",
    alt: "Institutional academic meeting and medical education dialogue",
    caption: "Institutional academic meeting",
    width: 2252,
    height: 1638,
  },
];

export default function HomePhotoMarquee() {
  return (
    <section
      aria-label="MBBS Foundation in Action Photo Gallery"
      className="relative overflow-hidden bg-slate-50/60 border-b border-slate-200/80 py-10 sm:py-14"
    >
      {/* Section Header */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
          MBBS Foundation in Action
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium">
          <em>Learning &bull; Engagement &bull; Skills &bull; Inspiration</em>
        </p>
      </div>

      {/* Marquee Viewport with Soft Gradient Edge Masks */}
      <div className="relative w-full overflow-hidden">
        {/* Left & Right Soft Edge Fades */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-50/80 to-transparent z-10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-slate-50/80 to-transparent z-10"
          aria-hidden="true"
        />

        {/* Marquee Track: Contains two identical groups for seamless -50% translation */}
        <div className="photo-marquee-track flex w-max">
          {/* Group 1: Primary Group (Accessible) */}
          <div className="photo-marquee-group flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0">
            {GALLERY_PHOTOS.map((photo, index) => (
              <div
                key={`gallery-primary-${index}`}
                className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition duration-300 hover:shadow-md"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  className="h-44 sm:h-56 md:h-64 w-auto object-cover pointer-events-none select-none"
                  sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, 420px"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Group 2: Duplicate Group for Seamless Looping (Hidden from Assistive Technology) */}
          <div
            className="photo-marquee-group flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0"
            aria-hidden="true"
          >
            {GALLERY_PHOTOS.map((photo, index) => (
              <div
                key={`gallery-duplicate-${index}`}
                className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition duration-300 hover:shadow-md"
              >
                <Image
                  src={photo.src}
                  alt=""
                  width={photo.width}
                  height={photo.height}
                  className="h-44 sm:h-56 md:h-64 w-auto object-cover pointer-events-none select-none"
                  sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, 420px"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

