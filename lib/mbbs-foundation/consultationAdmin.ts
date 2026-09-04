import { prisma } from "@/lib/prisma";
import {
  READINESS_DOMAINS,
  READINESS_RATING_OPTIONS,
  PROFESSIONAL_ROLES_OPTIONS,
  Q8_OPTIONS,
  Q15_OPTIONS,
  Q17_WORKSHOP_FORMATS_OPTIONS,
  Q20_CONTRIBUTION_TYPES_OPTIONS,
  ConsultationDashboardSummary,
  SourcePerformanceMetrics,
  SourceRoleCrossTabItem,
  SourceStateCrossTabItem,
  ConsultationFilterParams,
  getSourceLabel,
} from "./consultationTypes";

export {
  getSourceLabel,
  type ConsultationDashboardSummary,
  type SourcePerformanceMetrics,
  type SourceRoleCrossTabItem,
  type SourceStateCrossTabItem,
  type ConsultationFilterParams,
};

/**
 * Computes aggregated summary statistics for the Professional Consultation Survey dashboard.
 */
export async function getConsultationDashboardSummary(): Promise<ConsultationDashboardSummary> {
  const responses = await prisma.mBBSProfessionalSurveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalResponses = responses.length;

  const emptyReadinessSummary = READINESS_DOMAINS.map((domain) => {
    const ratingsMap: Record<string, number> = {};
    for (const opt of READINESS_RATING_OPTIONS) {
      ratingsMap[opt] = 0;
    }
    return {
      code: domain.code,
      label: domain.label,
      totalRated: 0,
      ratings: ratingsMap,
      significantGapCount: 0,
      significantGapPercentage: 0,
    };
  });

  const emptyQ8 = Q8_OPTIONS.map((opt) => ({
    option: opt,
    count: 0,
    percentage: 0,
  }));

  const emptyQ15 = Q15_OPTIONS.map((opt) => ({
    option: opt,
    count: 0,
    percentage: 0,
  }));

  const emptyQ9 = READINESS_DOMAINS.map((domain) => ({
    code: domain.code,
    label: domain.label,
    count: 0,
    percentage: 0,
  }));

  const defaultSources = [
    { source: "faculty", label: "Faculty / Medical Education Network" },
    { source: "cpr", label: "CPR Course Coordinator / Champion Network" },
    { source: "direct", label: "Direct / Unattributed" },
  ];

  if (totalResponses === 0) {
    return {
      totalResponses: 0,
      interestedContributors: 0,
      willingToShareReadiness: 0,
      distinctStatesCount: 0,
      responsesThisWeek: 0,
      sourceBreakdown: defaultSources.map((s) => ({ ...s, count: 0, percentage: 0 })),
      sourcePerformance: defaultSources.map((s) => ({
        source: s.source,
        label: s.label,
        totalResponses: 0,
        percentageOfTotal: 0,
        interestedContributors: 0,
        contributorPercentage: 0,
        willingToShareReadiness: 0,
        sharePercentage: 0,
      })),
      sourceRoleCrossTab: [],
      sourceStateCrossTab: [],
      roleBreakdown: [],
      stateBreakdown: [],
      readinessDomainSummary: emptyReadinessSummary,
      q8EffectivenessSummary: emptyQ8,
      q15DescriptionSummary: emptyQ15,
      q9TopPriorityAreas: emptyQ9,
      q17WorkshopFormatsSummary: [],
      contributionInterestsSummary: [],
    };
  }

  // 1. Core counters
  const interestedContributors = responses.filter(
    (r) => r.interestedInContributing
  ).length;
  const willingToShareReadiness = responses.filter(
    (r) => r.willingToShareReadinessSurvey
  ).length;

  const statesSet = new Set(
    responses.map((r) => r.state).filter((s): s is string => !!s && s.trim().length > 0)
  );
  const distinctStatesCount = statesSet.size;

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const responsesThisWeek = responses.filter(
    (r) => new Date(r.createdAt) >= oneWeekAgo
  ).length;

  // 2. Source Breakdown & Detailed Performance Metrics
  const sourceGroups: Record<string, { total: number; contributors: number; sharing: number }> = {
    faculty: { total: 0, contributors: 0, sharing: 0 },
    cpr: { total: 0, contributors: 0, sharing: 0 },
    direct: { total: 0, contributors: 0, sharing: 0 },
  };

  for (const r of responses) {
    const s = (r.source || "direct").toLowerCase().trim();
    const groupKey = s === "faculty" ? "faculty" : s === "cpr" ? "cpr" : "direct";
    sourceGroups[groupKey].total++;
    if (r.interestedInContributing) sourceGroups[groupKey].contributors++;
    if (r.willingToShareReadinessSurvey) sourceGroups[groupKey].sharing++;
  }

  const sourcePerformance: SourcePerformanceMetrics[] = defaultSources.map((s) => {
    const data = sourceGroups[s.source] || { total: 0, contributors: 0, sharing: 0 };
    const pctOfTotal = totalResponses > 0 ? Math.round((data.total / totalResponses) * 100) : 0;
    const contPct = data.total > 0 ? Math.round((data.contributors / data.total) * 100) : 0;
    const sharePct = data.total > 0 ? Math.round((data.sharing / data.total) * 100) : 0;

    return {
      source: s.source,
      label: s.label,
      totalResponses: data.total,
      percentageOfTotal: pctOfTotal,
      interestedContributors: data.contributors,
      contributorPercentage: contPct,
      willingToShareReadiness: data.sharing,
      sharePercentage: sharePct,
    };
  });

  const sourceBreakdown = sourcePerformance.map((sp) => ({
    source: sp.source,
    label: sp.label,
    count: sp.totalResponses,
    percentage: sp.percentageOfTotal,
  }));

  // 3. Source + Professional Role Cross-Tab
  const roleCrossMap: Record<string, { faculty: number; cpr: number; direct: number; total: number }> = {};
  for (const role of PROFESSIONAL_ROLES_OPTIONS) {
    roleCrossMap[role] = { faculty: 0, cpr: 0, direct: 0, total: 0 };
  }

  for (const r of responses) {
    const s = (r.source || "direct").toLowerCase().trim();
    const sourceKey = s === "faculty" ? "faculty" : s === "cpr" ? "cpr" : "direct";
    const rolesArray = Array.isArray(r.roles) ? (r.roles as string[]) : [];

    for (const role of rolesArray) {
      if (!roleCrossMap[role]) {
        roleCrossMap[role] = { faculty: 0, cpr: 0, direct: 0, total: 0 };
      }
      roleCrossMap[role][sourceKey]++;
      roleCrossMap[role].total++;
    }
  }

  const sourceRoleCrossTab: SourceRoleCrossTabItem[] = Object.entries(roleCrossMap)
    .filter(([_, data]) => data.total > 0)
    .map(([role, data]) => ({
      role,
      facultyCount: data.faculty,
      cprCount: data.cpr,
      directCount: data.direct,
      totalCount: data.total,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  // 4. Source + State Cross-Tab
  const stateCrossMap: Record<string, { faculty: number; cpr: number; direct: number; total: number }> = {};

  for (const r of responses) {
    if (r.state && r.state.trim().length > 0) {
      const st = r.state.trim();
      if (!stateCrossMap[st]) {
        stateCrossMap[st] = { faculty: 0, cpr: 0, direct: 0, total: 0 };
      }
      const s = (r.source || "direct").toLowerCase().trim();
      const sourceKey = s === "faculty" ? "faculty" : s === "cpr" ? "cpr" : "direct";
      stateCrossMap[st][sourceKey]++;
      stateCrossMap[st].total++;
    }
  }

  const sourceStateCrossTab: SourceStateCrossTabItem[] = Object.entries(stateCrossMap)
    .map(([state, data]) => ({
      state,
      facultyCount: data.faculty,
      cprCount: data.cpr,
      directCount: data.direct,
      totalCount: data.total,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  // 5. Professional Role Overall Breakdown
  const roleCounts: Record<string, number> = {};
  for (const role of PROFESSIONAL_ROLES_OPTIONS) {
    roleCounts[role] = 0;
  }

  for (const r of responses) {
    const rolesArray = Array.isArray(r.roles) ? (r.roles as string[]) : [];
    for (const role of rolesArray) {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }
  }

  const roleBreakdown = Object.entries(roleCounts)
    .filter(([_, count]) => count > 0)
    .map(([role, count]) => ({
      role,
      count,
      percentage: Math.round((count / totalResponses) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 6. State Overall Breakdown
  const stateBreakdown = sourceStateCrossTab.map((st) => ({
    state: st.state,
    count: st.totalCount,
    percentage: Math.round((st.totalCount / totalResponses) * 100),
  }));

  // 7. Readiness domain summary (14 domains)
  const readinessDomainSummary = READINESS_DOMAINS.map((domain) => {
    const ratingsMap: Record<string, number> = {};
    for (const opt of READINESS_RATING_OPTIONS) {
      ratingsMap[opt] = 0;
    }

    let totalRated = 0;
    let significantGapCount = 0;

    for (const r of responses) {
      const respObj = (r.surveyResponses as any)?.readinessRatings || {};
      const val = respObj[domain.id];
      if (val && ratingsMap[val] !== undefined) {
        ratingsMap[val]++;
        totalRated++;
        if (val === "Poorly prepared" || val === "Not prepared at all") {
          significantGapCount++;
        }
      }
    }

    const significantGapPercentage = totalRated > 0
      ? Math.round((significantGapCount / totalRated) * 100)
      : 0;

    return {
      code: domain.code,
      label: domain.label,
      totalRated,
      ratings: ratingsMap,
      significantGapCount,
      significantGapPercentage,
    };
  });

  // 8. Q8 Foundation Course effectiveness
  const q8Counts: Record<string, number> = {};
  for (const opt of Q8_OPTIONS) {
    q8Counts[opt] = 0;
  }
  for (const r of responses) {
    const val = (r.surveyResponses as any)?.foundationCourseEffectiveness;
    if (val && q8Counts[val] !== undefined) {
      q8Counts[val]++;
    }
  }
  const q8EffectivenessSummary = Q8_OPTIONS.map((opt) => ({
    option: opt,
    count: q8Counts[opt],
    percentage: Math.round((q8Counts[opt] / totalResponses) * 100),
  }));

  // 9. Q15 Foundation Course Description
  const q15Counts: Record<string, number> = {};
  for (const opt of Q15_OPTIONS) {
    q15Counts[opt] = 0;
  }
  for (const r of responses) {
    const val = (r.surveyResponses as any)?.currentFoundationCourseDescription;
    if (val && q15Counts[val] !== undefined) {
      q15Counts[val]++;
    }
  }
  const q15DescriptionSummary = Q15_OPTIONS.map((opt) => ({
    option: opt,
    count: q15Counts[opt],
    percentage: Math.round((q15Counts[opt] / totalResponses) * 100),
  }));

  // 10. Q9 Top priority areas
  const q9Counts: Record<string, number> = {};
  for (const domain of READINESS_DOMAINS) {
    q9Counts[domain.id] = 0;
  }
  for (const r of responses) {
    const areas = (r.surveyResponses as any)?.greaterEmphasisAreas || [];
    if (Array.isArray(areas)) {
      for (const id of areas) {
        if (q9Counts[id] !== undefined) {
          q9Counts[id]++;
        }
      }
    }
  }
  const q9TopPriorityAreas = READINESS_DOMAINS.map((domain) => ({
    code: domain.code,
    label: domain.label,
    count: q9Counts[domain.id],
    percentage: Math.round((q9Counts[domain.id] / totalResponses) * 100),
  })).sort((a, b) => b.count - a.count);

  // 11. Q17 Preferred workshop formats
  const q17Counts: Record<string, number> = {};
  for (const fmt of Q17_WORKSHOP_FORMATS_OPTIONS) {
    q17Counts[fmt] = 0;
  }
  for (const r of responses) {
    const fmts = (r.surveyResponses as any)?.preferredWorkshopFormats || [];
    if (Array.isArray(fmts)) {
      for (const f of fmts) {
        if (q17Counts[f] !== undefined) {
          q17Counts[f]++;
        }
      }
    }
  }
  const q17WorkshopFormatsSummary = Q17_WORKSHOP_FORMATS_OPTIONS.map((fmt) => ({
    format: fmt,
    count: q17Counts[fmt],
    percentage: Math.round((q17Counts[fmt] / totalResponses) * 100),
  }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  // 12. Contribution interests summary
  const ctypeCounts: Record<string, number> = {};
  for (const ctype of Q20_CONTRIBUTION_TYPES_OPTIONS) {
    ctypeCounts[ctype] = 0;
  }
  for (const r of responses) {
    const cinterests = (r.contributionInterests as string[]) || (r.surveyResponses as any)?.contributionTypes || [];
    if (Array.isArray(cinterests)) {
      for (const ci of cinterests) {
        for (const ctype of Q20_CONTRIBUTION_TYPES_OPTIONS) {
          if (ci === ctype || ci.startsWith(ctype)) {
            ctypeCounts[ctype]++;
            break;
          }
        }
      }
    }
  }
  const contributionInterestsSummary = Q20_CONTRIBUTION_TYPES_OPTIONS.map((ctype) => ({
    type: ctype,
    count: ctypeCounts[ctype],
    percentage: totalResponses > 0 ? Math.round((ctypeCounts[ctype] / totalResponses) * 100) : 0,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    totalResponses,
    interestedContributors,
    willingToShareReadiness,
    distinctStatesCount,
    responsesThisWeek,
    sourceBreakdown,
    sourcePerformance,
    sourceRoleCrossTab,
    sourceStateCrossTab,
    roleBreakdown,
    stateBreakdown,
    readinessDomainSummary,
    q8EffectivenessSummary,
    q15DescriptionSummary,
    q9TopPriorityAreas,
    q17WorkshopFormatsSummary,
    contributionInterestsSummary,
  };
}

/**
 * Fetches filtered survey responses for the admin table.
 */
export async function getConsultationResponses(filters?: ConsultationFilterParams) {
  const whereClause: any = {};

  if (filters?.source && filters.source !== "ALL") {
    whereClause.source = filters.source;
  }

  if (filters?.state && filters.state !== "ALL") {
    whereClause.state = filters.state;
  }

  if (filters?.interestedInContributing !== undefined) {
    whereClause.interestedInContributing = filters.interestedInContributing;
  }

  if (filters?.willingToShareReadinessSurvey !== undefined) {
    whereClause.willingToShareReadinessSurvey = filters.willingToShareReadinessSurvey;
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const s = filters.search.trim();
    whereClause.OR = [
      { respondentName: { contains: s, mode: "insensitive" } },
      { institutionName: { contains: s, mode: "insensitive" } },
      { specialty: { contains: s, mode: "insensitive" } },
      { city: { contains: s, mode: "insensitive" } },
      { state: { contains: s, mode: "insensitive" } },
    ];
  }

  return prisma.mBBSProfessionalSurveyResponse.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches a single response by ID for the detail view.
 */
export async function getConsultationResponseById(id: string) {
  return prisma.mBBSProfessionalSurveyResponse.findUnique({
    where: { id },
  });
}
