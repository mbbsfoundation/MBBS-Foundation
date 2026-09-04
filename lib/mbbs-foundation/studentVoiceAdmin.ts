import { prisma } from "@/lib/prisma";
import {
  StudentVoiceDashboardSummary,
  StudentOptionMetric,
  StudentQ6StatementMetric,
} from "./studentVoiceTypes";
import {
  Q6_STATEMENTS,
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
      v2ResponseCount: 0,
      v1ResponseCount: 0,
      quotePermissionCount: 0,
      quotePermissionPercentage: 0,
      interestedContributorsCount: 0,
      interestedContributorsPercentage: 0,
      distinctStatesCount: 0,
      sourceBreakdown: [],
      trainingStageBreakdown: [],
      collegeTypeBreakdown: [],
      stateBreakdown: [],
      q3RewardingBreakdown: [],
      q4HarderBreakdown: [],
      q5SurprisesBreakdown: [],
      q6MatrixBreakdown: [],
      q7NextBatchBreakdown: [],
      q8PreparationTypesBreakdown: [],
      q9TimingBreakdown: [],
      contributionMethodsBreakdown: [],
      calculatedInsights: {
        pctExcitingOrRewarding: 0,
        pctMajorChallenges: 0,
        pctDifficultTransition: 0,
        pctWantingEarlyPreparation: 0,
        pctQuotePermissionGranted: 0,
        pctInterestedInContributing: 0,
      },
      recentResponses: [],
    };
  }

  let v2ResponseCount = 0;
  let v1ResponseCount = 0;
  let quotePermissionCount = 0;
  let interestedContributorsCount = 0;
  const distinctStatesSet = new Set<string>();

  // Frequency Maps
  const sourceMap: Record<string, number> = {};
  const stageMap: Record<string, number> = {};
  const collegeTypeMap: Record<string, number> = {};
  const stateMap: Record<string, number> = {};

  const q3Map: Record<string, number> = {};
  const q4Map: Record<string, number> = {};
  const q5Map: Record<string, number> = {};
  const q6RatingsMap: Record<string, Record<string, number>> = {};
  const q7Map: Record<string, number> = {};
  const q8PrepMap: Record<string, number> = {};
  const q9TimingMap: Record<string, number> = {};
  const contributorMethodsMap: Record<string, number> = {};

  // For Insight Calculations
  let wantingEarlyPrepCount = 0;
  let difficultTransitionExperienceCount = 0;

  for (const row of allResponses) {
    const isV2 = row.surveyVersion === "v2";
    if (isV2) {
      v2ResponseCount++;
    } else {
      v1ResponseCount++;
    }

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

    const contInterests = Array.isArray(row.contributionInterests)
      ? (row.contributionInterests as string[])
      : Array.isArray(sr.q17HelpMethods)
      ? sr.q17HelpMethods
      : [];
    for (const method of contInterests) {
      contributorMethodsMap[method] = (contributorMethodsMap[method] || 0) + 1;
    }

    // Quote Permission
    const hasQuotePermission = Boolean(sr.quotePermission);
    if (hasQuotePermission) {
      quotePermissionCount++;
    }

    // Q3 Rewarding (V2) or fallback to V1 q4RewardingExperiences
    const q3List = Array.isArray(sr.q3RewardingExperiences)
      ? sr.q3RewardingExperiences
      : Array.isArray(sr.q4RewardingExperiences)
      ? sr.q4RewardingExperiences
      : [];
    for (const opt of q3List) {
      q3Map[opt] = (q3Map[opt] || 0) + 1;
    }

    // Q4 Harder (V2) or fallback to V1 q6HarderAspects
    const q4List = Array.isArray(sr.q4HarderAspects)
      ? sr.q4HarderAspects
      : Array.isArray(sr.q6HarderAspects)
      ? sr.q6HarderAspects
      : [];
    for (const opt of q4List) {
      q4Map[opt] = (q4Map[opt] || 0) + 1;
    }

    // Q5 Surprises (V2) or fallback to V1 q7UnexpectedAspects
    const q5List = Array.isArray(sr.q5Surprises)
      ? sr.q5Surprises
      : Array.isArray(sr.q7UnexpectedAspects)
      ? sr.q7UnexpectedAspects
      : [];
    for (const opt of q5List) {
      q5Map[opt] = (q5Map[opt] || 0) + 1;
    }

    // Q6 Matrix (V2: q6TransitionMatrix) or fallback to V1 q8FirstYearFeelings
    const q6Ratings = sr.q6TransitionMatrix || sr.q8FirstYearFeelings || {};
    for (const [stId, rVal] of Object.entries(q6Ratings)) {
      if (typeof rVal === "string") {
        if (!q6RatingsMap[stId]) q6RatingsMap[stId] = {};
        q6RatingsMap[stId][rVal] = (q6RatingsMap[stId][rVal] || 0) + 1;
      }
    }

    // Check difficult transition signal (from statement 1, 2, or 3 high frequency)
    const s1 = q6Ratings["statement_1"] || q6Ratings["statement_a"];
    const s2 = q6Ratings["statement_2"] || q6Ratings["statement_b"];
    if (["Often", "Very often"].includes(s1) || ["Often", "Very often"].includes(s2)) {
      difficultTransitionExperienceCount++;
    }

    // Q7 Next Batch Priorities (V2: q7NextBatchPriorities) or fallback to V1 q9ShouldUnderstandBefore
    const q7List = Array.isArray(sr.q7NextBatchPriorities)
      ? sr.q7NextBatchPriorities
      : Array.isArray(sr.q9ShouldUnderstandBefore)
      ? sr.q9ShouldUnderstandBefore
      : [];
    for (const opt of q7List) {
      q7Map[opt] = (q7Map[opt] || 0) + 1;
    }

    // Q8 Preparation Formats (V2: q8UsefulPreparationTypes) or fallback to V1 q10HelpfulGuidanceTypes
    const q8List = Array.isArray(sr.q8UsefulPreparationTypes)
      ? sr.q8UsefulPreparationTypes
      : Array.isArray(sr.q10HelpfulGuidanceTypes)
      ? sr.q10HelpfulGuidanceTypes
      : [];
    for (const opt of q8List) {
      q8PrepMap[opt] = (q8PrepMap[opt] || 0) + 1;
    }

    // Q9 Timing (V2: q9BestTiming) or fallback to V1 q11BestTimingForGuidance
    const timingVal = sr.q9BestTiming || sr.q11BestTimingForGuidance || "";
    if (timingVal) {
      q9TimingMap[timingVal] = (q9TimingMap[timingVal] || 0) + 1;
      if (
        [
          "Before joining medical college",
          "In the first few days after joining",
          "During the first month",
          "During the weeks between admission and joining",
          "During the Foundation Course",
        ].includes(timingVal)
      ) {
        wantingEarlyPrepCount++;
      }
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

  // Format Q6 Matrix Breakdown
  const q6MatrixBreakdown: StudentQ6StatementMetric[] = Q6_STATEMENTS.map((st) => {
    const ratings = q6RatingsMap[st.id] || {};
    const totalRated = Object.values(ratings).reduce((acc, c) => acc + c, 0);
    const oftenCount = ratings["Often"] || 0;
    const veryOftenCount = ratings["Very often"] || 0;
    const highFreq = oftenCount + veryOftenCount;

    return {
      id: st.id,
      code: st.code,
      label: st.label,
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
    const quotePerm = Boolean(sr.quotePermission);
    const q10Text = sr.q10WishSomeoneTold || sr.q18OneThingWishTold || null;
    const inst = sr.q2InstitutionName || null;

    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      surveyVersion: r.surveyVersion || "v2",
      source: r.source || "direct",
      trainingStage: r.trainingStage,
      collegeType: r.collegeType,
      state: r.state,
      institutionName: inst,
      q10WishSomeoneTold: q10Text,
      quotePermission: quotePerm,
      interestedInContributing: r.interestedInContributing,
      contributionInterests: Array.isArray(r.contributionInterests)
        ? (r.contributionInterests as string[])
        : null,
      respondentName: r.respondentName,
      email: r.email,
      mobileWhatsapp: r.mobileWhatsapp,
      surveyResponses: sr,
    };
  });

  return {
    totalResponses,
    v2ResponseCount,
    v1ResponseCount,
    quotePermissionCount,
    quotePermissionPercentage: Math.round((quotePermissionCount / totalResponses) * 100),
    interestedContributorsCount,
    interestedContributorsPercentage: Math.round((interestedContributorsCount / totalResponses) * 100),
    distinctStatesCount: distinctStatesSet.size,
    sourceBreakdown,
    trainingStageBreakdown: toMetricList(stageMap),
    collegeTypeBreakdown: toMetricList(collegeTypeMap),
    stateBreakdown: toMetricList(stateMap),
    q3RewardingBreakdown: toMetricList(q3Map),
    q4HarderBreakdown: toMetricList(q4Map),
    q5SurprisesBreakdown: toMetricList(q5Map),
    q6MatrixBreakdown,
    q7NextBatchBreakdown: toMetricList(q7Map),
    q8PreparationTypesBreakdown: toMetricList(q8PrepMap),
    q9TimingBreakdown: toMetricList(q9TimingMap),
    contributionMethodsBreakdown: toMetricList(contributorMethodsMap),
    calculatedInsights: {
      pctExcitingOrRewarding: Math.round(
        (Object.values(q3Map).reduce((a, b) => a + b, 0) > 0 ? 100 : 0)
      ),
      pctMajorChallenges: Math.round(
        (Object.values(q4Map).reduce((a, b) => a + b, 0) > 0 ? 100 : 0)
      ),
      pctDifficultTransition: Math.round((difficultTransitionExperienceCount / totalResponses) * 100),
      pctWantingEarlyPreparation: Math.round((wantingEarlyPrepCount / totalResponses) * 100),
      pctQuotePermissionGranted: Math.round((quotePermissionCount / totalResponses) * 100),
      pctInterestedInContributing: Math.round((interestedContributorsCount / totalResponses) * 100),
    },
    recentResponses,
  };
}
