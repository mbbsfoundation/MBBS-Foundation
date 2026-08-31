"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ConsultationSource,
  ProfessionalSurveyFormData,
  INITIAL_PROFESSIONAL_SURVEY_FORM_DATA,
  PROFESSIONAL_ROLES_OPTIONS,
  SPECIALTY_OPTIONS,
  TEACHING_EXPERIENCE_OPTIONS,
  INDIAN_STATES_AND_UTS,
  READINESS_DOMAINS,
  READINESS_RATING_OPTIONS,
  Q8_OPTIONS,
  Q11_OPTIONS,
  Q15_OPTIONS,
  Q16_LIMITATIONS_OPTIONS,
  Q17_WORKSHOP_FORMATS_OPTIONS,
  Q19_CONTRIBUTION_INTEREST_OPTIONS,
  Q20_CONTRIBUTION_TYPES_OPTIONS,
  Q22_TIME_COMMITMENT_OPTIONS,
  Q23_STUDENT_CONNECTION_OPTIONS,
  Q24_READINESS_SHARING_OPTIONS,
  Q28_CONSENT_OPTIONS,
} from "@/lib/mbbs-foundation/consultationTypes";
import {
  SURVEY_SECTIONS_CONFIG,
  SURVEY_INTRODUCTIONS,
  SUCCESS_SCREEN_CONFIG,
  SURVEY_METADATA,
} from "@/lib/mbbs-foundation/professionalSurveyConfig";
import SurveyProgress from "./SurveyProgress";

interface ProfessionalSurveyFormProps {
  initialSource?: ConsultationSource;
}

const SECTION_TITLES = SURVEY_SECTIONS_CONFIG.map((s) => s.title);

export default function ProfessionalSurveyForm({
  initialSource = "direct",
}: ProfessionalSurveyFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProfessionalSurveyFormData>({
    ...INITIAL_PROFESSIONAL_SURVEY_FORM_DATA,
    source: initialSource,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompletedPreview, setIsCompletedPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // FORM MUTATION HELPERS
  // -------------------------------------------------------------

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(role);
      const updated = exists
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: updated };
    });
    setValidationError(null);
  };

  const handleReadinessRatingChange = (domainId: string, rating: string) => {
    setFormData((prev) => ({
      ...prev,
      readinessRatings: {
        ...prev.readinessRatings,
        [domainId]: rating,
      },
    }));
    setValidationError(null);
  };

  const handleQ9EmphasisToggle = (domainId: string) => {
    setFormData((prev) => {
      const exists = prev.q9EmphasisAreas.includes(domainId);
      if (exists) {
        return {
          ...prev,
          q9EmphasisAreas: prev.q9EmphasisAreas.filter((id) => id !== domainId),
        };
      }
      if (prev.q9EmphasisAreas.length >= 5) {
        return prev; // Max 5 limit
      }
      return {
        ...prev,
        q9EmphasisAreas: [...prev.q9EmphasisAreas, domainId],
      };
    });
    setValidationError(null);
  };

  const handleQ16LimitationsToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.q16Limitations.includes(item);
      if (exists) {
        return {
          ...prev,
          q16Limitations: prev.q16Limitations.filter((i) => i !== item),
        };
      }
      if (prev.q16Limitations.length >= 3) {
        return prev; // Max 3 limit
      }
      return {
        ...prev,
        q16Limitations: [...prev.q16Limitations, item],
      };
    });
    setValidationError(null);
  };

  const handleQ17FormatsToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.q17UsefulFormats.includes(item);
      if (exists) {
        return {
          ...prev,
          q17UsefulFormats: prev.q17UsefulFormats.filter((i) => i !== item),
        };
      }
      if (prev.q17UsefulFormats.length >= 5) {
        return prev; // Max 5 limit
      }
      return {
        ...prev,
        q17UsefulFormats: [...prev.q17UsefulFormats, item],
      };
    });
    setValidationError(null);
  };

  const handleQ20ContributionTypeToggle = (type: string) => {
    setFormData((prev) => {
      const exists = prev.q20ContributionTypes.includes(type);
      const updated = exists
        ? prev.q20ContributionTypes.filter((t) => t !== type)
        : [...prev.q20ContributionTypes, type];
      return { ...prev, q20ContributionTypes: updated };
    });
  };

  const handleQ19Change = (value: string) => {
    const isInterested = value !== "Not at present";
    setFormData((prev) => ({
      ...prev,
      q19InterestedInContributing: value,
      interestedInContributing: isInterested,
    }));
    setValidationError(null);
  };

  const handleQ24Change = (value: string) => {
    const isWilling = value === "Yes" || value === "Possibly";
    setFormData((prev) => ({
      ...prev,
      q24WillingToShareReadiness: value,
      willingToShareReadinessSurvey: isWilling,
    }));
    setValidationError(null);
  };

  const handleQ28ConsentChange = (value: string) => {
    const isConsenting = value === "Yes";
    setFormData((prev) => ({
      ...prev,
      q28ConsentForContact: value,
      consentForFollowup: isConsenting,
    }));
    setValidationError(null);
  };

  // -------------------------------------------------------------
  // STEP VALIDATION
  // -------------------------------------------------------------

  const validateCurrentStep = (): boolean => {
    setValidationError(null);

    // Step 1 Validation
    if (currentStep === 1) {
      if (formData.roles.length === 0) {
        setValidationError("Please select at least one professional role in Q1.");
        return false;
      }
    }

    // Step 2 Validation
    if (currentStep === 2) {
      // Check all 14 domains in Q7
      const missingDomain = READINESS_DOMAINS.find(
        (d) => !formData.readinessRatings[d.id]
      );
      if (missingDomain) {
        setValidationError(
          `Please provide a rating for item ${missingDomain.code} ("${missingDomain.label.substring(0, 40)}...") in Q7.`
        );
        return false;
      }

      if (!formData.q8OrientationEffectiveness) {
        setValidationError("Please answer Q8 regarding orientation effectiveness.");
        return false;
      }

      if (formData.q9EmphasisAreas.length === 0) {
        setValidationError("Please select at least one area in Q9 (up to 5).");
        return false;
      }

      if (!formData.q11NeedForComplementaryResource) {
        setValidationError("Please answer Q11 regarding the need for a complementary resource.");
        return false;
      }
    }

    // Step 3 Validation
    if (currentStep === 3) {
      if (!formData.q13WishTaughtAtBeginning.trim()) {
        setValidationError("Please share at least a short response for Q13.");
        return false;
      }
    }

    // Step 4 Validation
    if (currentStep === 4) {
      if (!formData.q15FoundationCourseDescription) {
        setValidationError("Please select an option for Q15.");
        return false;
      }
    }

    // Step 5 Validation (Q17 & Q18 are optional / recommended, no hard block unless needed)

    // Step 6 Validation
    if (currentStep === 6) {
      if (!formData.q19InterestedInContributing) {
        setValidationError("Please select an option for Q19 regarding contribution interest.");
        return false;
      }
    }

    // Step 7 Validation
    if (currentStep === 7) {
      if (!formData.q23ConnectedWithNewStudents) {
        setValidationError("Please answer Q23 regarding student connection.");
        return false;
      }
      if (!formData.q24WillingToShareReadiness) {
        setValidationError("Please answer Q24 regarding the Readiness Check.");
        return false;
      }
    }

    // Step 8 Validation
    if (currentStep === 8) {
      if (!formData.q28ConsentForContact) {
        setValidationError("Please select Yes or No for Q28 regarding contact permission.");
        return false;
      }

      // If email is provided, validate format
      if (formData.email && formData.email.trim().length > 0) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email.trim())) {
          setValidationError("Please enter a valid email address, or leave it blank.");
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }

    if (currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 300, behavior: "smooth" });
    } else {
      // Reached final review
      setIsCompletedPreview(true);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setValidationError(null);
    if (isCompletedPreview) {
      setIsCompletedPreview(false);
      setCurrentStep(8);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  const shouldShowContributionBranch =
    formData.q19InterestedInContributing &&
    formData.q19InterestedInContributing !== "Not at present";

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/mbbs-foundation/consultation/professional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(
          data.error ||
            (data.errors && data.errors.join(". ")) ||
            "We could not submit your response just now. Your answers remain on this page. Please try again."
        );
        return;
      }

      setSubmittedResponseId(data.responseId || null);
      setIsSubmittedSuccess(true);
      setIsCompletedPreview(false);
      window.scrollTo({ top: 300, behavior: "smooth" });
    } catch {
      setSubmitError(
        "We could not submit your response just now. Your answers remain on this page. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN (PROMPT 6 POST-SUBMISSION THANK YOU FLOW)
  // -------------------------------------------------------------
  if (isSubmittedSuccess) {
    const isInterestedInContributing =
      formData.q19InterestedInContributing &&
      formData.q19InterestedInContributing !== "Not at present";

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          {/* Header & Confirmation */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <span>✓</span> Response Confirmed
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950">
              Thank You for Helping Shape a Better Beginning in Medicine
            </h1>

            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 sm:p-5 text-xs sm:text-sm text-emerald-950 space-y-2">
              <p className="font-bold text-sm sm:text-base text-emerald-900">
                Your response has been securely received.
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Your experience and suggestions will contribute to the development of the <strong>MBBS Foundation Workshop and supporting learning resources for incoming medical students</strong>.
              </p>
            </div>
          </div>

          {/* Conditional Contributor Message */}
          {isInterestedInContributing && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50/40 p-5 sm:p-6 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🤝</span>
                <h2 className="text-sm sm:text-base font-black text-red-950">
                  You May Be Part of the Next Step
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                You indicated that you may be interested in contributing to the MBBS Foundation initiative.
              </p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                As workshop modules, scenarios, learning activities, videos and review opportunities are developed, <strong>AHA India may contact you according to the areas you selected and the needs of the programme</strong>.
              </p>
            </div>
          )}

          {/* Next-Generation Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Help Us Hear From the Next Generation
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              The next phase of the initiative will include an <strong>MBBS Entry Readiness Check</strong> for newly admitted and first-year MBBS students.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              It will help students reflect on their preparedness for the transition into medical college while helping us understand the actual needs of the incoming MBBS cohort.
            </p>
            <div className="pt-1">
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 text-slate-500 font-bold px-5 py-2.5 text-xs sm:text-sm border border-slate-300 cursor-not-allowed"
              >
                <span>🔒</span>
                <span>MBBS Entry Readiness Check — Coming Soon</span>
              </button>
            </div>
          </div>

          {/* About the MBBS Foundation Initiative Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              About the MBBS Foundation Initiative
            </h3>
            <p>
              <strong>MBBS Foundation</strong> is being developed as a structured student-readiness and transition initiative supporting young learners as they move from entrance preparation into medical education, clinical exposure and professional development.
            </p>
            <p>
              <strong>Ayurvigyan Health Academy India Foundation (AHA India)</strong> is facilitating the consultation, workshop development and educational collaboration.
            </p>
            <p>
              <strong>MBBS Foundation: Your First Book of Medicine</strong> serves as the principal structured reference resource for the initiative.
            </p>
          </div>

          {/* Return & Navigation Options */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/mbbs-foundation/consultation"
              className="rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-slate-950 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:from-red-800 hover:to-black transition inline-flex items-center gap-2"
            >
              <span>← Back to MBBS Foundation Consultation</span>
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5"
            >
              <span>Visit MBBS Foundation Website</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REVIEW & COMPLETE SCREEN
  // -------------------------------------------------------------
  if (isCompletedPreview) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <section className="rounded-2xl border-2 border-slate-300 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-800 border border-emerald-300">
              ✓
            </span>
            <div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-0.5 text-xs font-black uppercase tracking-wider">
                Review &amp; Ready to Submit
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                Review Your Consultation Responses
              </h2>
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs sm:text-sm font-bold text-rose-900 flex items-start gap-2 shadow-2xs">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p>{submitError}</p>
                <p className="mt-1 text-xs font-normal text-rose-800">
                  Your entered responses are preserved. You can adjust them or click Submit Consultation again.
                </p>
              </div>
            </div>
          )}

          {/* Quick Summary Preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-xs sm:text-sm">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs">
              Response Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-700">
              <div>
                <span className="text-slate-500 font-medium">Selected Roles:</span>{" "}
                <strong>{formData.roles.join(", ")}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Specialty:</span>{" "}
                <strong>{formData.specialty || "Not specified"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Emphasis Areas (Q9):</span>{" "}
                <strong>{formData.q9EmphasisAreas.length} selected</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Contribution Interest:</span>{" "}
                <strong>{formData.q19InterestedInContributing || "Not answered"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Willing to Share Readiness:</span>{" "}
                <strong>{formData.q24WillingToShareReadiness || "Not answered"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Follow-up Contact Consent:</span>{" "}
                <strong>{formData.q28ConsentForContact || "Not answered"}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              ← Edit Responses
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-slate-950 px-8 py-3 text-xs sm:text-base font-black text-white shadow-lg hover:from-red-800 hover:to-black transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Submitting securely...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Submit Consultation</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN MULTI-STEP SURVEY UI
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <SurveyProgress
        currentStep={currentStep}
        totalSteps={8}
        stepTitle={SECTION_TITLES[currentStep - 1]}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs sm:text-sm font-bold text-rose-900 flex items-start gap-2 shadow-2xs">
          <span className="text-base leading-none">⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Form Container Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-9 shadow-sm space-y-8">
        {/* ========================================================= */}
        {/* SECTION 1: ABOUT YOU */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 1 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                About You
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Please help us understand your professional background and clinical/teaching perspective.
              </p>
            </div>

            {/* Q1. Professional Roles */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q1. Which of the following best describe your current professional role? <span className="text-red-700">*</span>
              </label>
              <p className="text-xs text-slate-500 font-medium">Select all that apply.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {PROFESSIONAL_ROLES_OPTIONS.map((role) => {
                  const isChecked = formData.roles.includes(role);
                  return (
                    <label
                      key={role}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        isChecked
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRoleToggle(role)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm leading-snug">{role}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q2. Specialty */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q2. Your primary specialty / department <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <select
                value={formData.specialty || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, specialty: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              >
                <option value="">Select Specialty / Department...</option>
                {SPECIALTY_OPTIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Q3. Teaching Experience */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q3. Your teaching / mentoring experience <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>

              <div className="space-y-2">
                {TEACHING_EXPERIENCE_OPTIONS.map((exp) => {
                  const isSelected = formData.teachingExperience === exp;
                  return (
                    <label
                      key={exp}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="teachingExperience"
                        checked={isSelected}
                        onChange={() => setFormData((prev) => ({ ...prev, teachingExperience: exp }))}
                        className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm">{exp}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q4, Q5, Q6: Location & Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5 sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Q4. Institution / Organisation <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.institutionName || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, institutionName: e.target.value }))}
                  placeholder="e.g. Government Medical College / Hospital"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Q5. City <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g. Pune, Indore, Patna"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Q6. State / UT <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <select
                  value={formData.state || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
                >
                  <option value="">Select State / UT...</option>
                  {INDIAN_STATES_AND_UTS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: READINESS FOR CLINICAL EXPOSURE */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 2 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                From Entry into MBBS to Clinical Exposure: How Ready Are Our Students?
              </h2>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/90 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <p>
                  The introduction of the <strong>Foundation Course, Early Clinical Exposure (ECE)</strong> and competency-based medical education has increased emphasis on preparing students not only in knowledge, but also in communication, professionalism, clinical orientation, skills and their transition into the medical profession.
                </p>
                <p>
                  Implementation and student experience, however, may vary across institutions and settings.
                </p>
                <p className="font-semibold text-slate-900">
                  Thinking about students <strong>by the time they begin meaningful patient interaction, ward postings or early clinical exposure</strong>, please share your experience of how prepared they generally appear in the following areas.
                </p>
              </div>
            </div>

            {/* Q7. Rating Matrix / Mobile Stacked Cards */}
            <div className="space-y-4 pt-2">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q7. By the time MBBS students begin meaningful patient interaction, ward postings or clinical exposure, how well prepared do they generally appear in the following areas? <span className="text-red-700">*</span>
              </label>

              <div className="space-y-4">
                {READINESS_DOMAINS.map((domain) => {
                  const currentRating = formData.readinessRatings[domain.id];
                  return (
                    <div
                      key={domain.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition ${
                        currentRating
                          ? "bg-white border-slate-300 shadow-xs"
                          : "bg-slate-50/60 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 mb-3">
                        <span className="h-6 w-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                          {domain.code}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {domain.label}
                        </p>
                      </div>

                      {/* Tap-Friendly Rating Options */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                        {READINESS_RATING_OPTIONS.map((opt) => {
                          const isSelected = currentRating === opt;
                          return (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleReadinessRatingChange(domain.id, opt)}
                              className={`p-2.5 rounded-xl text-center text-[11px] font-semibold transition border cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? "bg-red-700 text-white border-red-700 font-bold shadow-xs scale-[1.02]"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Q8. Orientation Effectiveness */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q8. In your experience, how effectively do the current Foundation Course, Early Clinical Exposure and other early-MBBS orientation activities prepare students for this transition? <span className="text-red-700">*</span>
              </label>

              <div className="space-y-2">
                {Q8_OPTIONS.map((opt) => {
                  const isSelected = formData.q8OrientationEffectiveness === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q8Effectiveness"
                        checked={isSelected}
                        onChange={() => setFormData((prev) => ({ ...prev, q8OrientationEffectiveness: opt }))}
                        className="mt-0.5 h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm leading-snug">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q9. Greater Emphasis Areas (Select up to 5) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-black text-slate-900">
                  Q9. Which FIVE areas should receive greater emphasis before or during students' transition to meaningful clinical exposure? <span className="text-red-700">*</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  {formData.q9EmphasisAreas.length} of 5 selected
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Select up to five priority domains.</p>

              <div className="space-y-2 pt-1">
                {READINESS_DOMAINS.map((domain) => {
                  const isChecked = formData.q9EmphasisAreas.includes(domain.id);
                  const isMaxReached = formData.q9EmphasisAreas.length >= 5 && !isChecked;
                  return (
                    <label
                      key={domain.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition select-none ${
                        isChecked
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs cursor-pointer"
                          : isMaxReached
                          ? "bg-slate-50/30 border-slate-200/50 text-slate-400 cursor-not-allowed opacity-60"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isMaxReached}
                        onChange={() => handleQ9EmphasisToggle(domain.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs sm:text-sm leading-snug">
                        <strong>[{domain.code}]</strong> {domain.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q10. One Change Suggestion */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q10. In your opinion, what ONE change would most improve the effectiveness of the Foundation Course / early MBBS preparation for subsequent clinical exposure? <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.q10OneChangeSuggestion || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, q10OneChangeSuggestion: e.target.value }))}
                placeholder="Share your primary recommendation..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>

            {/* Q11. Need for Complementary Resource */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q11. Overall, do you feel there is a need for a more structured, engaging and longitudinal student-readiness resource that complements the institutional Foundation Course and continues to support students as they progress towards clinical exposure? <span className="text-red-700">*</span>
              </label>

              <div className="space-y-2">
                {Q11_OPTIONS.map((opt) => {
                  const isSelected = formData.q11NeedForComplementaryResource === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q11Need"
                        checked={isSelected}
                        onChange={() => setFormData((prev) => ({ ...prev, q11NeedForComplementaryResource: opt }))}
                        className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q12. Make Resource Useful */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q12. What would make such a resource genuinely useful rather than simply adding another teaching requirement? <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={formData.q12MakeResourceUseful || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, q12MakeResourceUseful: e.target.value }))}
                placeholder="What key characteristics would ensure high adoption and genuine value?"
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: LOOKING BACK */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 3 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                Looking Back
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Reflecting on personal transitions and observations of student journeys over time.
              </p>
            </div>

            {/* Q13. One thing wish someone had taught */}
            <div className="space-y-2 pt-2">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q13. Thinking back to your own entry into medical college: What is one thing you wish someone had taught, explained or discussed with you at the beginning? <span className="text-red-700">*</span>
              </label>
              <p className="text-xs text-slate-500 font-medium">A concise, candid response is very helpful.</p>
              <textarea
                rows={4}
                value={formData.q13WishTaughtAtBeginning}
                onChange={(e) => setFormData((prev) => ({ ...prev, q13WishTaughtAtBeginning: e.target.value }))}
                placeholder="What insight, perspective, study method, or advice would have made a big difference?"
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>

            {/* Q14. Challenge apparent later */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q14. In your experience with current students, what is one challenge that tends to become apparent only after they have spent some time in medical college? <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.q14ChallengeApparentLater || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, q14ChallengeApparentLater: e.target.value }))}
                placeholder="e.g. burnout, clinical hesitation, exam stress, communication hurdles..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: FOUNDATION COURSE & EARLY CLINICAL EXPOSURE */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 4 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                Foundation Course &amp; Early Clinical Exposure
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Understanding current institutional delivery and structural challenges.
              </p>
            </div>

            {/* Q15. Description of Foundation Course */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q15. How would you describe the Foundation Course / orientation currently available to new MBBS students at institutions you are familiar with? <span className="text-red-700">*</span>
              </label>

              <div className="space-y-2">
                {Q15_OPTIONS.map((opt) => {
                  const isSelected = formData.q15FoundationCourseDescription === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q15Description"
                        checked={isSelected}
                        onChange={() => setFormData((prev) => ({ ...prev, q15FoundationCourseDescription: opt }))}
                        className="mt-0.5 h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm leading-snug">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q16. Commonly limits effectiveness (Select up to 3) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-black text-slate-900">
                  Q16. What commonly limits the effectiveness of MBBS-entry/Foundation Course orientation? <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  {formData.q16Limitations.length} of 3 selected
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Select up to three factors.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {Q16_LIMITATIONS_OPTIONS.map((lim) => {
                  const isChecked = formData.q16Limitations.includes(lim);
                  const isMaxReached = formData.q16Limitations.length >= 3 && !isChecked;
                  return (
                    <label
                      key={lim}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition select-none ${
                        isChecked
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs cursor-pointer"
                          : isMaxReached
                          ? "bg-slate-50/30 border-slate-200/50 text-slate-400 cursor-not-allowed opacity-60"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isMaxReached}
                        onChange={() => handleQ16LimitationsToggle(lim)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs sm:text-sm leading-snug">{lim}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: BUILDING THE MBBS FOUNDATION WORKSHOP */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 5 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                Building the MBBS Foundation Workshop
              </h2>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/90 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <p>
                  AHA India proposes to develop an <strong>MBBS Foundation Workshop</strong> that complements institutional orientation/Foundation Course activities.
                </p>
                <p>
                  Rather than another lecture programme, it can use short discussions, scenarios, reflection, practical activities, videos, questions and faculty/near-peer interaction.
                </p>
                <p className="font-semibold text-slate-900">
                  <strong>MBBS Foundation: Your First Book of Medicine</strong> will serve as the principal structured reference resource.
                </p>
              </div>
            </div>

            {/* Q17. Useful Formats (Select up to 5) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm sm:text-base font-black text-slate-900">
                  Q17. Which formats would you consider most useful for engaging incoming MBBS students? <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  {formData.q17UsefulFormats.length} of 5 selected
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Select up to five preferred formats.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {Q17_WORKSHOP_FORMATS_OPTIONS.map((fmt) => {
                  const isChecked = formData.q17UsefulFormats.includes(fmt);
                  const isMaxReached = formData.q17UsefulFormats.length >= 5 && !isChecked;
                  return (
                    <label
                      key={fmt}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition select-none ${
                        isChecked
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs cursor-pointer"
                          : isMaxReached
                          ? "bg-slate-50/30 border-slate-200/50 text-slate-400 cursor-not-allowed opacity-60"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isMaxReached}
                        onChange={() => handleQ17FormatsToggle(fmt)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs sm:text-sm leading-snug">{fmt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q18. Workshop Definitely Include */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q18. What should an MBBS Foundation Workshop definitely include? <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.q18WorkshopShouldInclude || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, q18WorkshopShouldInclude: e.target.value }))}
                placeholder="Key must-have modules, interactive elements, or experiential components..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 6: WOULD YOU LIKE TO CONTRIBUTE? */}
        {/* ========================================================= */}
        {currentStep === 6 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 6 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                Would You Like to Contribute?
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                We warmly invite faculty, clinicians, and medical mentors to collaborate in co-creating learning resources.
              </p>
            </div>

            {/* Q19. Interest in Contributing */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q19. Would you be interested in contributing to the development of the MBBS Foundation initiative? <span className="text-red-700">*</span>
              </label>

              <div className="space-y-2">
                {Q19_CONTRIBUTION_INTEREST_OPTIONS.map((opt) => {
                  const isSelected = formData.q19InterestedInContributing === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q19ContributionInterest"
                        checked={isSelected}
                        onChange={() => handleQ19Change(opt)}
                        className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* CONDITIONAL BRANCH: Q20 - Q22 */}
            {shouldShowContributionBranch && (
              <div className="space-y-6 pt-4 border-t border-slate-200 bg-red-50/30 p-5 rounded-2xl border border-red-100 animate-in fade-in duration-200">
                <div className="text-xs font-bold uppercase tracking-wider text-red-800">
                  Contribution Preferences &amp; Scope
                </div>

                {/* Q20. How might you like to contribute? */}
                <div className="space-y-3">
                  <label className="block text-sm font-black text-slate-900">
                    Q20. How might you like to contribute? <span className="text-xs font-normal text-slate-500">(Select all that interest you)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Q20_CONTRIBUTION_TYPES_OPTIONS.map((ctype) => {
                      const isChecked = formData.q20ContributionTypes.includes(ctype);
                      return (
                        <label
                          key={ctype}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                            isChecked
                              ? "bg-red-50/90 border-red-300 text-red-950 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleQ20ContributionTypeToggle(ctype)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm leading-snug">{ctype}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Q21. Particular Topic Interest */}
                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-black text-slate-900">
                    Q21. Is there a particular topic or area to which you would personally like to contribute? <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.q21PersonalTopicInterest || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, q21PersonalTopicInterest: e.target.value }))}
                    placeholder="e.g. Communication scenarios, ECG basics, Doctor-patient ethics, Stress management..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                {/* Q22. Time Commitment */}
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-black text-slate-900">
                    Q22. Approximately how much time would you realistically be comfortable contributing initially? <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>

                  <div className="space-y-2">
                    {Q22_TIME_COMMITMENT_OPTIONS.map((topt) => {
                      const isSelected = formData.q22TimeCommitment === topt;
                      return (
                        <label
                          key={topt}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                            isSelected
                              ? "bg-red-50/90 border-red-300 text-red-950 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="q22Time"
                            checked={isSelected}
                            onChange={() => setFormData((prev) => ({ ...prev, q22TimeCommitment: topt }))}
                            className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm">{topt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 7: HELP US HEAR FROM STUDENTS */}
        {/* ========================================================= */}
        {currentStep === 7 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 7 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                Help Us Hear from Students
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Connecting with incoming batches to understand real student transition needs.
              </p>
            </div>

            {/* Q23. Connected with new students */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q23. Are you currently connected with newly admitted or first-year MBBS students through your institution, teaching, professional network or personal network? <span className="text-red-700">*</span>
              </label>

              <div className="space-y-2">
                {Q23_STUDENT_CONNECTION_OPTIONS.map((opt) => {
                  const isSelected = formData.q23ConnectedWithNewStudents === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q23Connection"
                        checked={isSelected}
                        onChange={() => setFormData((prev) => ({ ...prev, q23ConnectedWithNewStudents: opt }))}
                        className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q24. Willing to share Readiness Check */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm sm:text-base font-black text-slate-900">
                  Q24. Would you be willing to share a brief <strong className="text-red-800">MBBS Entry Readiness Check</strong> with newly admitted / first-year MBBS students? <span className="text-red-700">*</span>
                </label>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  The readiness check will help students reflect on their preparedness for the transition into medical college and help us understand their actual needs.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {Q24_READINESS_SHARING_OPTIONS.map((opt) => {
                  const isSelected = formData.q24WillingToShareReadiness === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-bold shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q24Share"
                        checked={isSelected}
                        onChange={() => handleQ24Change(opt)}
                        className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 8: STAY CONNECTED */}
        {/* ========================================================= */}
        {currentStep === 8 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 8 of 8
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
                Stay Connected
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Contact details are optional unless you would like us to follow up regarding the MBBS Foundation consultation, workshop development, or contribution opportunities.
              </p>
            </div>

            {/* Q25. Name */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Q25. Full Name <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.respondentName || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, respondentName: e.target.value }))}
                placeholder="e.g. Dr. Ramesh Kumar"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>

            {/* Q26. Email */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Q26. Email Address <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="doctor@institution.org"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>

            {/* Q27. Mobile / WhatsApp */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Q27. Mobile / WhatsApp Number <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.mobileWhatsapp || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, mobileWhatsapp: e.target.value }))}
                placeholder="e.g. +91 98765 43210"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>

            {/* Q28. Consent for Contact */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm sm:text-base font-black text-slate-900">
                Q28. May AHA India contact you regarding the MBBS Foundation consultation, workshop development or contribution opportunities? <span className="text-red-700">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {Q28_CONSENT_OPTIONS.map((opt) => {
                  const isSelected = formData.q28ConsentForContact === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition cursor-pointer select-none text-center ${
                        isSelected
                          ? "bg-red-50/80 border-red-300 text-red-950 font-black shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100/80 font-bold"
                      }`}
                    >
                      <input
                        type="radio"
                        name="q28Consent"
                        checked={isSelected}
                        onChange={() => handleQ28ConsentChange(opt)}
                        className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>

              {/* Privacy Note */}
              <p className="mt-3 text-[11px] sm:text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                🔒 <strong>Privacy Note:</strong> Contact information will be used only for communication related to the MBBS Foundation initiative and will not be shared with third parties for marketing purposes.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PREVIOUS / CONTINUE ACTION BUTTONS */}
        {/* ========================================================= */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              ← Previous Section
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-slate-950 px-7 py-3 text-xs sm:text-sm font-black text-white shadow-md hover:from-red-800 hover:to-black transition flex items-center gap-2 cursor-pointer"
          >
            <span>{currentStep === 8 ? "Review & Complete" : "Continue to Next Section"}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
