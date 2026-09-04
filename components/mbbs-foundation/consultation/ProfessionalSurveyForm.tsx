"use client";

import React, { useState, useEffect } from "react";
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
  Q7_FOUNDATION_COURSE_OPTIONS,
  Q8_LIMITATIONS_OPTIONS,
  Q10_WORKSHOP_FORMATS_OPTIONS,
  Q11_CONTRIBUTION_INTEREST_OPTIONS,
  Q12_CONTRIBUTION_PATHWAYS,
  Q28_CONSENT_OPTIONS,
} from "@/lib/mbbs-foundation/consultationTypes";
import {
  SURVEY_SECTIONS_CONFIG,
  SUCCESS_SCREEN_CONFIG,
  SURVEY_METADATA,
} from "@/lib/mbbs-foundation/professionalSurveyConfig";
import SurveyProgress from "./SurveyProgress";

interface ProfessionalSurveyFormProps {
  initialSource?: ConsultationSource;
}

const SECTION_TITLES = SURVEY_SECTIONS_CONFIG.map((s) => s.title);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfessionalSurveyForm({
  initialSource = "direct",
}: ProfessionalSurveyFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProfessionalSurveyFormData>({
    ...INITIAL_PROFESSIONAL_SURVEY_FORM_DATA,
    source: initialSource,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // College lookup state
  const [collegesList, setCollegesList] = useState<string[]>([]);
  const [loadingColleges, setLoadingColleges] = useState<boolean>(false);
  const [selectedCollegeChoice, setSelectedCollegeChoice] = useState<string>("");
  const [otherInstitutionText, setOtherInstitutionText] = useState<string>("");

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

  // Handle college selection change
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

  const handleQ6EmphasisToggle = (domainId: string) => {
    setFormData((prev) => {
      const exists = prev.q9EmphasisAreas.includes(domainId);
      if (exists) {
        return {
          ...prev,
          q9EmphasisAreas: prev.q9EmphasisAreas.filter((id) => id !== domainId),
        };
      }
      if (prev.q9EmphasisAreas.length >= 5) {
        setValidationError("You can select up to 5 priority areas in Q6.");
        return prev;
      }
      return {
        ...prev,
        q9EmphasisAreas: [...prev.q9EmphasisAreas, domainId],
      };
    });
    setValidationError(null);
  };

  const handleQ8LimitationsToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.q16Limitations.includes(item);
      if (exists) {
        return {
          ...prev,
          q16Limitations: prev.q16Limitations.filter((i) => i !== item),
        };
      }
      if (prev.q16Limitations.length >= 3) {
        setValidationError("You can select up to 3 limitations in Q8.");
        return prev;
      }
      return {
        ...prev,
        q16Limitations: [...prev.q16Limitations, item],
      };
    });
    setValidationError(null);
  };

  const handleQ10FormatsToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.q17UsefulFormats.includes(item);
      if (exists) {
        return {
          ...prev,
          q17UsefulFormats: prev.q17UsefulFormats.filter((i) => i !== item),
        };
      }
      if (prev.q17UsefulFormats.length >= 5) {
        setValidationError("You can select up to 5 learning approaches in Q10.");
        return prev;
      }
      return {
        ...prev,
        q17UsefulFormats: [...prev.q17UsefulFormats, item],
      };
    });
    setValidationError(null);
  };

  const handleQ11Change = (value: string) => {
    const isInterested = value !== "Not at present";
    setFormData((prev) => ({
      ...prev,
      q19InterestedInContributing: value,
      interestedInContributing: isInterested,
      // If not interested, clear contribution types
      q20ContributionTypes: isInterested ? prev.q20ContributionTypes : [],
      q21PersonalTopicInterest: isInterested ? prev.q21PersonalTopicInterest : "",
    }));
    setValidationError(null);
  };

  const handleQ12ContributionTypeToggle = (type: string) => {
    setFormData((prev) => {
      const exists = prev.q20ContributionTypes.includes(type);
      const updated = exists
        ? prev.q20ContributionTypes.filter((t) => t !== type)
        : [...prev.q20ContributionTypes, type];
      return { ...prev, q20ContributionTypes: updated };
    });
  };

  const handleConsentChange = (value: string) => {
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

    // Section 1: About You
    if (currentStep === 1) {
      if (formData.roles.length === 0) {
        setValidationError("Please select at least one professional role in Q1.");
        return false;
      }
      if (!formData.specialty || !formData.specialty.trim()) {
        setValidationError("Please select your broad specialty or department in Q2.");
        return false;
      }
      if (!formData.teachingExperience || !formData.teachingExperience.trim()) {
        setValidationError("Please select your teaching/training experience in Q3.");
        return false;
      }
      if (!formData.state || !formData.state.trim()) {
        setValidationError("Please select your State or Union Territory in Q4.");
        return false;
      }
    }

    // Section 2: How Prepared Are Students?
    if (currentStep === 2) {
      const missingDomain = READINESS_DOMAINS.find(
        (domain) => !formData.readinessRatings[domain.id]
      );
      if (missingDomain) {
        setValidationError(
          `Please rate all 14 transition areas in Q5 (missing: "${missingDomain.title || missingDomain.label}").`
        );
        return false;
      }
      if (formData.q9EmphasisAreas.length === 0) {
        setValidationError("Please select 1 to 5 priority areas in Q6.");
        return false;
      }
      if (formData.q9EmphasisAreas.length > 5) {
        setValidationError("A maximum of 5 priority areas can be selected in Q6.");
        return false;
      }
    }

    // Section 3: Current Foundation Course
    if (currentStep === 3) {
      if (!formData.q15FoundationCourseDescription || !formData.q15FoundationCourseDescription.trim()) {
        setValidationError("Please select your observation in Q7.");
        return false;
      }
      if (formData.q16Limitations.length > 3) {
        setValidationError("A maximum of 3 limitations can be selected in Q8.");
        return false;
      }
    }

    // Section 4: Your Experience Matters
    if (currentStep === 4) {
      if (!formData.q13WishTaughtAtBeginning || !formData.q13WishTaughtAtBeginning.trim()) {
        setValidationError("Please share your observation or recommendation in Q9.");
        return false;
      }
    }

    // Section 5: Building the MBBS Foundation Workshop
    if (currentStep === 5) {
      if (formData.q17UsefulFormats.length > 5) {
        setValidationError("A maximum of 5 learning approaches can be selected in Q10.");
        return false;
      }
    }

    // Section 6: Extend Your Contribution
    if (currentStep === 6) {
      if (!formData.q19InterestedInContributing || !formData.q19InterestedInContributing.trim()) {
        setValidationError("Please select your contribution interest in Q11.");
        return false;
      }
    }

    // Section 7: Stay Connected
    if (currentStep === 7) {
      if (!formData.respondentName || !formData.respondentName.trim()) {
        setValidationError("Name & Academic Title is required in Section 7.");
        return false;
      }
      const hasEmail = Boolean(formData.email && formData.email.trim());
      const hasMobile = Boolean(formData.mobileWhatsapp && formData.mobileWhatsapp.trim());
      if (!hasEmail && !hasMobile) {
        setValidationError("Please provide at least one contact method (Email or Mobile / WhatsApp).");
        return false;
      }
      if (hasEmail && !EMAIL_REGEX.test(formData.email!.trim())) {
        setValidationError("Please enter a valid email address.");
        return false;
      }
      if (!formData.q28ConsentForContact || !formData.q28ConsentForContact.trim()) {
        setValidationError("Please indicate whether we may contact you regarding this consultation.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
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
  // SUBMIT HANDLER
  // -------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        surveyVersion: "v2",
        source: formData.source || initialSource,
        roles: formData.roles,
        specialty: formData.specialty,
        teachingExperience: formData.teachingExperience,
        institutionName: formData.institutionName || null,
        city: null,
        state: formData.state,
        stateCode: formData.stateCode || null,
        readinessRatings: formData.readinessRatings,
        q9EmphasisAreas: formData.q9EmphasisAreas,
        q15FoundationCourseDescription: formData.q15FoundationCourseDescription,
        q16Limitations: formData.q16Limitations,
        q13WishTaughtAtBeginning: formData.q13WishTaughtAtBeginning,
        q17UsefulFormats: formData.q17UsefulFormats,
        q19InterestedInContributing: formData.q19InterestedInContributing,
        interestedInContributing: formData.interestedInContributing,
        q20ContributionTypes: formData.q20ContributionTypes,
        q21PersonalTopicInterest: formData.q21PersonalTopicInterest || null,
        respondentName: formData.respondentName,
        email: formData.email || null,
        mobileWhatsapp: formData.mobileWhatsapp || null,
        q28ConsentForContact: formData.q28ConsentForContact,
        consentForFollowup: formData.consentForFollowup,
      };

      const res = await fetch("/api/mbbs-foundation/consultation/professional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSubmittedSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError(
          data.errors?.join(" ") ||
            data.error ||
            "Unable to submit consultation response. Please verify your entries and try again."
        );
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError("A network error occurred. Please check your internet connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // POST-SUBMISSION SUCCESS SCREEN
  // -------------------------------------------------------------

  if (isSubmittedSuccess) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <span>✓</span> {SUCCESS_SCREEN_CONFIG.badge}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            {SUCCESS_SCREEN_CONFIG.heading}
          </h2>

          <p className="text-base sm:text-lg font-bold text-red-800">
            {SUCCESS_SCREEN_CONFIG.leadMessage}
          </p>
        </div>

        <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl mx-auto border-t border-b border-slate-100 py-6">
          {SUCCESS_SCREEN_CONFIG.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Post-Submission Student Voice Action Block */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 space-y-4 shadow-md max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-red-600/30 border border-red-500/50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-200">
            <span>🎓</span> Next Step
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {SUCCESS_SCREEN_CONFIG.studentVoiceBlock.heading}
          </h3>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {SUCCESS_SCREEN_CONFIG.studentVoiceBlock.text}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={SUCCESS_SCREEN_CONFIG.studentVoiceBlock.ctaHref}
              className="inline-flex items-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-sm"
            >
              <span>📋</span>
              <span>{SUCCESS_SCREEN_CONFIG.studentVoiceBlock.ctaLabel}</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}${SUCCESS_SCREEN_CONFIG.studentVoiceBlock.ctaHref}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                } catch {
                  // Fallback
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition border border-white/20"
            >
              <span>{copiedLink ? "✓ Copied!" : "🔗 Copy Survey Link"}</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/mbbs-foundation/consultation"
            className="text-xs font-bold text-slate-500 hover:text-red-700 transition"
          >
            ← Return to Consultation Overview
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SURVEY FORM PROGRESS & STEP RENDERER
  // -------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* 7-Section Progress Bar */}
      <SurveyProgress
        currentStep={currentStep}
        totalSteps={7}
        stepTitle={SECTION_TITLES[currentStep - 1] || "Section"}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================= */}
        {/* SECTION 1 — ABOUT YOU                                     */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 1 of 7
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                About You
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Please share your current academic or clinical role to help us contextualize your perspective.
              </p>
            </div>

            {/* Q1 Roles (Multi-select) */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-slate-950">
                Q1. Which of the following best describe your professional role(s)?{" "}
                <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500">Select all that apply.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROFESSIONAL_ROLES_OPTIONS.map((role) => {
                  const isChecked = formData.roles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => handleRoleToggle(role)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left text-xs transition cursor-pointer ${
                        isChecked
                          ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isChecked
                            ? "border-red-700 bg-red-700 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      <span className="leading-snug">{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q2 Specialty (Single-select) */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-black text-slate-950">
                Q2. What is your broad specialty or department?{" "}
                <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500">Select one primary specialty.</p>
              <select
                value={formData.specialty || ""}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, specialty: e.target.value }));
                  setValidationError(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              >
                <option value="">-- Select Specialty or Department --</option>
                {SPECIALTY_OPTIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Q3 Teaching Experience (Single-select) */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-black text-slate-950">
                Q3. How long have you been involved in teaching, mentoring or training medical students?{" "}
                <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2">
                {TEACHING_EXPERIENCE_OPTIONS.map((exp) => {
                  const isChecked = formData.teachingExperience === exp;
                  return (
                    <button
                      type="button"
                      key={exp}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, teachingExperience: exp }));
                        setValidationError(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs sm:text-sm transition cursor-pointer ${
                        isChecked
                          ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isChecked
                            ? "border-red-700 bg-red-700 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "●"}
                      </span>
                      <span>{exp}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q4 State / UT & Medical College */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-black text-slate-950">
                  Q4. State / Union Territory <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Select the State or UT where your institution is located.
                </p>
                <select
                  value={formData.state || ""}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      state: e.target.value,
                      institutionName: "",
                    }));
                    setSelectedCollegeChoice("");
                    setOtherInstitutionText("");
                    setValidationError(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                >
                  <option value="">-- Select State / Union Territory --</option>
                  {INDIAN_STATES_AND_UTS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medical College / Institution Dropdown */}
              {formData.state && formData.state !== "Outside India / International" && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700">
                    Medical College / Institution (Optional)
                  </label>
                  <select
                    value={selectedCollegeChoice}
                    onChange={(e) => handleCollegeChoiceChange(e.target.value)}
                    disabled={loadingColleges}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
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

              {/* Free-text input for unlisted institution / hospital */}
              {(selectedCollegeChoice === "OTHER" ||
                formData.state === "Outside India / International" ||
                (!selectedCollegeChoice && collegesList.length === 0 && formData.state)) && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700">
                    Other Institution / Hospital (Optional)
                  </label>
                  <input
                    type="text"
                    value={otherInstitutionText}
                    onChange={(e) => handleOtherInstitutionTextChange(e.target.value)}
                    placeholder="e.g., Department of Paediatrics, District Hospital..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 2 — HOW PREPARED ARE STUDENTS?                    */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 2 of 7
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                How Prepared Are Students?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Thinking about students entering medical college and progressing through the early phase of MBBS, how well prepared do you feel they are in the following areas?
              </p>
            </div>

            {/* Q5 Matrix Rating across 14 Domains */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-950">
                  Q5. In your experience, how well prepared are students across these areas?{" "}
                  <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rate each domain on the 5-point scale (or Unable to comment).
                </p>
              </div>

              <div className="space-y-4">
                {READINESS_DOMAINS.map((domain, index) => {
                  const currentRating = formData.readinessRatings[domain.id];
                  return (
                    <div
                      key={domain.id}
                      className={`rounded-xl border p-4 transition ${
                        currentRating
                          ? "border-slate-200 bg-slate-50/50"
                          : "border-red-200/60 bg-red-50/20"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 mb-3">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-white">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-slate-950">
                            {domain.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {domain.description}
                          </p>
                        </div>
                      </div>

                      {/* Rating Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-1">
                        {READINESS_RATING_OPTIONS.map((opt) => {
                          const isSelected = currentRating === opt;
                          return (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleReadinessRatingChange(domain.id, opt)}
                              className={`rounded-lg border px-2.5 py-2 text-[11px] text-center font-medium transition cursor-pointer leading-tight ${
                                isSelected
                                  ? "border-red-700 bg-red-700 text-white font-bold shadow-xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
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

            {/* Q6 Priority Areas (Max 5) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-black text-slate-950">
                  Q6. Which 3–5 areas above require the greatest emphasis during the transition into MBBS and early medical training?{" "}
                  <span className="text-red-600">*</span>
                </label>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                    formData.q9EmphasisAreas.length >= 3 && formData.q9EmphasisAreas.length <= 5
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {formData.q9EmphasisAreas.length} / 5 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select up to 5 domains that require greatest emphasis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {READINESS_DOMAINS.map((domain, index) => {
                  const isChecked = formData.q9EmphasisAreas.includes(domain.id);
                  return (
                    <button
                      type="button"
                      key={domain.id}
                      onClick={() => handleQ6EmphasisToggle(domain.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left text-xs transition cursor-pointer ${
                        isChecked
                          ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          isChecked
                            ? "border-red-700 bg-red-700 text-white font-bold"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      <span className="leading-tight">
                        <span className="font-bold text-slate-900 mr-1">{index + 1}.</span>
                        {domain.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 3 — CURRENT FOUNDATION COURSE                     */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 3 of 7
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                Current Foundation Course
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Your observations on the current Foundation Course implementation in medical colleges.
              </p>
            </div>

            {/* Q7 Description (Single-select) */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-slate-950">
                Q7. Based on your experience, how would you describe the implementation of the current Foundation Course in medical colleges?{" "}
                <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2">
                {Q7_FOUNDATION_COURSE_OPTIONS.map((opt) => {
                  const isChecked = formData.q15FoundationCourseDescription === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          q15FoundationCourseDescription: opt,
                        }));
                        setValidationError(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs sm:text-sm transition cursor-pointer ${
                        isChecked
                          ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isChecked
                            ? "border-red-700 bg-red-700 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "●"}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q8 Limitations (Multi-select, max 3) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-black text-slate-950">
                  Q8. What are the main limitations in delivering an effective Foundation Course?
                </label>
                <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {formData.q16Limitations.length} / 3 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">Choose up to 3.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Q8_LIMITATIONS_OPTIONS.map((lim) => {
                  const isChecked = formData.q16Limitations.includes(lim);
                  return (
                    <button
                      type="button"
                      key={lim}
                      onClick={() => handleQ8LimitationsToggle(lim)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left text-xs transition cursor-pointer ${
                        isChecked
                          ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          isChecked
                            ? "border-red-700 bg-red-700 text-white font-bold"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      <span className="leading-snug">{lim}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 4 — YOUR EXPERIENCE MATTERS                       */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 4 of 7
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                Your Experience Matters
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Reflections from your own journey and the generations of students you have mentored.
              </p>
            </div>

            {/* Q9 Wish taught at beginning (Short textarea) */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-slate-950">
                Q9. Thinking about the students you have taught—and your own journey through medicine—what is ONE thing you wish every student understood or learned at the beginning of MBBS?{" "}
                <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500">
                One brief observation or recommendation is enough.
              </p>
              <textarea
                rows={4}
                value={formData.q13WishTaughtAtBeginning}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    q13WishTaughtAtBeginning: e.target.value,
                  }));
                  setValidationError(null);
                }}
                placeholder="Share your observation, insight or advice for incoming students..."
                className="w-full rounded-xl border border-slate-300 bg-white p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 leading-relaxed"
              />
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 5 — BUILDING THE MBBS FOUNDATION WORKSHOP         */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 5 of 7
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                Building the MBBS Foundation Workshop
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                The MBBS Foundation Workshop is envisaged as a practical, interactive programme that complements the formal Foundation Course and helps students navigate the transition into medical education.
              </p>
            </div>

            {/* Q10 Useful Formats (Multi-select, max 5) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-black text-slate-950">
                  Q10. Which learning approaches would be most useful for such a workshop?
                </label>
                <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {formData.q17UsefulFormats.length} / 5 selected
                </span>
              </div>
              <p className="text-xs text-slate-500">Choose up to 5.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Q10_WORKSHOP_FORMATS_OPTIONS.map((fmt) => {
                  const isChecked = formData.q17UsefulFormats.includes(fmt);
                  return (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => handleQ10FormatsToggle(fmt)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left text-xs transition cursor-pointer ${
                        isChecked
                          ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          isChecked
                            ? "border-red-700 bg-red-700 text-white font-bold"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      <span className="leading-snug">{fmt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 6 — EXTEND YOUR CONTRIBUTION                      */}
        {/* ========================================================= */}
        {currentStep === 6 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 6 of 7
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                Extend Your Contribution
              </h2>
              <p className="text-xs font-bold text-red-800 mt-0.5">
                From educating students to helping shape how future doctors begin
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                The MBBS Foundation initiative is being developed through contributions from medical faculty, clinicians, educators and professionals from across India.
              </p>
            </div>

            {/* Q11 Interested in contributing (Single-select) */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-slate-950">
                Q11. Would you be interested in contributing to the MBBS Foundation initiative?{" "}
                <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2">
                {Q11_CONTRIBUTION_INTEREST_OPTIONS.map((opt) => {
                  const isChecked = formData.q19InterestedInContributing === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleQ11Change(opt)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs sm:text-sm transition cursor-pointer ${
                        isChecked
                          ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isChecked
                            ? "border-red-700 bg-red-700 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && "●"}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q12 Contribution Pathways (Conditional on Q11) */}
            {formData.interestedInContributing && (
              <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="block text-sm font-black text-slate-950">
                    Q12. How would you be interested in contributing?
                  </label>
                  <p className="text-xs text-slate-500">Select all that apply.</p>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {Q12_CONTRIBUTION_PATHWAYS.map((p) => {
                      const isChecked = formData.q20ContributionTypes.includes(p.title);
                      return (
                        <button
                          type="button"
                          key={p.title}
                          onClick={() => handleQ12ContributionTypeToggle(p.title)}
                          className={`flex items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition cursor-pointer ${
                            isChecked
                              ? "border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                              isChecked
                                ? "border-red-700 bg-red-700 text-white font-bold"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && "✓"}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.title}</span>
                            <span className="text-slate-600 text-[11px] font-normal leading-relaxed">
                              — {p.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional specific topic textarea */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Is there a particular topic or area in which you would like to contribute? (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.q21PersonalTopicInterest || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        q21PersonalTopicInterest: e.target.value,
                      }))
                    }
                    placeholder="e.g., communication skills, stress management, CPR, ethics, study methods..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 7 — STAY CONNECTED                                */}
        {/* ========================================================= */}
        {currentStep === 7 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-7">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                Section 7 of 7
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                SECTION 7 — STAY CONNECTED
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Your professional and contact details will help us understand the diversity of contributors and communicate with you regarding this consultation and the MBBS Foundation initiative.
              </p>
            </div>

            <div className="space-y-4">
              {/* Name & Title (Required) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900">
                  Name &amp; Academic Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.respondentName || ""}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, respondentName: e.target.value }));
                    setValidationError(null);
                  }}
                  placeholder="e.g., Dr. Rajesh Sharma, Professor"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Email & Mobile Grid (At least one required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-900">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      setValidationError(null);
                    }}
                    placeholder="e.g., doctor@institution.edu.in"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <span className="text-[11px] text-slate-500">Provide Email OR Mobile.</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-900">
                    Mobile / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobileWhatsapp || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, mobileWhatsapp: e.target.value }));
                      setValidationError(null);
                    }}
                    placeholder="e.g., 9876543210"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <span className="text-[11px] text-slate-500">Provide Email OR Mobile.</span>
                </div>
              </div>

              {/* Consent for contact (Required) */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900">
                  May we contact you regarding the MBBS Foundation consultation, Workshop or contribution opportunities?{" "}
                  <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-4">
                  {Q28_CONSENT_OPTIONS.map((opt) => {
                    const isChecked = formData.q28ConsentForContact === opt;
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleConsentChange(opt)}
                        className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
                          isChecked
                            ? "border-red-600 bg-red-50 text-red-900 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            isChecked
                              ? "border-red-700 bg-red-700 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && "●"}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-slate-600 text-[11px] leading-relaxed">
                🔒 <strong>Privacy:</strong> Your contact information will be used only for communication related to the MBBS Foundation initiative and will not be shared with third parties for marketing.
              </div>
            </div>
          </section>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 animate-in fade-in duration-150">
            ⚠️ {validationError}
          </div>
        )}

        {/* Submit Error Banner */}
        {submitError && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs font-bold text-red-800 animate-in fade-in duration-150">
            ❌ {submitError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-slate-900 hover:bg-red-700 px-7 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-sm cursor-pointer"
            >
              Continue to Section {currentStep + 1} →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-red-700 hover:bg-red-800 px-8 py-3 text-xs sm:text-sm font-bold text-white transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Consultation..." : "SUBMIT PROFESSIONAL CONSULTATION"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
