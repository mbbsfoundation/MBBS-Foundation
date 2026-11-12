"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  REVIVE_ASSESSMENT_CONFIG,
  ClientAssessmentQuestion,
  AssessmentEvaluationResult,
} from "@/lib/mbbs-foundation/reviveAssessmentData";

interface LearnerProfile {
  id: string;
  fullName: string;
  email: string;
  learnerCategory?: string;
}

interface ReviveAssessmentInterfaceProps {
  learner: LearnerProfile | null;
  onNavigateToCertificate?: () => void;
  onNavigateToVideos?: () => void;
}

type AssessmentViewMode = "taking" | "result" | "review";

export default function ReviveAssessmentInterface({
  learner,
  onNavigateToCertificate,
  onNavigateToVideos,
}: ReviveAssessmentInterfaceProps) {
  // Assessment attempt state
  const [attemptId, setAttemptId] = useState<string>("");
  const [attemptToken, setAttemptToken] = useState<string>("");
  const [questions, setQuestions] = useState<ClientAssessmentQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<AssessmentViewMode>("taking");
  const [evaluationResult, setEvaluationResult] = useState<AssessmentEvaluationResult | null>(null);
  const [issuedCertInfo, setIssuedCertInfo] = useState<{
    certificateId: string;
    isNew: boolean;
  } | null>(null);

  // UI state
  const [loadingAttempt, setLoadingAttempt] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showIncompleteNotice, setShowIncompleteNotice] = useState<boolean>(false);
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState<number>(0);

  // 1. Fetch randomized assessment attempt from server
  const loadNewAttempt = useCallback(async () => {
    if (!learner) return;

    setLoadingAttempt(true);
    setLoadError(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setEvaluationResult(null);
    setIssuedCertInfo(null);
    setShowIncompleteNotice(false);
    setViewMode("taking");

    try {
      const res = await fetch("/api/mbbs-foundation/learn/assessment/revive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoadError(data.message || "Unable to initiate assessment attempt. Please try again.");
        return;
      }

      setAttemptId(data.attemptId);
      setAttemptToken(data.attemptToken);
      setQuestions(data.questions || []);
    } catch (err) {
      setLoadError("Network connection error. Please verify your internet connection.");
    } finally {
      setLoadingAttempt(false);
    }
  }, [learner]);

  useEffect(() => {
    if (learner) {
      loadNewAttempt();
    }
  }, [learner, loadNewAttempt]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex] || null;
  const answeredCount = Object.keys(selectedAnswers).length;
  const currentSelection = currentQuestion ? selectedAnswers[currentQuestion.id] || null : null;

  // Handle option selection
  const handleSelectOption = (optionId: "A" | "B" | "C" | "D") => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  // Next / Previous navigation
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  // Jump to specific question
  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowIncompleteNotice(false);
  };

  // Submit assessment to server for evaluation
  const handleSubmit = async (force = false) => {
    if (!force && answeredCount < totalQuestions) {
      setShowIncompleteNotice(true);
      return;
    }

    setShowIncompleteNotice(false);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/mbbs-foundation/learn/assessment/revive/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          attemptToken,
          answers: selectedAnswers,
          clientQuestions: questions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.result) {
        alert(data.message || "Failed to submit assessment. Please try again.");
        return;
      }

      setEvaluationResult(data.result);
      if (data.certificate) {
        setIssuedCertInfo(data.certificate);
      }
      setViewMode("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert("Network error submitting assessment. Please check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch to review mode
  const handleStartReview = (startIndex = 0) => {
    setReviewQuestionIndex(startIndex);
    setViewMode("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --------------------------------------------------------------------------
  // 1. GATE: REGISTERED LEARNERS ONLY
  // --------------------------------------------------------------------------
  if (!learner) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 text-center shadow-2xs space-y-5">
          <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Enrolled Learners Only
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              The 20-question REVIVE scenario assessment is available to registered learners. Please sign in or complete your free registration to take the assessment.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/mbbs-foundation/learn/register?redirect=/mbbs-foundation/learn/modules/revive?section=assessment"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 text-sm shadow-xs transition"
            >
              <span>Sign In / Register Free</span>
              <span>&rarr;</span>
            </Link>
            {onNavigateToVideos && (
              <button
                type="button"
                onClick={onNavigateToVideos}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 text-sm transition"
              >
                &larr; Review Videos First
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 pt-3 border-t border-slate-100">
            {REVIVE_ASSESSMENT_CONFIG.disclaimer}
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. LOADING ATTEMPT STATE
  // --------------------------------------------------------------------------
  if (loadingAttempt) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="h-10 w-10 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">
          Generating randomized assessment attempt...
        </p>
        <p className="text-xs text-slate-400">
          Selecting 20 clinical scenarios and balancing options according to 2025 guidelines.
        </p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 3. LOAD ERROR STATE
  // --------------------------------------------------------------------------
  if (loadError || !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8 text-center space-y-4">
          <div className="text-red-700 text-2xl font-bold">⚠️</div>
          <h3 className="text-lg font-bold text-red-950">
            Assessment Session Error
          </h3>
          <p className="text-sm text-red-800">
            {loadError || "Unable to display assessment question."}
          </p>
          <button
            type="button"
            onClick={loadNewAttempt}
            className="rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 text-xs sm:text-sm transition"
          >
            Retry Loading Assessment
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 4. RESULT SCREEN
  // --------------------------------------------------------------------------
  if (viewMode === "result" && evaluationResult) {
    const isPassed = evaluationResult.passed;

    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Result Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xs space-y-6">
          {/* Header & Pass/Fail Status */}
          <div className="text-center space-y-3 pb-6 border-b border-slate-100">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPassed
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <span>{isPassed ? "✓" : "!"}</span>
              <span>{isPassed ? "Assessment Passed" : "Passing Threshold Not Reached"}</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isPassed ? "Congratulations!" : "Assessment Completed"}
            </h2>

            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {isPassed
                ? "You have satisfied the 70% passing threshold for Module 7: REVIVE (Resuscitation Principles & Emergency CPR)."
                : "You scored below the 70% passing threshold (minimum 14/20). You may review your answers and retry the assessment with unlimited attempts."}
            </p>
          </div>

          {/* Score Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {evaluationResult.score} / {totalQuestions}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                Total Score
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div
                className={`text-2xl sm:text-3xl font-black ${
                  isPassed ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {evaluationResult.percentage}%
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                Percentage
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {REVIVE_ASSESSMENT_CONFIG.passingThresholdPct}%
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                Pass Mark (14/20)
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-2xl sm:text-3xl font-black text-teal-800">
                {isPassed ? "Passed" : "Retry"}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                Status
              </div>
            </div>
          </div>

          {/* Certificate Notice */}
          {isPassed ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 leading-relaxed space-y-2">
              <div className="font-bold text-sm flex items-center justify-between">
                <span>🎓 Official Certificate Issued</span>
                {issuedCertInfo && (
                  <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                    {issuedCertInfo.certificateId}
                  </span>
                )}
              </div>
              <p className="text-emerald-900 font-medium">
                Congratulations! You have satisfied the knowledge assessment requirements for Module 7: REVIVE with a score of {evaluationResult.score}/20 ({evaluationResult.percentage}%).
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href="/api/mbbs-foundation/learn/certificate/revive/pdf?download=1"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold px-3.5 py-2 text-xs transition"
                >
                  <span>Download Official PDF (A4 Landscape)</span>
                  <span>&darr;</span>
                </a>
                {onNavigateToCertificate && (
                  <button
                    type="button"
                    onClick={onNavigateToCertificate}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 font-bold px-3 py-2 text-xs transition"
                  >
                    <span>View 4. Certificate &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed space-y-1">
              <div className="font-bold text-slate-800">
                Passing Threshold: 70% (14 / 20)
              </div>
              <p>
                You achieved {evaluationResult.score}/20 ({evaluationResult.percentage}%). You may review your answers to understand clinical decision points, then retry the assessment to earn your official verifiable certificate.
              </p>
            </div>
          )}

          {/* Result Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleStartReview(0)}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 text-xs sm:text-sm transition"
              >
                Review Answers &rarr;
              </button>
              <button
                type="button"
                onClick={loadNewAttempt}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 text-xs sm:text-sm transition"
              >
                Retry Assessment
              </button>
            </div>

            {isPassed && onNavigateToCertificate && (
              <button
                type="button"
                onClick={onNavigateToCertificate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 text-xs sm:text-sm shadow-xs transition"
              >
                <span>View 4. Certificate</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 5. REVIEW MODE (SHOWS SCORE, SELECTION, CORRECT ANSWER & CLINICAL RATIONALE)
  // --------------------------------------------------------------------------
  if (viewMode === "review" && evaluationResult) {
    const q = questions[reviewQuestionIndex];
    const qResult = evaluationResult.questionResults.find((r) => r.questionId === q?.id);
    const selectedOptionId = qResult?.selectedOption || null;
    const correctOptionId = qResult?.correctOption || null;
    const isQuestionCorrect = qResult?.isCorrect || false;

    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Top Review Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Assessment Review
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              Question {reviewQuestionIndex + 1} of {totalQuestions}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("result")}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 text-xs transition"
            >
              Back to Results
            </button>
            <button
              type="button"
              onClick={loadNewAttempt}
              className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1.5 text-xs transition"
            >
              Retry Assessment
            </button>
          </div>
        </div>

        {/* Question Selector Dots for Review */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Question Selector (Green = Correct, Amber = Incorrect)
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 sm:gap-1.5">
            {questions.map((item, idx) => {
              const res = evaluationResult.questionResults.find((r) => r.questionId === item.id);
              const isCurrent = reviewQuestionIndex === idx;
              const correct = res?.isCorrect || false;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReviewQuestionIndex(idx)}
                  className={`h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? "ring-2 ring-slate-900 ring-offset-1 font-black"
                      : ""
                  } ${
                    correct
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                  title={`Question ${idx + 1}: ${correct ? "Correct" : "Incorrect"}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Review Question Card */}
        {q && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {q.curriculumTopic}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isQuestionCorrect
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {isQuestionCorrect ? "✓ Correct" : "✕ Incorrect / Needs Review"}
                </span>
              </div>
              {q.scenario && (
                <p className="text-xs sm:text-sm text-slate-500 italic font-serif pt-1">
                  &ldquo;{q.scenario}&rdquo;
                </p>
              )}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-1">
                {q.questionStem}
              </h3>
            </div>

            {/* Options Display with Correct / Incorrect Badges */}
            <div className="space-y-2.5">
              {q.options.map((opt) => {
                const isLearnerChoice = selectedOptionId === opt.id;
                const isCorrectOption = correctOptionId === opt.id;

                let optionStyles = "bg-white border-slate-200 text-slate-700";
                if (isCorrectOption) {
                  optionStyles = "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-medium";
                } else if (isLearnerChoice && !isCorrectOption) {
                  optionStyles = "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-medium";
                }

                return (
                  <div
                    key={opt.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm transition flex items-start gap-3 ${optionStyles}`}
                  >
                    <span
                      className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isCorrectOption
                          ? "bg-emerald-700 text-white"
                          : isLearnerChoice
                          ? "bg-amber-700 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="leading-relaxed pt-0.5">{opt.text}</span>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      {isCorrectOption && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Correct Answer
                        </span>
                      )}
                      {isLearnerChoice && !isCorrectOption && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Your Choice
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Clinical Rationale */}
            {qResult?.explanation && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📖</span>
                  <span>Clinical Rationale &amp; 2025 Guidelines</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-sans">
                  {qResult.explanation}
                </p>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                disabled={reviewQuestionIndex === 0}
                onClick={() => setReviewQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 text-xs sm:text-sm transition disabled:opacity-40"
              >
                &larr; Previous Question
              </button>

              <button
                type="button"
                disabled={reviewQuestionIndex === totalQuestions - 1}
                onClick={() => setReviewQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs sm:text-sm transition disabled:opacity-40"
              >
                Next Question &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 6. ACTIVE ASSESSMENT (ONE MCQ DISPLAYED AT A TIME)
  // --------------------------------------------------------------------------
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const progressPct = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Subtle Assessment Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Module 7: REVIVE
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                20 Scenario MCQs
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Cardiopulmonary Resuscitation Assessment (2025 Guidelines)
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md">
              Answered: <strong className="text-slate-900">{answeredCount}</strong> / {totalQuestions}
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
              Pass: 70% (14/20)
            </span>
          </div>
        </div>

        {/* Subtle Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{progressPct}% Completed</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Compact Question Selector Bar (Pills 1-20) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 sm:gap-1.5">
            {questions.map((item, idx) => {
              const isCurrent = currentQuestionIndex === idx;
              const isAnswered = selectedAnswers[item.id] !== undefined;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? "bg-teal-700 text-white ring-2 ring-teal-700/30 shadow-2xs"
                      : isAnswered
                      ? "bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"
                  }`}
                  title={`Jump to Question ${idx + 1}${isAnswered ? " (Answered)" : ""}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Single Question Display */}
      {currentQuestion && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
          {/* Question Header */}
          <div className="space-y-1.5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-md">
                Question {currentQuestionIndex + 1} • {currentQuestion.curriculumTopic}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Single Best Answer
              </span>
            </div>

            {currentQuestion.scenario && (
              <p className="text-xs sm:text-sm text-slate-600 font-serif italic pt-2 leading-relaxed">
                &ldquo;{currentQuestion.scenario}&rdquo;
              </p>
            )}

            <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-1 leading-snug">
              {currentQuestion.questionStem}
            </h3>
          </div>

          {/* 4 Single-Best-Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = currentSelection === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition flex items-start gap-3.5 ${
                    isSelected
                      ? "bg-teal-50/90 border-teal-600 ring-2 ring-teal-600/20 text-teal-950 font-medium shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <span
                    className={`h-7 w-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? "bg-teal-700 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="leading-relaxed pt-0.5">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Incomplete Questions Prompt Warning */}
          {showIncompleteNotice && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Incomplete Assessment Notice</span>
              </div>
              <p>
                You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions ({totalQuestions - answeredCount} unanswered). You may review your answers before submitting or proceed to submit anyway.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowIncompleteNotice(false)}
                  className="rounded-lg bg-white border border-amber-300 px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100 transition"
                >
                  Continue Reviewing
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="rounded-lg bg-amber-700 text-white px-3 py-1 font-bold hover:bg-amber-800 transition"
                >
                  Submit Assessment Anyway
                </button>
              </div>
            </div>
          )}

          {/* Navigation Actions (Previous / Next / Submit) */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={handlePrevious}
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 sm:px-5 py-2.5 text-xs sm:text-sm transition disabled:opacity-40"
            >
              &larr; Previous
            </button>

            <div className="flex items-center gap-2">
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 sm:px-6 py-2.5 text-xs sm:text-sm shadow-xs transition"
                >
                  Next &rarr;
                </button>
              ) : null}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className={`rounded-xl font-bold px-5 sm:px-6 py-2.5 text-xs sm:text-sm shadow-xs transition ${
                  isLastQuestion
                    ? "bg-teal-700 hover:bg-teal-800 text-white"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                } disabled:opacity-60 flex items-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <span>Submit Assessment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Clinical Disclaimer */}
      <div className="text-center text-xs text-slate-400 px-4">
        {REVIVE_ASSESSMENT_CONFIG.disclaimer}
      </div>
    </div>
  );
}
