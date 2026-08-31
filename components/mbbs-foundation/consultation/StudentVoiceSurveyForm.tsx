"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  STUDENT_SURVEY_METADATA,
  STUDENT_SURVEY_SECTIONS_CONFIG,
  STUDENT_SUCCESS_SCREEN_CONFIG,
  INDIA_STATES_LIST,
  Q8_RATING_SCALE,
  Q8_STATEMENTS,
} from "@/lib/mbbs-foundation/studentVoiceSurveyConfig";
import {
  StudentVoiceFormData,
  INITIAL_STUDENT_VOICE_FORM_DATA,
} from "@/lib/mbbs-foundation/studentVoiceTypes";
import SurveyProgress from "./SurveyProgress";

interface StudentVoiceSurveyFormProps {
  source?: string;
}

const SECTION_TITLES = STUDENT_SURVEY_SECTIONS_CONFIG.map((s) => s.title);

export default function StudentVoiceSurveyForm({
  source = "direct",
}: StudentVoiceSurveyFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<StudentVoiceFormData>({
    ...INITIAL_STUDENT_VOICE_FORM_DATA,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // MUTATION HANDLERS
  // -------------------------------------------------------------

  const handleSingleSelect = (field: keyof StudentVoiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleMultiToggle = (
    field: "q4RewardingExperiences" | "q6HarderAspects" | "q7UnexpectedAspects" | "q9ShouldUnderstandBefore" | "q10HelpfulGuidanceTypes" | "q13GuideEssentialComponents" | "q17HelpMethods",
    value: string,
    maxLimit: number
  ) => {
    setFormData((prev) => {
      const currentList = prev[field] as string[];
      const exists = currentList.includes(value);
      if (exists) {
        return {
          ...prev,
          [field]: currentList.filter((item) => item !== value),
        };
      }
      if (currentList.length >= maxLimit) {
        return prev;
      }
      return {
        ...prev,
        [field]: [...currentList, value],
      };
    });
    setValidationError(null);
  };

  const handleQ8Rating = (statementId: string, rating: string) => {
    setFormData((prev) => ({
      ...prev,
      q8FirstYearFeelings: {
        ...prev.q8FirstYearFeelings,
        [statementId]: rating,
      },
    }));
    setValidationError(null);
  };

  // -------------------------------------------------------------
  // STEP VALIDATION
  // -------------------------------------------------------------

  const validateCurrentStep = (step: number): boolean => {
    setValidationError(null);

    if (step === 1) {
      if (!formData.trainingStage) {
        setValidationError("Please select your current training stage to proceed.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (formData.q4RewardingExperiences.length === 0) {
        setValidationError("Please select at least one exciting/rewarding experience in Q4.");
        return false;
      }
      if (!formData.q5FirstMonthsFeeling) {
        setValidationError("Please select how your first few months felt overall in Q5.");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (formData.q6HarderAspects.length === 0) {
        setValidationError("Please select at least one aspect that was harder than expected in Q6.");
        return false;
      }
      if (formData.q7UnexpectedAspects.length === 0) {
        setValidationError("Please select at least one aspect that was unexpected in Q7.");
        return false;
      }
      // Check Q8 statements
      for (const statement of Q8_STATEMENTS) {
        if (!formData.q8FirstYearFeelings[statement.id]) {
          setValidationError(`Please provide a rating for statement [${statement.code}]: "${statement.label}" in Q8.`);
          return false;
        }
      }
      return true;
    }

    if (step === 4) {
      if (formData.q9ShouldUnderstandBefore.length === 0) {
        setValidationError("Please select at least one area new students should understand in Q9.");
        return false;
      }
      if (formData.q10HelpfulGuidanceTypes.length === 0) {
        setValidationError("Please select at least one helpful guidance format in Q10.");
        return false;
      }
      if (!formData.q11BestTimingForGuidance) {
        setValidationError("Please select when guidance would be most useful in Q11.");
        return false;
      }
      if (!formData.q12GuideUsefulnessRating) {
        setValidationError("Please rate the usefulness of a structured guide in Q12.");
        return false;
      }
      if (formData.q13GuideEssentialComponents.length === 0) {
        setValidationError("Please select at least one component for the guide in Q13.");
        return false;
      }
      return true;
    }

    if (step === 5) {
      if (!formData.q14TransitionFitStatement) {
        setValidationError("Please select the statement that fits your transition best in Q14.");
        return false;
      }
      if (!formData.q15PriorKnowledgeWouldHaveHelped) {
        setValidationError("Please answer whether prior knowledge would have helped in Q15.");
        return false;
      }
      if (!formData.q16InterestedInHelping) {
        setValidationError("Please indicate if you are interested in helping future students in Q16.");
        return false;
      }
      if (formData.q18OneThingWishTold && formData.q18OneThingWishTold.length > 250) {
        setValidationError("Your response in Q18 exceeds the 250-character limit.");
        return false;
      }
      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          setValidationError("Please enter a valid email address.");
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -------------------------------------------------------------
  // FINAL SUBMISSION
  // -------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep(5)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const isInterested = [
        "Yes",
        "Possibly",
        "I would like to know more",
      ].includes(formData.q16InterestedInHelping);

      const payload = {
        ...formData,
        source,
        interestedInContributing: isInterested,
      };

      const res = await fetch(
        `/api/mbbs-foundation/consultation/student-voice?source=${encodeURIComponent(source)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
          (data.errors && data.errors.map((err: any) => err.message).join(", ")) ||
          "Failed to submit survey. Please try again."
        );
      }

      setSubmittedResponseId(data.responseId || null);
      setIsSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------

  if (isSubmittedSuccess) {
    const isInterested = [
      "Yes",
      "Possibly",
      "I would like to know more",
    ].includes(formData.q16InterestedInHelping);

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 animate-fadeIn">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-3xl">
            ✓
          </div>
          <span className="inline-block rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Response Recorded
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            {STUDENT_SUCCESS_SCREEN_CONFIG.heading}
          </h2>
          <p className="text-base font-semibold text-slate-800">
            {STUDENT_SUCCESS_SCREEN_CONFIG.leadMessage}
          </p>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {STUDENT_SUCCESS_SCREEN_CONFIG.bodyMessage}
          </p>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            {STUDENT_SUCCESS_SCREEN_CONFIG.initiativeNote}
          </p>
        </div>

        {isInterested && (
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-5 sm:p-6 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <span>🤝</span> {STUDENT_SUCCESS_SCREEN_CONFIG.contributorHeading}
            </h3>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              {STUDENT_SUCCESS_SCREEN_CONFIG.contributorMessage}
            </p>
          </div>
        )}

        {/* Coming Next Card */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              {STUDENT_SUCCESS_SCREEN_CONFIG.comingNextHeading}
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              {STUDENT_SUCCESS_SCREEN_CONFIG.comingNextDescription}
            </h4>
          </div>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed uppercase tracking-wider"
          >
            {STUDENT_SUCCESS_SCREEN_CONFIG.comingNextButtonText}
          </button>
        </div>

        {submittedResponseId && (
          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Reference ID: {submittedResponseId}
            </span>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/mbbs-foundation/consultation"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-black transition"
          >
            Back to Consultation Hub
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SURVEY FORM STEPS
  // -------------------------------------------------------------

  const sec1 = STUDENT_SURVEY_SECTIONS_CONFIG[0];
  const sec2 = STUDENT_SURVEY_SECTIONS_CONFIG[1];
  const sec3 = STUDENT_SURVEY_SECTIONS_CONFIG[2];
  const sec4 = STUDENT_SURVEY_SECTIONS_CONFIG[3];
  const sec5 = STUDENT_SURVEY_SECTIONS_CONFIG[4];

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <SurveyProgress
        currentStep={currentStep}
        totalSteps={5}
        stepTitle={SECTION_TITLES[currentStep - 1]}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm font-medium text-red-800 flex items-start gap-2.5 shadow-xs animate-shake">
          <span className="text-base leading-none">⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Error Banner */}
      {submitError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm font-medium text-red-800 flex items-start gap-2.5 shadow-xs">
          <span className="text-base leading-none">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ========================================================= */}
        {/* STEP 1: WHERE ARE YOU NOW?                                */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div>
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 1 of 5
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec1.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec1.description}
              </p>
            </div>

            {/* Q1: Training Stage */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q1. What is your current stage? <span className="text-red-700">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sec1.questions[0].options?.map((stage) => {
                  const isSelected = formData.trainingStage === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => handleSingleSelect("trainingStage", stage)}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span>{stage}</span>
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q2: College Type */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q2. What type of medical college are you studying in?{" "}
                <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sec1.questions[1].options?.map((type) => {
                  const isSelected = formData.collegeType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSingleSelect("collegeType", type)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-1 ring-red-600/30"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{type}</span>
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: State / UT */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label htmlFor="state-select" className="block text-sm sm:text-base font-bold text-slate-900">
                Q3. State / Union Territory{" "}
                <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <p className="text-xs text-slate-500">
                State or UT where your medical college is located.
              </p>
              <select
                id="state-select"
                value={formData.state}
                onChange={(e) => handleSingleSelect("state", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-800 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              >
                <option value="">Select State / UT (Optional)</option>
                {INDIA_STATES_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 2: THE GOOD PART OF STARTING MBBS                    */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div>
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 2 of 5
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec2.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec2.description}
              </p>
            </div>

            {/* Q4: Rewarding Experiences */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q4. Which experiences made the beginning of MBBS exciting or meaningful for you? <span className="text-red-700">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Selected: {formData.q4RewardingExperiences.length} / 5
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select up to 5 experiences.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {sec2.questions[0].options?.map((opt) => {
                  const isSelected = formData.q4RewardingExperiences.includes(opt);
                  const isMaxed = formData.q4RewardingExperiences.length >= 5 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q4RewardingExperiences", opt, 5)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : isMaxed
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span className="pr-2">{opt}</span>
                      <span
                        className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q5: Overall First Months Feeling */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q5. Overall, how did your first few months of MBBS feel? <span className="text-red-700">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Select the option that best characterizes your initial transition.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {sec2.questions[1].options?.map((opt) => {
                  const isSelected = formData.q5FirstMonthsFeeling === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSingleSelect("q5FirstMonthsFeeling", opt)}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt}</span>
                      <span
                        className={`h-4 w-4 rounded-full border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 3: WHAT WAS HARDER OR MORE UNEXPECTED?               */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-8 animate-fadeIn">
            <div>
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 3 of 5
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec3.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec3.description}
              </p>
            </div>

            {/* Q6: Harder Aspects (Grouped) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q6. Which aspects were harder than you expected? <span className="text-red-700">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Selected: {formData.q6HarderAspects.length} / 6
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select up to 6 challenges across learning, medical environment, and personal life.
              </p>

              <div className="space-y-5 pt-1">
                {sec3.questions[0].groupedOptions?.map((grp) => (
                  <div key={grp.groupName} className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-700"></span>
                      {grp.groupName}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {grp.items.map((item) => {
                        const isSelected = formData.q6HarderAspects.includes(item);
                        const isMaxed = formData.q6HarderAspects.length >= 6 && !isSelected;
                        return (
                          <button
                            key={item}
                            type="button"
                            disabled={isMaxed}
                            onClick={() => handleMultiToggle("q6HarderAspects", item, 6)}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                                : isMaxed
                                ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="pr-2">{item}</span>
                            <span
                              className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                                isSelected
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected ? "✓" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Q7: Unexpected Aspects */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q7. Which things were most different from what you had imagined before joining MBBS? <span className="text-red-700">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Selected: {formData.q7UnexpectedAspects.length} / 5
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select up to 5 things that were different from your expectations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {sec3.questions[1].options?.map((opt) => {
                  const isSelected = formData.q7UnexpectedAspects.includes(opt);
                  const isMaxed = formData.q7UnexpectedAspects.length >= 5 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q7UnexpectedAspects", opt, 5)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : isMaxed
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="pr-2">{opt}</span>
                      <span
                        className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q8: 10-Statement Matrix Rating Cards */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q8. During your first year, how often did you feel: <span className="text-red-700">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Quick tap rating for each statement below (Never to Very often).
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                {Q8_STATEMENTS.map((statement) => {
                  const currentRating = formData.q8FirstYearFeelings[statement.id];
                  return (
                    <div
                      key={statement.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-900 text-xs font-black">
                          {statement.code}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {statement.label}
                        </p>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {Q8_RATING_SCALE.map((rating) => {
                          const isSelected = currentRating === rating;
                          return (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleQ8Rating(statement.id, rating)}
                              className={`py-2 px-1 rounded-xl border text-center text-[10px] sm:text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? "bg-red-700 border-red-700 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <span className="leading-tight">{rating}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 4: WHAT SHOULD STUDENTS KNOW BEFORE THEY START?      */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-8 animate-fadeIn">
            <div>
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 4 of 5
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec4.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec4.description}
              </p>
            </div>

            {/* Q9: Should Understand Before (Max 7) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q9. Which areas should a new MBBS student understand BEFORE or during the first few weeks of medical college? <span className="text-red-700">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Selected: {formData.q9ShouldUnderstandBefore.length} / 7
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select up to 7 priority orientation areas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {sec4.questions[0].options?.map((opt) => {
                  const isSelected = formData.q9ShouldUnderstandBefore.includes(opt);
                  const isMaxed = formData.q9ShouldUnderstandBefore.length >= 7 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q9ShouldUnderstandBefore", opt, 7)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : isMaxed
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="pr-2">{opt}</span>
                      <span
                        className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q10: Helpful Guidance Types (Max 5) */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q10. Which type of guidance would have helped you most at the beginning? <span className="text-red-700">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Selected: {formData.q10HelpfulGuidanceTypes.length} / 5
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select up to 5 guidance methods.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {sec4.questions[1].options?.map((opt) => {
                  const isSelected = formData.q10HelpfulGuidanceTypes.includes(opt);
                  const isMaxed = formData.q10HelpfulGuidanceTypes.length >= 5 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q10HelpfulGuidanceTypes", opt, 5)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : isMaxed
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="pr-2">{opt}</span>
                      <span
                        className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q11: Best Timing */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q11. When would this guidance have been most useful? <span className="text-red-700">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {sec4.questions[2].options?.map((opt) => {
                  const isSelected = formData.q11BestTimingForGuidance === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSingleSelect("q11BestTimingForGuidance", opt)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt}</span>
                      <span
                        className={`h-4 w-4 rounded-full border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q12: Guide Usefulness Rating */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q12. If you had received a structured guide explaining the academic, professional, social and personal realities of MBBS before starting, how useful do you think it would have been? <span className="text-red-700">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {sec4.questions[3].options?.map((opt) => {
                  const isSelected = formData.q12GuideUsefulnessRating === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSingleSelect("q12GuideUsefulnessRating", opt)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt}</span>
                      <span
                        className={`h-4 w-4 rounded-full border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q13: Essential Components (Max 7) */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q13. Which components should such a guide definitely include? <span className="text-red-700">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Selected: {formData.q13GuideEssentialComponents.length} / 7
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select up to 7 components.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {sec4.questions[4].options?.map((opt) => {
                  const isSelected = formData.q13GuideEssentialComponents.includes(opt);
                  const isMaxed = formData.q13GuideEssentialComponents.length >= 7 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q13GuideEssentialComponents", opt, 7)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : isMaxed
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="pr-2">{opt}</span>
                      <span
                        className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* STEP 5: YOUR VOICE FOR THE NEXT BATCH                     */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-8 animate-fadeIn">
            <div>
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 5 of 5
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec5.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec5.description}
              </p>
            </div>

            {/* Q14: Transition Statement */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q14. Looking back, which statement fits you best? <span className="text-red-700">*</span>
              </label>
              <div className="space-y-2 pt-1">
                {sec5.questions[0].options?.map((opt) => {
                  const isSelected = formData.q14TransitionFitStatement === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSingleSelect("q14TransitionFitStatement", opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="pr-3">{opt}</span>
                      <span
                        className={`h-4 w-4 rounded-full border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q15: Prior Knowledge Help */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q15. If you had known in advance about the challenges you personally faced, would the beginning of MBBS have been easier? <span className="text-red-700">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
                {sec5.questions[1].options?.map((opt) => {
                  const isSelected = formData.q15PriorKnowledgeWouldHaveHelped === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSingleSelect("q15PriorKnowledgeWouldHaveHelped", opt)}
                      className={`p-3 rounded-xl border text-center text-xs sm:text-sm font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q16: Helping Interest */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q16. Would you be interested in helping future MBBS students begin better? <span className="text-red-700">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {sec5.questions[2].options?.map((opt) => {
                  const isSelected = formData.q16InterestedInHelping === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSingleSelect("q16InterestedInHelping", opt)}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt}</span>
                      <span
                        className={`h-4 w-4 rounded-full border shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q17: Help Methods (Conditional) */}
            {["Yes", "Possibly", "I would like to know more"].includes(formData.q16InterestedInHelping) && (
              <div className="space-y-3 pt-6 border-t border-slate-100 rounded-2xl bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900">
                    Q17. How might you like to help?{" "}
                    <span className="text-xs font-normal text-slate-500">(Select all that apply)</span>
                  </label>
                  <span className="text-xs font-semibold text-slate-500">
                    Selected: {formData.q17HelpMethods.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {sec5.questions[3].options?.map((opt) => {
                    const isSelected = formData.q17HelpMethods.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleMultiToggle("q17HelpMethods", opt, 20)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-red-50 border-red-600 text-red-950 ring-1 ring-red-600/30"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="pr-2">{opt}</span>
                        <span
                          className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                            isSelected
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q18: One Thing Wish Told (Free Text with 250 character limit) */}
            <div className="space-y-2 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q18. Is there ONE thing you wish someone had told you before you started MBBS?{" "}
                  <span className="text-xs font-normal text-slate-500">(Optional)</span>
                </label>
                <span
                  className={`text-xs font-mono font-semibold ${
                    formData.q18OneThingWishTold.length > 250
                      ? "text-red-700 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {formData.q18OneThingWishTold.length} / 250
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Optional — one sentence is enough.
              </p>
              <textarea
                value={formData.q18OneThingWishTold}
                maxLength={250}
                onChange={(e) => handleSingleSelect("q18OneThingWishTold", e.target.value)}
                placeholder="One sentence that would have made a difference..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            {/* Optional Contributor Contact Information */}
            {["Yes", "Possibly", "I would like to know more"].includes(formData.q16InterestedInHelping) && (
              <div className="space-y-4 pt-6 border-t border-slate-100 rounded-2xl bg-amber-50/50 border border-amber-200 p-5 sm:p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <span>📩</span> Stay Connected for Contributor Opportunities
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  May AHA India contact you about future student-contributor opportunities?
                </p>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="consentForFollowup"
                      checked={formData.consentForFollowup === true}
                      onChange={() => setFormData((prev) => ({ ...prev, consentForFollowup: true }))}
                      className="accent-red-700 h-4 w-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="consentForFollowup"
                      checked={formData.consentForFollowup === false}
                      onChange={() => setFormData((prev) => ({ ...prev, consentForFollowup: false }))}
                      className="accent-red-700 h-4 w-4"
                    />
                    <span>No</span>
                  </label>
                </div>

                {formData.consentForFollowup && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.respondentName}
                        onChange={(e) => handleSingleSelect("respondentName", e.target.value)}
                        placeholder="e.g., Ayush"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleSingleSelect("email", e.target.value)}
                        placeholder="e.g., student@medical.edu"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mobile / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.mobileWhatsapp}
                        onChange={(e) => handleSingleSelect("mobileWhatsapp", e.target.value)}
                        placeholder="e.g., 9876543210"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 pt-2">
                  {STUDENT_SUCCESS_SCREEN_CONFIG.privacyStatement}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* ACTION BUTTONS                                            */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-slate-900 text-white font-bold text-xs sm:text-sm shadow-sm hover:from-red-800 hover:to-black transition cursor-pointer"
            >
              Next Section →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-md transition cursor-pointer flex items-center gap-2 ${
                isSubmitting
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 hover:shadow-lg"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Submitting Response...</span>
                </>
              ) : (
                <>
                  <span>Submit Student Voice Response</span>
                  <span>✓</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
