import { prisma } from "@/lib/prisma";
import {
  StudentVoiceDashboardSummary,
  StudentOptionMetric,
  StudentQ8StatementMetric,
} from "./studentVoiceTypes";
import {
  Q8_STATEMENTS,
  STUDENT_SURVEY_SECTIONS_CONFIG,
} from "./studentVoiceSurveyConfig";

function getSourceLabel(source?: string | null): string {
  const s = (source || "direct").toLowerCase().trim();
  if (s === "student") return "Direct Student / Peer Network";
  if (s === "faculty") return "Faculty / Educator Referred";
  if (s === "cpr") return "CPR / Medical Network";
  return "Direct / Unattributed";
}

export async function getStudentVoiceDashboardSummary(): Promise<StudentVoiceDashboardSummary> {
  const allResponses = await prisma.mBBSStudentVoiceSurveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalResponses = allResponses.length;

  if (totalResponses === 0) {
    return {
      totalResponses: 0,
      difficultTransitionCount: 0,
      difficultTransitionPercentage: 0,
      priorKnowledgeHelpCount: 0,
      priorKnowledgeHelpPercentage: 0,
      interestedContributorsCount: 0,
      interestedContributorsPercentage: 0,
      distinctStatesCount: 0,
      sourceBreakdown: [],
      trainingStageBreakdown: [],
      collegeTypeBreakdown: [],
      stateBreakdown: [],
      q4RewardingBreakdown: [],
      q5FeelingBreakdown: [],
      q6HarderBreakdown: [],
      q7UnexpectedBreakdown: [],
      q8RatingsBreakdown: [],
      q9UnderstandBeforeBreakdown: [],
      q10GuidanceTypesBreakdown: [],
      q11TimingBreakdown: [],
      q12UsefulnessBreakdown: [],
      q13ComponentsBreakdown: [],
      q14TransitionBreakdown: [],
      q15PriorKnowledgeBreakdown: [],
      q16ContributionInterestBreakdown: [],
      q17HelpMethodsBreakdown: [],
      calculatedInsights: {
        pctExcitingChallengingOrMixed: 0,
        pctMajorAcademicChallenges: 0,
        pctPersonalSocialChallenges: 0,
        pctWantingGuidanceEarly: 0,
        pctGuideVeryOrExtremelyUseful: 0,
        pctAdvanceKnowledgeDefinitelyOrProbablyHelped: 0,
      },
      recentResponses: [],
    };
  }

  // 1. Core KPIs
  let difficultTransitionCount = 0;
  let priorKnowledgeHelpCount = 0;
  let interestedContributorsCount = 0;
  const distinctStatesSet = new Set<string>();

  // Frequency Maps
  const sourceMap: Record<string, number> = {};
  const stageMap: Record<string, number> = {};
  const collegeTypeMap: Record<string, number> = {};
  const stateMap: Record<string, number> = {};

  const q4Map: Record<string, number> = {};
  const q5Map: Record<string, number> = {};
  const q6Map: Record<string, number> = {};
  const q7Map: Record<string, number> = {};
  const q8RatingsMap: Record<string, Record<string, number>> = {};
  const q9Map: Record<string, number> = {};
  const q10Map: Record<string, number> = {};
  const q11Map: Record<string, number> = {};
  const q12Map: Record<string, number> = {};
  const q13Map: Record<string, number> = {};
  const q14Map: Record<string, number> = {};
  const q15Map: Record<string, number> = {};
  const q16Map: Record<string, number> = {};
  const q17Map: Record<string, number> = {};

  // For Insight Calculations
  let excitingChallengingOrMixedCount = 0;
  let majorAcademicChallengeCount = 0;
  let personalSocialChallengeCount = 0;
  let wantingEarlyGuidanceCount = 0;
  let guideVeryOrExtremelyUsefulCount = 0;
  let advanceKnowledgeDefinitelyOrProbablyCount = 0;

  for (const row of allResponses) {
    const sr = (row.surveyResponses as any) || {};

    // Source
    const src = (row.source || "direct").toLowerCase();
    sourceMap[src] = (sourceMap[src] || 0) + 1;

    // Stage
    if (row.trainingStage) {
      stageMap[row.trainingStage] = (stageMap[row.trainingStage] || 0) + 1;
    }

    // College Type
    if (row.collegeType) {
      collegeTypeMap[row.collegeType] = (collegeTypeMap[row.collegeType] || 0) + 1;
    }

    // State
    if (row.state) {
      distinctStatesSet.add(row.state);
      stateMap[row.state] = (stateMap[row.state] || 0) + 1;
    }

    // Contributors
    if (row.interestedInContributing) {
      interestedContributorsCount++;
    }

    // Q4
    const q4List = Array.isArray(sr.q4RewardingExperiences) ? sr.q4RewardingExperiences : [];
    for (const opt of q4List) {
      q4Map[opt] = (q4Map[opt] || 0) + 1;
    }

    // Q5
    const q5Val = sr.q5FirstMonthsFeeling || "";
    if (q5Val) {
      q5Map[q5Val] = (q5Map[q5Val] || 0) + 1;
      if (
        [
          "Exciting but challenging",
          "More difficult than expected",
          "Overwhelming initially but improved with time",
          "Mixed — some very good and some very difficult experiences",
          "Difficult for a prolonged period",
        ].includes(q5Val)
      ) {
        excitingChallengingOrMixedCount++;
      }
    }

    // Q6
    const q6List = Array.isArray(sr.q6HarderAspects) ? sr.q6HarderAspects : [];
    let hasAcademic = false;
    let hasPersonalSocial = false;
    for (const opt of q6List) {
      q6Map[opt] = (q6Map[opt] || 0) + 1;
      if (
        [
          "Very large volume of content",
          "Understanding how to study in MBBS",
          "Remembering and integrating information",
          "Self-directed learning",
          "Managing multiple subjects simultaneously",
          "Assessments / examinations",
        ].includes(opt)
      ) {
        hasAcademic = true;
      }
      if (
        [
          "Time management",
          "Living away from home",
          "Hostel adjustment",
          "Making new friends",
          "Feeling lonely or isolated",
          "Comparing myself with classmates",
          "Loss of confidence",
          "Stress / anxiety / emotional pressure",
          "Balancing study and personal life",
          "Asking for help when struggling",
        ].includes(opt)
      ) {
        hasPersonalSocial = true;
      }
    }
    if (hasAcademic) majorAcademicChallengeCount++;
    if (hasPersonalSocial) personalSocialChallengeCount++;

    // Q7
    const q7List = Array.isArray(sr.q7UnexpectedAspects) ? sr.q7UnexpectedAspects : [];
    for (const opt of q7List) {
      q7Map[opt] = (q7Map[opt] || 0) + 1;
    }

    // Q8 Ratings
    const q8Ratings = sr.q8FirstYearFeelings || {};
    for (const [stId, rVal] of Object.entries(q8Ratings)) {
      if (typeof rVal === "string") {
        if (!q8RatingsMap[stId]) q8RatingsMap[stId] = {};
        q8RatingsMap[stId][rVal] = (q8RatingsMap[stId][rVal] || 0) + 1;
      }
    }

    // Q9
    const q9List = Array.isArray(sr.q9ShouldUnderstandBefore) ? sr.q9ShouldUnderstandBefore : [];
    for (const opt of q9List) {
      q9Map[opt] = (q9Map[opt] || 0) + 1;
    }

    // Q10
    const q10List = Array.isArray(sr.q10HelpfulGuidanceTypes) ? sr.q10HelpfulGuidanceTypes : [];
    for (const opt of q10List) {
      q10Map[opt] = (q10Map[opt] || 0) + 1;
    }

    // Q11
    const q11Val = sr.q11BestTimingForGuidance || "";
    if (q11Val) {
      q11Map[q11Val] = (q11Map[q11Val] || 0) + 1;
      if (
        [
          "Before joining medical college",
          "During the weeks between admission and joining",
          "During the Foundation Course",
          "During the first month",
        ].includes(q11Val)
      ) {
        wantingEarlyGuidanceCount++;
      }
    }

    // Q12
    const q12Val = sr.q12GuideUsefulnessRating || "";
    if (q12Val) {
      q12Map[q12Val] = (q12Map[q12Val] || 0) + 1;
      if (["Extremely useful", "Very useful"].includes(q12Val)) {
        guideVeryOrExtremelyUsefulCount++;
      }
    }

    // Q13
    const q13List = Array.isArray(sr.q13GuideEssentialComponents) ? sr.q13GuideEssentialComponents : [];
    for (const opt of q13List) {
      q13Map[opt] = (q13Map[opt] || 0) + 1;
    }

    // Q14
    const q14Val = sr.q14TransitionFitStatement || "";
    if (q14Val) {
      q14Map[q14Val] = (q14Map[q14Val] || 0) + 1;
      if (
        [
          "I struggled initially and wish I had been better prepared",
          "I faced significant difficulties that took time to understand/manage",
          "My experience had both major joys and major struggles",
        ].includes(q14Val)
      ) {
        difficultTransitionCount++;
      }
    }

    // Q15
    const q15Val = sr.q15PriorKnowledgeWouldHaveHelped || "";
    if (q15Val) {
      q15Map[q15Val] = (q15Map[q15Val] || 0) + 1;
      if (["Definitely yes", "Probably yes"].includes(q15Val)) {
        priorKnowledgeHelpCount++;
        advanceKnowledgeDefinitelyOrProbablyCount++;
      }
    }

    // Q16
    const q16Val = sr.q16InterestedInHelping || "";
    if (q16Val) {
      q16Map[q16Val] = (q16Map[q16Val] || 0) + 1;
    }

    // Q17
    const q17List = Array.isArray(sr.q17HelpMethods) ? sr.q17HelpMethods : [];
    for (const opt of q17List) {
      q17Map[opt] = (q17Map[opt] || 0) + 1;
    }
  }

  // Format Helper
  const toMetricList = (map: Record<string, number>): StudentOptionMetric[] => {
    return Object.entries(map)
      .map(([option, count]) => ({
        option,
        count,
        percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Format Q8 Matrix
  const q8RatingsBreakdown: StudentQ8StatementMetric[] = Q8_STATEMENTS.map((st) => {
    const ratings = q8RatingsMap[st.id] || {};
    const totalRated = Object.values(ratings).reduce((acc, c) => acc + c, 0);
    const oftenCount = ratings["Often"] || 0;
    const veryOftenCount = ratings["Very often"] || 0;
    const highFreq = oftenCount + veryOftenCount;

    return {
      code: st.code,
      id: st.id,
      label: st.label,
      category: st.category,
      ratings,
      totalRated,
      highFrequencyCount: highFreq,
      highFrequencyPercentage:
        totalRated > 0 ? Math.round((highFreq / totalRated) * 100) : 0,
    };
  });

  // Source breakdown
  const sourceBreakdown = Object.entries(sourceMap).map(([src, count]) => ({
    source: src,
    label: getSourceLabel(src),
    count,
    percentage: Math.round((count / totalResponses) * 100),
  }));

  // Recent responses
  const recentResponses = allResponses.slice(0, 50).map((r) => {
    const sr = (r.surveyResponses as any) || {};
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      source: r.source || "direct",
      trainingStage: r.trainingStage,
      collegeType: r.collegeType,
      state: r.state,
      q5FirstMonthsFeeling: sr.q5FirstMonthsFeeling || "—",
      q14TransitionFitStatement: sr.q14TransitionFitStatement || "—",
      q15PriorKnowledgeWouldHaveHelped: sr.q15PriorKnowledgeWouldHaveHelped || "—",
      interestedInContributing: r.interestedInContributing,
      respondentName: r.respondentName,
      email: r.email,
      mobileWhatsapp: r.mobileWhatsapp,
      q18OneThingWishTold: sr.q18OneThingWishTold || null,
      surveyResponses: sr,
    };
  });

  return {
    totalResponses,
    difficultTransitionCount,
    difficultTransitionPercentage: Math.round((difficultTransitionCount / totalResponses) * 100),
    priorKnowledgeHelpCount,
    priorKnowledgeHelpPercentage: Math.round((priorKnowledgeHelpCount / totalResponses) * 100),
    interestedContributorsCount,
    interestedContributorsPercentage: Math.round((interestedContributorsCount / totalResponses) * 100),
    distinctStatesCount: distinctStatesSet.size,
    sourceBreakdown,
    trainingStageBreakdown: toMetricList(stageMap),
    collegeTypeBreakdown: toMetricList(collegeTypeMap),
    stateBreakdown: toMetricList(stateMap),
    q4RewardingBreakdown: toMetricList(q4Map),
    q5FeelingBreakdown: toMetricList(q5Map),
    q6HarderBreakdown: toMetricList(q6Map),
    q7UnexpectedBreakdown: toMetricList(q7Map),
    q8RatingsBreakdown,
    q9UnderstandBeforeBreakdown: toMetricList(q9Map),
    q10GuidanceTypesBreakdown: toMetricList(q10Map),
    q11TimingBreakdown: toMetricList(q11Map),
    q12UsefulnessBreakdown: toMetricList(q12Map),
    q13ComponentsBreakdown: toMetricList(q13Map),
    q14TransitionBreakdown: toMetricList(q14Map),
    q15PriorKnowledgeBreakdown: toMetricList(q15Map),
    q16ContributionInterestBreakdown: toMetricList(q16Map),
    q17HelpMethodsBreakdown: toMetricList(q17Map),
    calculatedInsights: {
      pctExcitingChallengingOrMixed: Math.round((excitingChallengingOrMixedCount / totalResponses) * 100),
      pctMajorAcademicChallenges: Math.round((majorAcademicChallengeCount / totalResponses) * 100),
      pctPersonalSocialChallenges: Math.round((personalSocialChallengeCount / totalResponses) * 100),
      pctWantingGuidanceEarly: Math.round((wantingEarlyGuidanceCount / totalResponses) * 100),
      pctGuideVeryOrExtremelyUseful: Math.round((guideVeryOrExtremelyUsefulCount / totalResponses) * 100),
      pctAdvanceKnowledgeDefinitelyOrProbablyHelped: Math.round((advanceKnowledgeDefinitelyOrProbablyCount / totalResponses) * 100),
    },
    recentResponses,
  };
}
