"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  STUDENT_SURVEY_METADATA,
  STUDENT_SURVEY_SECTIONS_CONFIG,
  STUDENT_POST_SUBMIT_CONFIG,
  INDIA_STATES_LIST,
  Q1_TRAINING_STAGE_OPTIONS,
  Q2_COLLEGE_TYPE_OPTIONS,
  Q3_REWARDING_OPTIONS,
  Q4_HARDER_OPTIONS,
  Q5_SURPRISES_OPTIONS,
  Q6_RATING_SCALE,
  Q6_STATEMENTS,
  Q7_NEXT_BATCH_OPTIONS,
  Q8_PREPARATION_OPTIONS,
  Q9_TIMING_OPTIONS,
  POST_SUBMISSION_CONTRIBUTION_OPTIONS,
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
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentVoiceSurveyForm({
  source = "direct",
}: StudentVoiceSurveyFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<StudentVoiceFormData>({
    ...INITIAL_STUDENT_VOICE_FORM_DATA,
    source,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);

  // Medical College Lookup State
  const [collegesList, setCollegesList] = useState<string[]>([]);
  const [loadingColleges, setLoadingColleges] = useState<boolean>(false);
  const [selectedCollegeChoice, setSelectedCollegeChoice] = useState<string>("");
  const [otherInstitutionText, setOtherInstitutionText] = useState<string>("");

  // Post-submission Contribution Panel State
  const [showContributionPanel, setShowContributionPanel] = useState<boolean>(false);
  const [contributorName, setContributorName] = useState<string>("");
  const [contributorEmail, setContributorEmail] = useState<string>("");
  const [contributorMobile, setContributorMobile] = useState<string>("");
  const [contributorInterests, setContributorInterests] = useState<string[]>([]);
  const [contributorConsent, setContributorConsent] = useState<boolean>(false);
  const [isSubmittingContribution, setIsSubmittingContribution] = useState<boolean>(false);
  const [contributionSubmitted, setContributionSubmitted] = useState<boolean>(false);
  const [contributionError, setContributionError] = useState<string | null>(null);

  // Fetch colleges when state changes
  useEffect(() => {
    if (!formData.state || formData.state === "Outside India / International") {
      setCollegesList([]);
      return;
    }
    let isMounted = true;
    async function loadColleges() {
      try {
        setLoadingColleges(true);
        const res = await fetch(
          `/api/counselling/colleges?state=${encodeURIComponent(formData.state || "")}&pageSize=200`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.items) {
            const names = data.items
              .map((c: any) => c.collegeName)
              .filter(Boolean)
              .sort((a: string, b: string) => a.localeCompare(b));
            setCollegesList(names);
          }
        }
      } catch (e) {
        console.error("Failed to load colleges for state", e);
      } finally {
        if (isMounted) setLoadingColleges(false);
      }
    }
    loadColleges();
    return () => {
      isMounted = false;
    };
  }, [formData.state]);

  const handleCollegeChoiceChange = (choice: string) => {
    setSelectedCollegeChoice(choice);
    if (choice === "OTHER") {
      setFormData((prev) => ({
        ...prev,
        institutionName: otherInstitutionText.trim(),
      }));
    } else if (choice === "") {
      setFormData((prev) => ({
        ...prev,
        institutionName: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        institutionName: choice,
      }));
    }
    setValidationError(null);
  };

  const handleOtherInstitutionTextChange = (text: string) => {
    setOtherInstitutionText(text);
    if (selectedCollegeChoice === "OTHER" || !formData.state || formData.state === "Outside India / International") {
      setFormData((prev) => ({
        ...prev,
        institutionName: text.trim(),
      }));
    }
  };

  // -------------------------------------------------------------
  // MUTATION HANDLERS
  // -------------------------------------------------------------

  const handleSingleSelect = (field: keyof StudentVoiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleMultiToggle = (
    field:
      | "q3RewardingExperiences"
      | "q4HarderAspects"
      | "q5Surprises"
      | "q7NextBatchPriorities"
      | "q8UsefulPreparationTypes",
    value: string,
    maxLimit: number
  ) => {
    setFormData((prev) => {
      const currentList = (prev[field] as string[]) || [];
      const exists = currentList.includes(value);
      if (exists) {
        return {
          ...prev,
          [field]: currentList.filter((item) => item !== value),
        };
      }
      if (currentList.length >= maxLimit) {
        setValidationError(`You can select up to ${maxLimit} options for this question.`);
        return prev;
      }
      return {
        ...prev,
        [field]: [...currentList, value],
      };
    });
    setValidationError(null);
  };

  const handleQ6Rating = (statementId: string, rating: string) => {
    setFormData((prev) => ({
      ...prev,
      q6TransitionMatrix: {
        ...prev.q6TransitionMatrix,
        [statementId]: rating,
      },
    }));
    setValidationError(null);
  };

  const handleOtherTextChange = (questionKey: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      otherTexts: {
        ...prev.otherTexts,
        [questionKey]: text,
      },
    }));
  };

  // -------------------------------------------------------------
  // STEP VALIDATION
  // -------------------------------------------------------------

  const validateCurrentStep = (step: number): boolean => {
    setValidationError(null);

    // Section 1: Where Are You Now?
    if (step === 1) {
      if (!formData.trainingStage) {
        setValidationError("Please select where you are in your medical journey (Q1).");
        return false;
      }
      return true;
    }

    // Section 2: Then MBBS Actually Started...
    if (step === 2) {
      if (formData.q3RewardingExperiences.length === 0) {
        setValidationError("Please select at least one exciting or rewarding experience in Q3.");
        return false;
      }
      if (formData.q3RewardingExperiences.length > 4) {
        setValidationError("Please select up to 4 rewarding experiences only in Q3.");
        return false;
      }
      if (formData.q4HarderAspects.length === 0) {
        setValidationError("Please select at least one aspect that was harder than expected in Q4.");
        return false;
      }
      if (formData.q4HarderAspects.length > 5) {
        setValidationError("Please select up to 5 harder aspects only in Q4.");
        return false;
      }
      return true;
    }

    // Section 3: The Things Nobody Really Tells You
    if (step === 3) {
      if (formData.q5Surprises.length === 0) {
        setValidationError("Please select at least one surprising aspect in Q5.");
        return false;
      }
      if (formData.q5Surprises.length > 5) {
        setValidationError("Please select up to 5 surprises only in Q5.");
        return false;
      }
      return true;
    }

    // Section 4: How Did the Transition Actually Feel? (Q6 Matrix)
    if (step === 4) {
      for (const statement of Q6_STATEMENTS) {
        if (!formData.q6TransitionMatrix[statement.id]) {
          setValidationError(`Please rate statement ${statement.code}: "${statement.label}" in Q6.`);
          return false;
        }
      }
      return true;
    }

    // Section 5: If You Could Prepare the Next Batch...
    if (step === 5) {
      if (formData.q7NextBatchPriorities.length === 0) {
        setValidationError("Please select at least one priority area to prepare the next batch in Q7.");
        return false;
      }
      if (formData.q7NextBatchPriorities.length > 7) {
        setValidationError("Please select up to 7 priority areas only in Q7.");
        return false;
      }
      return true;
    }

    // Section 6: What Would Actually Have Helped?
    if (step === 6) {
      if (formData.q8UsefulPreparationTypes.length === 0) {
        setValidationError("Please select at least one useful preparation format in Q8.");
        return false;
      }
      if (formData.q8UsefulPreparationTypes.length > 5) {
        setValidationError("Please select up to 5 preparation formats only in Q8.");
        return false;
      }
      if (!formData.q9BestTiming) {
        setValidationError("Please select when preparation would have helped you most in Q9.");
        return false;
      }
      return true;
    }

    // Section 7: One Thing You Wish Someone Had Told You
    if (step === 7) {
      if (!formData.q10WishSomeoneTold || !formData.q10WishSomeoneTold.trim()) {
        setValidationError("Please complete the sentence: “Before I started MBBS, I wish someone had told me that...” in Q10.");
        return false;
      }
      if (formData.q10WishSomeoneTold.trim().length > 2000) {
        setValidationError("Response for Q10 must not exceed 2000 characters.");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -------------------------------------------------------------
  // FINAL SUBMISSION (Stage 1: Save Survey Response FIRST)
  // -------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep(7)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        ...formData,
        surveyVersion: "v2",
        source,
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
  // POST-SUBMISSION CONTRIBUTOR SUBMISSION (Stage 2: Optional)
  // -------------------------------------------------------------

  const handleContributionToggle = (interest: string) => {
    setContributorInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleContributorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContributionError(null);

    if (!submittedResponseId) {
      setContributionError("Missing survey reference ID. Please refresh and try again.");
      return;
    }

    if (!contributorName.trim()) {
      setContributionError("Please provide your name.");
      return;
    }

    const hasEmail = Boolean(contributorEmail.trim());
    const hasMobile = Boolean(contributorMobile.trim());

    if (!hasEmail && !hasMobile) {
      setContributionError("Please provide at least one contact method (Email or Mobile / WhatsApp).");
      return;
    }

    if (hasEmail && !EMAIL_REGEX.test(contributorEmail.trim())) {
      setContributionError("Please enter a valid email address.");
      return;
    }

    if (hasMobile && contributorMobile.trim().length < 7) {
      setContributionError("Please enter a valid mobile / WhatsApp number.");
      return;
    }

    if (!contributorConsent) {
      setContributionError("Please agree to be contacted regarding contribution opportunities.");
      return;
    }

    setIsSubmittingContribution(true);

    try {
      const res = await fetch("/api/mbbs-foundation/consultation/student-voice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId: submittedResponseId,
          respondentName: contributorName.trim(),
          email: contributorEmail.trim() || undefined,
          mobileWhatsapp: contributorMobile.trim() || undefined,
          contributionInterests: contributorInterests,
          consentForFollowup: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to save contribution interest. Please try again.");
      }

      setContributionSubmitted(true);
    } catch (err: any) {
      setContributionError(err.message || "Unable to save contribution interest. Please try again.");
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  // -------------------------------------------------------------
  // POST-SUBMISSION THANK YOU & PASS IT FORWARD VIEW
  // -------------------------------------------------------------

  if (isSubmittedSuccess) {
    const pConf = STUDENT_POST_SUBMIT_CONFIG;

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Stage 1 Success: Thank You Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-2xl font-black">
              ✓
            </div>
            <div className="block">
              <span className="inline-block rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                {pConf.thankYou.badge}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              {pConf.thankYou.headline}
            </h2>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl mx-auto border-t border-b border-slate-100 py-5">
            {pConf.thankYou.body.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div className="rounded-2xl bg-blue-50/70 border border-blue-200/80 p-4 sm:p-5 max-w-2xl mx-auto space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-blue-950 leading-relaxed italic">
              “{pConf.thankYou.quoteReflectionNote}”
            </p>
          </div>

          {submittedResponseId && (
            <div className="text-center pt-1">
              <span className="text-[11px] text-slate-400 font-mono">
                Consultation Reference ID: {submittedResponseId}
              </span>
            </div>
          )}
        </section>

        {/* Stage 2: PASS IT FORWARD Action Card */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white p-6 sm:p-10 shadow-xl space-y-6 border border-slate-800">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600/30 border border-red-500/50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-200">
              <span>🤝</span> {pConf.passItForward.badge}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {pConf.passItForward.headline}
            </h3>

            <p className="text-base sm:text-lg font-bold text-red-300">
              {pConf.passItForward.subheadline}
            </p>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed border-t border-white/10 pt-4 max-w-3xl">
            {pConf.passItForward.body.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-5 text-center">
            <p className="text-sm sm:text-base font-black text-amber-300 tracking-wide">
              ✨ {pConf.passItForward.prominentLine}
            </p>
          </div>

          {/* Contribution CTA / Panel Reveal */}
          {!showContributionPanel && !contributionSubmitted && (
            <div className="pt-2 text-center sm:text-left">
              <button
                type="button"
                onClick={() => setShowContributionPanel(true)}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm px-8 py-4 shadow-lg transition transform hover:scale-[1.01] cursor-pointer"
              >
                <span>🤝</span>
                <span>{pConf.passItForward.ctaLabel}</span>
              </button>
            </div>
          )}

          {/* Optional Contributor Form Panel */}
          {showContributionPanel && !contributionSubmitted && (
            <form
              onSubmit={handleContributorSubmit}
              className="rounded-2xl bg-slate-900/90 border border-white/20 p-5 sm:p-7 space-y-6 animate-fadeIn text-slate-100"
            >
              <div>
                <h4 className="text-base sm:text-lg font-black text-white">
                  {pConf.contributorForm.heading}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {pConf.contributorForm.subheading}
                </p>
              </div>

              {/* Contribution Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pConf.contributorForm.options.map((opt) => {
                  const isChecked = contributorInterests.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleContributionToggle(opt)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "bg-red-950/80 border-red-500 text-white font-bold ring-1 ring-red-500/50"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span className="pr-2">{opt}</span>
                      <span
                        className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] ${
                          isChecked
                            ? "border-red-500 bg-red-600 text-white"
                            : "border-slate-500 bg-slate-800"
                        }`}
                      >
                        {isChecked ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Contributor Contact Inputs */}
              <div className="space-y-3 pt-4 border-t border-slate-700/80">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {pConf.contributorForm.contactHeading}
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {pConf.contributorForm.nameLabel} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      placeholder={pConf.contributorForm.namePlaceholder}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {pConf.contributorForm.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={contributorEmail}
                      onChange={(e) => setContributorEmail(e.target.value)}
                      placeholder={pConf.contributorForm.emailPlaceholder}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {pConf.contributorForm.mobileLabel}
                    </label>
                    <input
                      type="tel"
                      value={contributorMobile}
                      onChange={(e) => setContributorMobile(e.target.value)}
                      placeholder={pConf.contributorForm.mobilePlaceholder}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contributorConsent}
                      onChange={(e) => setContributorConsent(e.target.checked)}
                      className="mt-0.5 accent-red-600 h-4 w-4 rounded shrink-0 cursor-pointer"
                    />
                    <span>{pConf.contributorForm.consentText}</span>
                  </label>
                </div>

                {contributionError && (
                  <div className="rounded-xl bg-red-900/60 border border-red-700 p-3 text-xs text-red-200">
                    ⚠️ {contributionError}
                  </div>
                )}

                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingContribution}
                    className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                  >
                    {isSubmittingContribution ? "Saving..." : pConf.contributorForm.submitCta}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowContributionPanel(false)}
                    className="px-4 py-3 rounded-xl bg-transparent hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Contribution Success Message */}
          {contributionSubmitted && (
            <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/80 p-5 sm:p-6 space-y-2 text-emerald-100 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <span>✓</span>
                <span>Contributor Details Registered</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                {pConf.contributorForm.successMessage}
              </p>
            </div>
          )}
        </section>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/mbbs-foundation/consultation"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-700 transition"
          >
            ← Return to MBBS Foundation Consultation Hub
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SURVEY FORM RENDERER (SECTIONS 1 THROUGH 7)
  // -------------------------------------------------------------

  const sec1 = STUDENT_SURVEY_SECTIONS_CONFIG[0];
  const sec2 = STUDENT_SURVEY_SECTIONS_CONFIG[1];
  const sec3 = STUDENT_SURVEY_SECTIONS_CONFIG[2];
  const sec4 = STUDENT_SURVEY_SECTIONS_CONFIG[3];
  const sec5 = STUDENT_SURVEY_SECTIONS_CONFIG[4];
  const sec6 = STUDENT_SURVEY_SECTIONS_CONFIG[5];
  const sec7 = STUDENT_SURVEY_SECTIONS_CONFIG[6];

  return (
    <div className="space-y-6">
      {/* 7-Section Progress Bar */}
      <SurveyProgress
        currentStep={currentStep}
        totalSteps={7}
        stepTitle={SECTION_TITLES[currentStep - 1]}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm font-semibold text-red-800 flex items-start gap-2.5 shadow-xs animate-shake">
          <span className="text-base leading-none">⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Error Banner */}
      {submitError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs sm:text-sm font-semibold text-red-800 flex items-start gap-2.5 shadow-xs">
          <span className="text-base leading-none">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================= */}
        {/* SECTION 1 — WHERE ARE YOU NOW?                            */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 1 of 7
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec1.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec1.description}
              </p>
            </div>

            {/* Q1: Training Stage */}
            <div className="space-y-3">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q1. Where are you currently in your medical journey? <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Q1_TRAINING_STAGE_OPTIONS.map((stage) => {
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

            {/* Q2: College Type, State & Medical College */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q2. Tell us a little about your medical college.{" "}
                  <span className="text-xs font-normal text-slate-500">(Optional)</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  College type:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Q2_COLLEGE_TYPE_OPTIONS.map((type) => {
                  const isSelected = formData.collegeType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSingleSelect("collegeType", type)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
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

              {/* State / UT */}
              <div className="space-y-2 pt-3">
                <label htmlFor="student-state-select" className="block text-xs font-bold text-slate-700">
                  State / Union Territory
                </label>
                <select
                  id="student-state-select"
                  value={formData.state}
                  onChange={(e) => {
                    handleSingleSelect("state", e.target.value);
                    setSelectedCollegeChoice("");
                    setOtherInstitutionText("");
                  }}
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

              {/* Medical College Dropdown */}
              {formData.state && formData.state !== "Outside India / International" && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700">
                    Medical College (Optional)
                  </label>
                  <select
                    value={selectedCollegeChoice}
                    onChange={(e) => handleCollegeChoiceChange(e.target.value)}
                    disabled={loadingColleges}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-800 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                  >
                    <option value="">
                      {loadingColleges
                        ? "Loading medical colleges..."
                        : `-- Select Medical College in ${formData.state} --`}
                    </option>
                    {collegesList.map((colName) => (
                      <option key={colName} value={colName}>
                        {colName}
                      </option>
                    ))}
                    <option value="OTHER">Other / Not listed</option>
                  </select>
                </div>
              )}

              {/* Free-text input for unlisted institution */}
              {(selectedCollegeChoice === "OTHER" ||
                formData.state === "Outside India / International" ||
                (!selectedCollegeChoice && collegesList.length === 0 && formData.state)) && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700">
                    Institution / Medical College Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={otherInstitutionText}
                    onChange={(e) => handleOtherInstitutionTextChange(e.target.value)}
                    placeholder="e.g., Medical College Name..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 2 — THEN MBBS ACTUALLY STARTED...                 */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 2 of 7
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec2.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec2.description}
              </p>
            </div>

            {/* Q3: Rewarding Experiences (Max 4) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q3. What turned out to be more exciting or rewarding about MBBS than you had expected? <span className="text-red-600">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-mono">
                  {formData.q3RewardingExperiences.length} / 4 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose up to 4.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {Q3_REWARDING_OPTIONS.map((opt) => {
                  const isSelected = formData.q3RewardingExperiences.includes(opt);
                  const isMaxed = formData.q3RewardingExperiences.length >= 4 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q3RewardingExperiences", opt, 4)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
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
              {formData.q3RewardingExperiences.includes("Other") && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Please specify other rewarding experience..."
                    value={formData.otherTexts?.q3 || ""}
                    onChange={(e) => handleOtherTextChange("q3", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Q4: Harder Than Expected (Max 5) */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q4. Now the other side: what was harder than you expected when you entered MBBS? <span className="text-red-600">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-mono">
                  {formData.q4HarderAspects.length} / 5 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose up to 5.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {Q4_HARDER_OPTIONS.map((opt) => {
                  const isSelected = formData.q4HarderAspects.includes(opt);
                  const isMaxed = formData.q4HarderAspects.length >= 5 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q4HarderAspects", opt, 5)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
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
              {formData.q4HarderAspects.includes("Other") && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Please specify other harder aspect..."
                    value={formData.otherTexts?.q4 || ""}
                    onChange={(e) => handleOtherTextChange("q4", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 3 — THE THINGS NOBODY REALLY TELLS YOU            */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 3 of 7
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec3.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec3.description}
              </p>
            </div>

            {/* Q5: Surprises (Max 5, exact order) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q5. Which of these surprised you after entering medical college? <span className="text-red-600">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-mono">
                  {formData.q5Surprises.length} / 5 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose up to 5.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {Q5_SURPRISES_OPTIONS.map((opt, idx) => {
                  const isSelected = formData.q5Surprises.includes(opt);
                  const isMaxed = formData.q5Surprises.length >= 5 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q5Surprises", opt, 5)}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
                          : isMaxed
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 pr-2">
                        <span className="text-[11px] font-mono text-slate-400 font-bold shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </div>
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
              {formData.q5Surprises.includes("Other") && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Please specify other surprise..."
                    value={formData.otherTexts?.q5 || ""}
                    onChange={(e) => handleOtherTextChange("q5", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 4 — HOW DID THE TRANSITION ACTUALLY FEEL?         */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 4 of 7
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec4.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec4.description}
              </p>
            </div>

            {/* Q6: 8-Statement Matrix */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q6. During your early months in MBBS, how often did you experience the following? <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Rate each statement on the 5-point scale (Never to Very often).
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                {Q6_STATEMENTS.map((statement) => {
                  const currentRating = formData.q6TransitionMatrix[statement.id];
                  return (
                    <div
                      key={statement.id}
                      className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition ${
                        currentRating
                          ? "border-slate-200 bg-slate-50/70"
                          : "border-red-200/60 bg-red-50/20"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-black">
                          {statement.code}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {statement.label}
                        </p>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {Q6_RATING_SCALE.map((rating) => {
                          const isSelected = currentRating === rating;
                          return (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleQ6Rating(statement.id, rating)}
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
        {/* SECTION 5 — IF YOU COULD PREPARE THE NEXT BATCH...        */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 5 of 7
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec5.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec5.description}
              </p>
            </div>

            {/* Q7: Priorities for Next Batch (Max 7) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q7. Imagine you have 3 hours with a NEET-qualified student before their first day of medical college. What would you make sure they understood? <span className="text-red-600">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-mono">
                  {formData.q7NextBatchPriorities.length} / 7 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose up to 7.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {Q7_NEXT_BATCH_OPTIONS.map((opt) => {
                  const isSelected = formData.q7NextBatchPriorities.includes(opt);
                  const isMaxed = formData.q7NextBatchPriorities.length >= 7 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q7NextBatchPriorities", opt, 7)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
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
              {formData.q7NextBatchPriorities.includes("Other") && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Please specify other topic..."
                    value={formData.otherTexts?.q7 || ""}
                    onChange={(e) => handleOtherTextChange("q7", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 6 — WHAT WOULD ACTUALLY HAVE HELPED?              */}
        {/* ========================================================= */}
        {currentStep === 6 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 6 of 7
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec6.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec6.description}
              </p>
            </div>

            {/* Q8: Useful Preparation Formats (Max 5, neutral 1st option) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q8. If you could go back to the weeks before you entered MBBS, which kind of preparation would you genuinely have found useful? <span className="text-red-600">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-mono">
                  {formData.q8UsefulPreparationTypes.length} / 5 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose up to 5.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {Q8_PREPARATION_OPTIONS.map((opt) => {
                  const isSelected = formData.q8UsefulPreparationTypes.includes(opt);
                  const isMaxed = formData.q8UsefulPreparationTypes.length >= 5 && !isSelected;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isMaxed}
                      onClick={() => handleMultiToggle("q8UsefulPreparationTypes", opt, 5)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs"
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
              {formData.q8UsefulPreparationTypes.includes("Other") && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Please specify other preparation format..."
                    value={formData.otherTexts?.q8 || ""}
                    onChange={(e) => handleOtherTextChange("q8", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Q9: Optimal Timing (Single Select) */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-bold text-slate-900">
                Q9. Looking back, when would this preparation have helped you most? <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2 pt-1">
                {Q9_TIMING_OPTIONS.map((opt) => {
                  const isSelected = formData.q9BestTiming === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSingleSelect("q9BestTiming", opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-red-50 border-red-600 text-red-950 ring-2 ring-red-600/20 shadow-xs font-bold"
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
        {/* SECTION 7 — ONE THING YOU WISH SOMEONE HAD TOLD YOU       */}
        {/* ========================================================= */}
        {currentStep === 7 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-block rounded-md bg-red-50 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Section 7 of 7
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {sec7.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {sec7.description}
              </p>
            </div>

            {/* Q10: Open Text Reflection & Optional Quote Permission */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm sm:text-base font-bold text-slate-900">
                  Q10. Complete this sentence: “Before I started MBBS, I wish someone had told me that...” <span className="text-red-600">*</span>
                </label>
                <span
                  className={`text-xs font-mono font-semibold ${
                    formData.q10WishSomeoneTold.length > 2000
                      ? "text-red-700 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {formData.q10WishSomeoneTold.length} / 2000
                </span>
              </div>
              <p className="text-xs text-slate-500">
                It can be serious, practical, surprising, funny—or something you learned the hard way.
              </p>

              <textarea
                value={formData.q10WishSomeoneTold}
                maxLength={2000}
                onChange={(e) => handleSingleSelect("q10WishSomeoneTold", e.target.value)}
                placeholder="Before I started MBBS, I wish someone had told me that..."
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-xs sm:text-sm font-medium text-slate-800 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />

              {/* Optional Permission Checkbox (Unselected by default) */}
              <div className="pt-3">
                <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition">
                  <input
                    type="checkbox"
                    checked={formData.quotePermission === true}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, quotePermission: e.target.checked }))
                    }
                    className="mt-0.5 accent-red-700 h-4 w-4 rounded shrink-0 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                    I am comfortable with this response being quoted anonymously in MBBS Foundation educational or awareness material.
                  </span>
                </label>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* ACTION BUTTONS & FINAL SUBMISSION                         */}
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

          {currentStep < 7 ? (
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
                  : "bg-gradient-to-r from-red-700 via-red-800 to-slate-900 hover:from-red-800 hover:to-black hover:shadow-lg"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Submitting Response...</span>
                </>
              ) : (
                <>
                  <span>SUBMIT MY STUDENT VOICE</span>
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
