"use client";

import React, { useState } from "react";
import Link from "next/link";
import { generateRandomQuizAttempt, PreparedQuestion, QuizDomain } from "./quizData";
import { trackNeetEvent } from "@/lib/analytics";
import KnowledgeSkillsMindset from "./KnowledgeSkillsMindset";

const BASE_URL = "https://mbbsfoundation.com";
const CHALLENGE_URL = `${BASE_URL}/neet-to-mbbs/readiness-quiz`;

export default function FutureDoctorChallenge() {
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [questions, setQuestions] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState(false);

  // Initialize fresh attempt
  const startNewQuiz = () => {
    const freshQuestions = generateRandomQuizAttempt();
    setQuestions(freshQuestions);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setGameState("playing");
    trackNeetEvent("neet_quiz_start");
  };

  const restartQuiz = () => {
    trackNeetEvent("neet_quiz_retry");
    startNewQuiz();
  };

  const handleSelectOption = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate score
      let finalScore = 0;
      questions.forEach((q, idx) => {
        const chosenIdx = selectedAnswers[idx];
        if (chosenIdx !== undefined && q.options[chosenIdx]?.isCorrect) {
          finalScore += 1;
        }
      });

      setGameState("result");
      trackNeetEvent("neet_quiz_complete", { score: finalScore });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Compute final score
  let score = 0;
  questions.forEach((q, idx) => {
    const chosenIdx = selectedAnswers[idx];
    if (chosenIdx !== undefined && q.options[chosenIdx]?.isCorrect) {
      score += 1;
    }
  });

  const getScoreBand = (pts: number) => {
    if (pts >= 9) {
      return {
        badge: "Excellent Start",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
        message: "You already know quite a bit about the world you're entering.",
      };
    }
    if (pts >= 7) {
      return {
        badge: "Strong Beginning",
        badgeColor: "bg-teal-100 text-teal-900 border-teal-300",
        message: "You have a good foundation—there is plenty more to discover.",
      };
    }
    if (pts >= 5) {
      return {
        badge: "Good Start",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
        message: "You've begun the transition from NEET knowledge to medical thinking.",
      };
    }
    return {
      badge: "The Journey Has Just Begun",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      message:
        "That's what this challenge is for. Medical college will open an entirely new world of learning.",
    };
  };

  const band = getScoreBand(score);

  // Group domain performance from presented questions
  const domainPerformance: Record<QuizDomain, { name: string; total: number; correct: number }> = {
    A: { name: "Medical Education", total: 0, correct: 0 },
    B: { name: "Ethics & Professionalism", total: 0, correct: 0 },
    C: { name: "Applied Biology", total: 0, correct: 0 },
    D: { name: "Lifesaving & CPR", total: 0, correct: 0 },
  };

  questions.forEach((q, idx) => {
    const dom = q.domain;
    if (domainPerformance[dom]) {
      domainPerformance[dom].total += 1;
      const chosenIdx = selectedAnswers[idx];
      if (chosenIdx !== undefined && q.options[chosenIdx]?.isCorrect) {
        domainPerformance[dom].correct += 1;
      }
    }
  });

  const whatsappChallengeText = `I scored ${score}/10 on the Future Doctor Challenge 🩺. It tests medical-college knowledge, clinical thinking, professionalism and lifesaving awareness—not just NEET biology. Can you beat my score? ${CHALLENGE_URL}`;
  const whatsappChallengeHref = `https://wa.me/?text=${encodeURIComponent(whatsappChallengeText)}`;

  const handleCopyLink = async () => {
    trackNeetEvent("neet_quiz_share", { type: "copy_link" });
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(CHALLENGE_URL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    trackNeetEvent("neet_quiz_share", { type: "whatsapp", score });
  };

  // =========================================================================
  // VIEW 1: INTRO / HERO SCREEN
  // =========================================================================
  if (gameState === "intro") {
    return (
      <div className="space-y-12">
        {/* Hero Card */}
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-red-50/60 via-slate-50/40 to-white p-6 sm:p-12 shadow-sm text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-100/90 border border-red-200 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-900">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
              Future Doctor Challenge • Version 1.0
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Your First Challenge as a <span className="text-red-700">Future Doctor</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              NEET tested your science. Now test how much you know about the medical world you are about to enter—from first-year subjects and clinical thinking to medical ethics and lifesaving awareness.
            </p>

            {/* Feature Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 shadow-2xs">
                <span>🎯</span> 10 Questions
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 shadow-2xs">
                <span>🎲</span> Randomized Every Attempt
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 shadow-2xs">
                <span>⏱️</span> ~4 Minutes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 shadow-2xs">
                <span>✓</span> 100% Free & Educational
              </span>
            </div>

            {/* Start Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={startNewQuiz}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 px-8 py-4 text-base font-bold text-white shadow-md hover:bg-red-800 transition transform active:scale-98 cursor-pointer"
              >
                <span>Start the Challenge</span>
                <span className="text-lg">→</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-medium pt-1">
              Complete all 10 questions to reveal your final score and detailed answer key with explanations.
            </p>
          </div>
        </div>

        {/* 4 Domains Overview Grid */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Knowledge Bank
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Four Dimensions of Medical Readiness
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5">
              <span className="text-2xl">🏛️</span>
              <h3 className="text-sm font-bold text-slate-900">1. Medical Education</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Foundational disciplines (Anatomy, Physiology, Biochemistry), AETCOM, and Early Clinical Exposure.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5">
              <span className="text-2xl">🤝</span>
              <h3 className="text-sm font-bold text-slate-900">2. Ethics & Professionalism</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Patient confidentiality, informed consent, clinical communication, and the teach-back method.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5">
              <span className="text-2xl">🧠</span>
              <h3 className="text-sm font-bold text-slate-900">3. Applied Biology</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Oxygen transport, alveolar gas exchange, tissue perfusion, and cerebral blood flow under clinical stress.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5">
              <span className="text-2xl">🩺</span>
              <h3 className="text-sm font-bold text-slate-900">4. Lifesaving & CPR</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cardiac arrest recognition, chest compression mechanics, early AED defibrillation, and agonal breathing.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE QUESTION SCREEN (No instant answers shown)
  // =========================================================================
  if (gameState === "playing" && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;
    const currentSelection = selectedAnswers[currentIndex];
    const isCurrentAnswered = currentSelection !== undefined;

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress & Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-slate-700">
              <span>🏷️</span> {currentQ.domainName}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-red-700 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-red-700">
              {currentQ.domainBadge}
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* 4 Plausible Options (Neutral selection state, answers hidden until finish) */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = currentSelection === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left rounded-2xl border p-4 sm:p-5 transition flex items-start gap-3.5 text-xs sm:text-sm font-medium leading-relaxed cursor-pointer ${
                    isSelected
                      ? "border-red-700 bg-red-50/70 text-slate-950 ring-2 ring-red-700/20 font-semibold"
                      : "border-slate-200 bg-slate-50/40 hover:bg-slate-100/80 text-slate-800"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                      isSelected
                        ? "bg-red-700 text-white border-red-700"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="pt-0.5">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="button"
              disabled={!isCurrentAnswered}
              onClick={handleNext}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition ${
                isCurrentAnswered
                  ? "bg-slate-900 hover:bg-slate-800 cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed opacity-60"
              }`}
            >
              <span>{isLastQuestion ? "Submit & View Results" : "Next Question"}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: RESULT SCREEN (With Clean Challenge Completed Box & Answer Key)
  // =========================================================================
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* On-Screen Clean Result Card (All 3 fine print lines removed) */}
      <div className="rounded-3xl border-2 border-slate-900 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-10 shadow-xl space-y-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Challenge Completed
        </h2>

        {/* Score Ring */}
        <div className="py-2">
          <div className="inline-flex flex-col items-center justify-center h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-red-500/80 bg-slate-800/80 shadow-inner">
            <span className="text-3xl sm:text-4xl font-extrabold text-white">{score}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              out of 10
            </span>
          </div>
        </div>

        {/* Band Result (Clean, no extra fine print) */}
        <div className="space-y-2 max-w-lg mx-auto">
          <span
            className={`inline-block rounded-full border px-4 py-1 text-xs font-extrabold tracking-wider ${band.badgeColor}`}
          >
            {band.badge}
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-100">
            {band.message}
          </p>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
          Performance by Domain
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["A", "B", "C", "D"] as QuizDomain[]).map((domKey) => {
            const data = domainPerformance[domKey];
            if (data.total === 0) return null;

            return (
              <div
                key={domKey}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{data.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {data.correct} of {data.total} correct
                  </p>
                </div>
                <span
                  className={`text-xs font-bold rounded-lg px-2.5 py-1 ${
                    data.correct === data.total
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {Math.round((data.correct / data.total) * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenge Sharing & Retry Actions */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
          Share Your Result
        </p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Challenge Another Future Doctor
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          See if your friends or future batchmates can match or beat your score of {score}/10 on this randomized 10-question challenge.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappChallengeHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
          >
            <span>💬</span>
            <span>Challenge a Friend on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <span>🔗</span>
            <span>{copied ? "✓ Challenge Link Copied!" : "Copy Challenge Link"}</span>
          </button>

          <button
            type="button"
            onClick={restartQuiz}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
          >
            <span>🔄</span>
            <span>Try Another Challenge</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED ANSWER KEY & EXPLANATIONS REVIEW */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Answer Key & Explanations Review
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Review each question from your attempt, your selected answer, and the educational rationale.
            </p>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {score} / {questions.length} Correct
          </span>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => {
            const userChoiceIdx = selectedAnswers[idx];
            const isCorrect = userChoiceIdx !== undefined && q.options[userChoiceIdx]?.isCorrect;

            return (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-2xs"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {q.domainName} • {q.domainBadge}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ${
                      isCorrect
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {isCorrect ? "✓ Correct (+1)" : "✗ Incorrect (0/1)"}
                  </span>
                </div>

                {/* Question Statement */}
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {q.question}
                </h4>

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = userChoiceIdx === optIdx;
                    const isCorrectOpt = opt.isCorrect;

                    let optContainer = "border-slate-200 bg-slate-50/50 text-slate-700";
                    let optBadge = "bg-white text-slate-600 border-slate-200";

                    if (isCorrectOpt) {
                      optContainer = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold";
                      optBadge = "bg-emerald-600 text-white border-emerald-600";
                    } else if (isUserPick && !isCorrectOpt) {
                      optContainer = "border-rose-400 bg-rose-50 text-rose-950 font-semibold";
                      optBadge = "bg-rose-600 text-white border-rose-600";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`rounded-xl border p-3 sm:p-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm ${optContainer}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold border ${optBadge}`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="pt-0.5">{opt.text}</span>
                        </div>

                        {/* Status Label */}
                        <div className="shrink-0 text-[11px] font-bold">
                          {isCorrectOpt && isUserPick && (
                            <span className="text-emerald-700">✓ Your Answer (Correct)</span>
                          )}
                          {isCorrectOpt && !isUserPick && (
                            <span className="text-emerald-700">✓ Correct Answer</span>
                          )}
                          {!isCorrectOpt && isUserPick && (
                            <span className="text-rose-700">✗ Your Answer</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Educational Explanation Box */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs sm:text-sm text-slate-700 space-y-2">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>💡</span> Explanation:
                    </span>
                    <p className="leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>

                  {/* Contextual CPR eSanjeevani CTA if Lifesaving question was incorrect */}
                  {q.domain === "D" && !isCorrect && (
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                      <span className="text-rose-900 font-medium">
                        Want to strengthen your lifesaving awareness?
                      </span>
                      <Link
                        href="/cprday#cpr-esanjeevani"
                        onClick={() => trackNeetEvent("neet_quiz_cpr_click")}
                        className="font-bold text-rose-700 hover:text-rose-800 underline underline-offset-2 shrink-0"
                      >
                        Explore CPR eSanjeevani →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Learning Pathways */}
      <div className="space-y-4 pt-4">
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Next Steps
          </p>
          <h3 className="text-xl font-bold text-slate-900">
            Continue Your Journey
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Pathway 1: Knowledge & Mindset */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Knowledge & Mindset
              </span>
              <h4 className="text-base font-bold text-slate-900">
                Prepare for Medical College
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Discover <em>MBBS Foundation: Your First Book of Medicine</em>—designed to guide you through first-year subjects, hospital culture, ethics, and study habits.
              </p>
            </div>

            <Link
              href="/book"
              onClick={() => trackNeetEvent("neet_quiz_book_click")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <span>Explore MBBS Foundation</span>
              <span>→</span>
            </Link>
          </div>

          {/* Pathway 2: Lifesaving Skills */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Lifesaving Skills
              </span>
              <h4 className="text-base font-bold text-slate-900">
                Learn Your First Lifesaving Skill
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Explore <em>CPR eSanjeevani</em>—complete the learning pathway and assessment to earn the programme&apos;s applicable certificate, where eligible.
              </p>
            </div>

            <Link
              href="/cprday#cpr-esanjeevani"
              onClick={() => trackNeetEvent("neet_quiz_cpr_click")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-800 transition"
            >
              <span>Explore CPR eSanjeevani</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3-Pillar Bridge */}
      <div className="pt-2">
        <KnowledgeSkillsMindset />
      </div>
    </div>
  );
}
