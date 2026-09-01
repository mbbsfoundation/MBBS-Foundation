import { cache } from "react";
import { prisma } from "../prisma";
import {
  getPrimaryOpenBenchmark,
  getCleanCollegeDisplayName,
  getStudentFriendlyQuotaLabel,
} from "./pathwayOrdering";
import type { CollegeRound1CategoryProfile } from "./evidenceTypes";

/**
 * Normalizes a state string to a URL-safe canonical state slug.
 */
export function getStateSlug(stateName: string): string {
  return stateName
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Canonical display names for all 34 States/UTs in the database.
 */
export const CANONICAL_STATES: Record<string, string> = {
  "uttar-pradesh": "Uttar Pradesh",
  "maharashtra": "Maharashtra",
  "tamil-nadu": "Tamil Nadu",
  "karnataka": "Karnataka",
  "telangana": "Telangana",
  "rajasthan": "Rajasthan",
  "gujarat": "Gujarat",
  "west-bengal": "West Bengal",
  "andhra-pradesh": "Andhra Pradesh",
  "kerala": "Kerala",
  "madhya-pradesh": "Madhya Pradesh",
  "bihar": "Bihar",
  "chhattisgarh": "Chhattisgarh",
  "odisha": "Odisha",
  "haryana": "Haryana",
  "assam": "Assam",
  "punjab": "Punjab",
  "jammu-and-kashmir": "Jammu & Kashmir",
  "delhi": "Delhi",
  "jharkhand": "Jharkhand",
  "uttarakhand": "Uttarakhand",
  "puducherry": "Puducherry",
  "himachal-pradesh": "Himachal Pradesh",
  "manipur": "Manipur",
  "meghalaya": "Meghalaya",
  "tripura": "Tripura",
  "sikkim": "Sikkim",
  "goa": "Goa",
  "nagaland": "Nagaland",
  "dadra-and-nagar-haveli-and-daman-and-diu": "Dadra and Nagar Haveli and Daman and Diu",
  "arunachal-pradesh": "Arunachal Pradesh",
  "mizoram": "Mizoram",
  "andaman-and-nicobar-islands": "Andaman & Nicobar Islands",
  "chandigarh": "Chandigarh",
};

export interface StateCollegeDirectoryItem {
  id: string;
  slug: string;
  collegeName: string;
  cleanName: string;
  city: string | null;
  state: string;
  managementType: string;
  isINI: boolean;
  isDeemed: boolean;
  isCentralUniversity: boolean;
  isESIC: boolean;
  approvedSeats: number;
  hasMccEvidence: boolean;
  primaryBenchmark: {
    quota: string;
    friendlyQuota: string;
    bestAIR: number | null;
    medianAIR: number | null;
    highestAIR: number | null;
  } | null;
}

export interface StateHubSummary {
  totalColleges: number;
  totalSeats: number;
  govtColleges: number;
  govtSeats: number;
  privateColleges: number;
  privateSeats: number;
  deemedColleges: number;
  deemedSeats: number;
  centralIniColleges: number;
  centralIniSeats: number;
  collegesWithMccEvidence: number;
}

export interface StateHubData {
  stateSlug: string;
  stateName: string;
  summary: StateHubSummary;
  colleges: StateCollegeDirectoryItem[];
}

export interface StateDirectoryItem {
  stateSlug: string;
  stateName: string;
  totalColleges: number;
  totalSeats: number;
  collegesWithMccEvidence: number;
}

/**
 * Returns all valid State Hub slugs for static parameter generation and sitemap.
 */
export function getAllStateHubSlugs(): string[] {
  return Object.keys(CANONICAL_STATES);
}

/**
 * Retrieves concise summary metrics for all 34 States/UTs for the master Counselling Hub directory.
 */
export const getAllStateHubSummaries = cache(async (): Promise<StateDirectoryItem[]> => {
  const colleges = await prisma.college.findMany({
    where: { isActive: true },
    select: {
      id: true,
      state: true,
      isINI: true,
      capacities: { where: { academicYear: 2026 }, select: { approvedSeats: true }, take: 1 },
      analyticsSnapshots: { select: { seatsOffered: true } },
    },
  });

  const stateMap = new Map<string, { totalColleges: number; totalSeats: number; collegesWithMccEvidence: number }>();

  for (const slug of Object.keys(CANONICAL_STATES)) {
    stateMap.set(slug, { totalColleges: 0, totalSeats: 0, collegesWithMccEvidence: 0 });
  }

  for (const c of colleges) {
    const slug = getStateSlug(c.state);
    if (!stateMap.has(slug)) continue;

    const entry = stateMap.get(slug)!;
    entry.totalColleges++;

    const nmcCap = c.capacities[0]?.approvedSeats ?? 0;
    const snapshotSeats = c.analyticsSnapshots.reduce((acc, s) => acc + s.seatsOffered, 0);
    const approvedSeats = nmcCap > 0 ? nmcCap : (c.isINI && snapshotSeats > 0 ? snapshotSeats : 0);
    entry.totalSeats += approvedSeats;

    if (c.analyticsSnapshots.length > 0) {
      entry.collegesWithMccEvidence++;
    }
  }

  return Object.entries(CANONICAL_STATES).map(([slug, name]) => {
    const metrics = stateMap.get(slug) || { totalColleges: 0, totalSeats: 0, collegesWithMccEvidence: 0 };
    return {
      stateSlug: slug,
      stateName: name,
      totalColleges: metrics.totalColleges,
      totalSeats: metrics.totalSeats,
      collegesWithMccEvidence: metrics.collegesWithMccEvidence,
    };
  }).sort((a, b) => b.totalColleges - a.totalColleges);
});

/**
 * Retrieves complete factual evidence and capacity matrix for a specific State Hub by state slug.
 */
export const getStateHubData = cache(async (stateSlug: string): Promise<StateHubData | null> => {
  const canonicalName = CANONICAL_STATES[stateSlug];
  if (!canonicalName) return null;

  // Single batched query for all colleges belonging to this state
  const allColleges = await prisma.college.findMany({
    where: { isActive: true },
    include: {
      capacities: { where: { academicYear: 2026 }, take: 1 },
      analyticsSnapshots: true,
    },
  });

  const stateColleges = allColleges.filter((c) => getStateSlug(c.state) === stateSlug);
  if (stateColleges.length === 0) return null;

  let totalSeats = 0;
  let govtColleges = 0;
  let govtSeats = 0;
  let privateColleges = 0;
  let privateSeats = 0;
  let deemedColleges = 0;
  let deemedSeats = 0;
  let centralIniColleges = 0;
  let centralIniSeats = 0;
  let collegesWithMccEvidence = 0;

  const formattedColleges: StateCollegeDirectoryItem[] = stateColleges.map((c) => {
    const cleanName = getCleanCollegeDisplayName(c.collegeName, c.shortName);
    const nmcCap = c.capacities[0]?.approvedSeats ?? 0;
    const snapshotSeats = c.analyticsSnapshots.reduce((acc, s) => acc + s.seatsOffered, 0);
    const approvedSeats = nmcCap > 0 ? nmcCap : (c.isINI && snapshotSeats > 0 ? snapshotSeats : 0);

    const mappedProfiles: CollegeRound1CategoryProfile[] = c.analyticsSnapshots.map((s) => ({
      quota: s.quota,
      seatCategory: s.seatCategory,
      isPwD: s.isPwD,
      specialPathway: s.specialPathway,
      seatsOffered: s.seatsOffered,
      seatsAllotted: s.seatsAllotted,
      matrixGap: s.matrixGap,
      bestAIR: s.bestAIR,
      medianAIR: s.medianAIR,
      highestAIR: s.highestAIR,
      sampleSize: s.sampleSize,
    }));

    const primaryBenchmark = getPrimaryOpenBenchmark(mappedProfiles);
    const hasMccEvidence = c.analyticsSnapshots.length > 0 && primaryBenchmark !== null && primaryBenchmark.medianAIR !== null;
    if (hasMccEvidence) collegesWithMccEvidence++;

    totalSeats += approvedSeats;

    if (c.isDeemed) {
      deemedColleges++;
      deemedSeats += approvedSeats;
    } else if (c.isINI || c.isCentralUniversity) {
      centralIniColleges++;
      centralIniSeats += approvedSeats;
    } else if (c.managementType === "GOVERNMENT") {
      govtColleges++;
      govtSeats += approvedSeats;
    } else {
      privateColleges++;
      privateSeats += approvedSeats;
    }

    return {
      id: c.id,
      slug: c.slug,
      collegeName: c.collegeName,
      cleanName,
      city: c.city,
      state: c.state,
      managementType: c.managementType,
      isINI: c.isINI,
      isDeemed: c.isDeemed,
      isCentralUniversity: c.isCentralUniversity,
      isESIC: c.isESIC,
      approvedSeats,
      hasMccEvidence,
      primaryBenchmark: primaryBenchmark
        ? {
            quota: primaryBenchmark.quota,
            friendlyQuota: getStudentFriendlyQuotaLabel(primaryBenchmark.quota),
            bestAIR: primaryBenchmark.bestAIR,
            medianAIR: primaryBenchmark.medianAIR,
            highestAIR: primaryBenchmark.highestAIR,
          }
        : null,
    };
  });

  // Sort colleges:
  // 1. Has MCC evidence first (by medianAIR ascending)
  // 2. No MCC evidence second (alphabetical by cleanName)
  formattedColleges.sort((a, b) => {
    if (a.hasMccEvidence && !b.hasMccEvidence) return -1;
    if (!a.hasMccEvidence && b.hasMccEvidence) return 1;
    if (a.hasMccEvidence && b.hasMccEvidence) {
      const medA = a.primaryBenchmark?.medianAIR ?? Infinity;
      const medB = b.primaryBenchmark?.medianAIR ?? Infinity;
      if (medA !== medB) return medA - medB;
    }
    return a.cleanName.localeCompare(b.cleanName);
  });

  return {
    stateSlug,
    stateName: canonicalName,
    summary: {
      totalColleges: stateColleges.length,
      totalSeats,
      govtColleges,
      govtSeats,
      privateColleges,
      privateSeats,
      deemedColleges,
      deemedSeats,
      centralIniColleges,
      centralIniSeats,
      collegesWithMccEvidence,
    },
    colleges: formattedColleges,
  };
});
