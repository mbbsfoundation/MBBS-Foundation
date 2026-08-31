"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface BookDiscoveryCardProps {
  className?: string;
}

export default function BookDiscoveryCard({ className = "" }: BookDiscoveryCardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 p-5 sm:p-6 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Book Cover Thumbnail */}
        <div className="relative shrink-0 w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
          <Image
            src="/preview/01_Cover_Front.png"
            alt="MBBS Foundation: Your First Book of Medicine"
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>

        {/* Book Description & Action */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
            <span>📖</span>
            <span>Starting MBBS Soon?</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            MBBS Foundation: Your First Book of Medicine
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            A practical guide for the transition from NEET to medical college — Foundation Course, AETCOM, CPR & First
            Aid, soft skills and the hidden curriculum of becoming a doctor.
          </p>

          <div className="pt-2">
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <span>Explore the Book</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
