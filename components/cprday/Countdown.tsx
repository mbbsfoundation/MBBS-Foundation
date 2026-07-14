"use client";

import { useEffect, useState } from "react";

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeRemaining(): TimeRemaining {
  const eventTime = new Date("2026-07-21T00:00:00+05:30").getTime();
  const now = Date.now();
  const difference = eventTime - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function Countdown() {
  const [timeRemaining, setTimeRemaining] =
    useState<TimeRemaining | null>(null);

  useEffect(() => {
    setTimeRemaining(getTimeRemaining());

    const timer = window.setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  if (!timeRemaining) {
    return (
      <div className="mt-8 h-24 w-full max-w-xl rounded-xl border border-white/10 bg-white/5" />
    );
  }

  const countdownItems = [
    {
      label: "Days",
      value: timeRemaining.days,
      accent: "text-red-400",
      border: "border-red-400/30",
      glow: "shadow-red-500/10",
    },
    {
      label: "Hours",
      value: timeRemaining.hours,
      accent: "text-orange-400",
      border: "border-orange-400/30",
      glow: "shadow-orange-500/10",
    },
    {
      label: "Minutes",
      value: timeRemaining.minutes,
      accent: "text-sky-400",
      border: "border-sky-400/30",
      glow: "shadow-sky-500/10",
    },
    {
      label: "Seconds",
      value: timeRemaining.seconds,
      accent: "text-emerald-400",
      border: "border-emerald-400/30",
      glow: "shadow-emerald-500/10",
    },
  ];

  return (
    <div className="mt-8 w-full max-w-2xl">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-red-200 sm:text-sm">
        Event Starts In
      </p>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {countdownItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border bg-white/10 px-2 py-4 text-center shadow-lg backdrop-blur sm:px-4 sm:py-5 ${item.border} ${item.glow}`}
          >
            <p
              className={`text-2xl font-black tabular-nums sm:text-4xl ${item.accent}`}
            >
              {String(item.value).padStart(2, "0")}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 sm:text-xs">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}