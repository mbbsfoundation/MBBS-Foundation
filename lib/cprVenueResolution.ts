import { normalizeDisplayState } from "./cprCensus";
import { normalizeStateCode } from "./sanjeevaniStorage";
import {
  getCanonicalVenuesByState,
  normalizeVenueKey,
  normalizeCityName,
  extractDistinctiveTokens,
} from "./cprVenueRegistry";
import {
  loadImplementedSupplementaryCourses,
  loadImplementedSupplementaryCoursesAsync,
  getFrozenVenueReviewSnapshot,
} from "./cprReconciliationStore";

export type VenueResolutionStatus =
  | "EXACT_CANONICAL"
  | "EXACT_SUPPLEMENTARY"
  | "NORMALIZED_MATCH"
  | "GENUINELY_NEW"
  | "AMBIGUOUS";

export interface CandidateVenueMatch {
  venueId: string;
  venueName: string;
  city: string;
  state: string;
  score: number;
  reason: string;
  isCanonical: boolean;
  isSupplementary: boolean;
}

export interface ResolveCPRVenueParams {
  state: string;
  city?: string;
  venueName: string;
  venueId?: string;
}

export interface VenueResolutionResult {
  status: VenueResolutionStatus;
  resolvedVenueId?: string;
  canonicalState: string;
  stateCode: string;
  canonicalVenueName: string;
  city: string;
  matchScore: number;
  matchReason: string;
  isExistingVenue: boolean;
  candidateMatches?: CandidateVenueMatch[];
}

/**
 * Normalizes single letter sequences like "b r " -> "br ", "k v " -> "kv "
 */
export function advancedVenueNormalization(rawVenue: string, _city?: string): string {
  if (!rawVenue) return "";
  let v = normalizeVenueKey(rawVenue);
  // Collapse single letters separated by space: "b r " -> "br "
  v = v.replace(/\b([a-z])\s+([a-z])\b/g, "$1$2");
  v = v.replace(/\b([a-z]{2})\s+([a-z])\b/g, "$1$2");
  return v.replace(/\s+/g, " ").trim();
}

/**
 * Calculates similarity score between input venue and candidate venue.
 */
function calculateVenueScore(
  inputNorm: string,
  inputTokens: string[],
  candNorm: string,
  candTokens: string[],
  inputCityNorm: string,
  candCityNorm: string
): { score: number; reason: string } {
  // 1. Exact normalized match
  if (inputNorm === candNorm) {
    return { score: 1.0, reason: "Exact normalized key match" };
  }

  // 2. Full substring containment with strict locality checks
  const inputSet = new Set(inputTokens);
  const candSet = new Set(candTokens);
  const intersection = inputTokens.filter((t) => candSet.has(t));

  // Check distinctive qualifiers: CM SHRI vs Sector 10 / Dwarka
  const inputHasCmShri = inputNorm.includes("cm shri") || inputNorm.includes("cm") || inputNorm.includes("cmshri");
  const candHasCmShri = candNorm.includes("cm shri") || candNorm.includes("cm") || candNorm.includes("cmshri");
  
  const inputHasSector10 = inputNorm.includes("sector 10") || inputNorm.includes("sector") || inputNorm.includes("dwarka");
  const candHasSector10 = candNorm.includes("sector 10") || candNorm.includes("sector") || candNorm.includes("dwarka");

  // If one is CM SHRI and other is Sector 10 / Dwarka without CM SHRI, they are DIFFERENT schools
  if ((inputHasCmShri && !candHasCmShri && candHasSector10) || (candHasCmShri && !inputHasCmShri && inputHasSector10)) {
    return { score: 0.2, reason: "Distinct institutions (CM Shri vs Sector 10/Dwarka branch)" };
  }

  // Check distinctive qualifiers: Punjabi Bagh vs Dwarka / generic
  const inputHasPunjabiBagh = inputNorm.includes("punjabi bagh") || inputNorm.includes("punjabi") || inputNorm.includes("bagh");
  const candHasPunjabiBagh = candNorm.includes("punjabi bagh") || candNorm.includes("punjabi") || candNorm.includes("bagh");

  if (inputHasPunjabiBagh && !candHasPunjabiBagh) {
    return { score: 0.3, reason: "Distinct branch (Punjabi Bagh branch vs main/other branch)" };
  }
  if (!inputHasPunjabiBagh && candHasPunjabiBagh) {
    return { score: 0.3, reason: "Distinct branch (input lacks Punjabi Bagh qualifier)" };
  }

  if (candNorm.includes(inputNorm) || inputNorm.includes(candNorm)) {
    const minLen = Math.min(inputNorm.length, candNorm.length);
    const maxLen = Math.max(inputNorm.length, candNorm.length);
    const ratio = minLen / maxLen;
    if (ratio > 0.45) {
      const matchScore = (inputHasCmShri && candHasCmShri) || (inputHasPunjabiBagh && candHasPunjabiBagh)
        ? 0.96
        : Math.min(0.95, 0.70 + ratio * 0.25);
      return { score: matchScore, reason: `Full substring containment (${Math.round(ratio * 100)}% coverage)` };
    }
  }

  // 3. Token Jaccard & Containment
  if (inputTokens.length > 0 && candTokens.length > 0) {
    // Check if key distinctive tokens match (e.g. "ambedkar" and "cm")
    const isDistinctiveShared = intersection.some((t) => t.length >= 5);
    const overlapRatio = intersection.length / Math.min(inputSet.size, candSet.size);

    if (inputHasCmShri && candHasCmShri && intersection.includes("ambedkar")) {
      return {
        score: 0.95,
        reason: `CM Shri Ambedkar school match: [${intersection.join(", ")}]`,
      };
    }

    if (inputHasPunjabiBagh && candHasPunjabiBagh && intersection.includes("agrasen")) {
      return {
        score: 0.96,
        reason: `Maharaja Agrasen Punjabi Bagh branch match: [${intersection.join(", ")}]`,
      };
    }

    const hasCityMismatch = inputCityNorm && candCityNorm && inputCityNorm !== candCityNorm && !inputCityNorm.includes(candCityNorm) && !candCityNorm.includes(inputCityNorm);

    if (intersection.length >= 2 && overlapRatio >= 0.6) {
      if (hasCityMismatch) {
        return { score: 0.4, reason: `Distinctive token overlap but different cities (${inputCityNorm} vs ${candCityNorm})` };
      }
      const cityBonus = inputCityNorm && candCityNorm && (inputCityNorm === candCityNorm || inputCityNorm.includes(candCityNorm) || candCityNorm.includes(inputCityNorm)) ? 0.05 : 0;
      return {
        score: Math.min(0.92, 0.75 + overlapRatio * 0.15 + cityBonus),
        reason: `Strong distinctive token match: [${intersection.join(", ")}]`,
      };
    }

    if (isDistinctiveShared && intersection.length >= 1 && overlapRatio >= 0.5) {
      if (hasCityMismatch) {
        return { score: 0.3, reason: `Keyword match across different cities (${inputCityNorm} vs ${candCityNorm})` };
      }
      return {
        score: 0.85,
        reason: `Distinctive keyword match: [${intersection.join(", ")}]`,
      };
    }
  }

  return { score: 0.0, reason: "No significant match" };
}

/**
 * Synchronous Central CPR Venue Resolution Service.
 */
export function resolveCPRVenue(params: ResolveCPRVenueParams): VenueResolutionResult {
  const rawState = params.state || "";
  const rawCity = (params.city || "").trim();
  const rawVenue = (params.venueName || "").trim();
  const rawId = (params.venueId || "").trim();

  const canonicalState = normalizeDisplayState(rawState);
  const stateCode = normalizeStateCode(rawState);

  const inputCityNorm = normalizeCityName(rawCity);
  const inputNorm = advancedVenueNormalization(rawVenue, rawCity);
  const inputTokens = extractDistinctiveTokens(inputNorm);

  // 1. Exact ID match check (if ID provided)
  if (rawId) {
    const cleanId = rawId.toUpperCase();
    
    // Check Canonical Venues
    const stateCanonical = getCanonicalVenuesByState(canonicalState);
    const foundCanon = stateCanonical.find(
      (v) => v.canonicalVenueId.toUpperCase() === cleanId
    );
    if (foundCanon) {
      return {
        status: "EXACT_CANONICAL",
        resolvedVenueId: foundCanon.canonicalVenueId,
        canonicalState,
        stateCode,
        canonicalVenueName: foundCanon.canonicalVenueName,
        city: foundCanon.city,
        matchScore: 1.0,
        matchReason: `Exact match on canonical venue ID ${cleanId}`,
        isExistingVenue: true,
      };
    }

    // Check Supplementary Venues
    const suppCourses = loadImplementedSupplementaryCourses();
    const foundSupp = suppCourses.find(
      (s) => (s.reviewId && s.reviewId.toUpperCase() === cleanId) || s.id.toUpperCase() === cleanId
    );
    if (foundSupp) {
      return {
        status: "EXACT_SUPPLEMENTARY",
        resolvedVenueId: foundSupp.reviewId || foundSupp.id,
        canonicalState,
        stateCode,
        canonicalVenueName: foundSupp.venue,
        city: foundSupp.city,
        matchScore: 1.0,
        matchReason: `Exact match on supplementary venue ID ${cleanId}`,
        isExistingVenue: true,
      };
    }
  }

  const candidates: CandidateVenueMatch[] = [];

  // 2. Search Implemented Supplementary Venues (Top Priority for newly implemented venues in that state)
  const suppCourses = loadImplementedSupplementaryCourses().filter(
    (s) => normalizeDisplayState(s.state).toLowerCase() === canonicalState.toLowerCase()
  );

  for (const s of suppCourses) {
    const candCityNorm = normalizeCityName(s.city);
    const candNorm = advancedVenueNormalization(s.venue, s.city);
    const candTokens = extractDistinctiveTokens(candNorm);

    const suppCheck = calculateVenueScore(inputNorm, inputTokens, candNorm, candTokens, inputCityNorm, candCityNorm);

    if (suppCheck.score >= 0.70) {
      candidates.push({
        venueId: s.reviewId || s.id,
        venueName: s.venue,
        city: s.city,
        state: s.state,
        score: suppCheck.score,
        reason: suppCheck.reason,
        isCanonical: false,
        isSupplementary: true,
      });
    }
  }

  // Also check review snapshot items
  const reviewItems = getFrozenVenueReviewSnapshot().filter(
    (r) =>
      normalizeDisplayState(r.state).toLowerCase() === canonicalState.toLowerCase() &&
      r.finalDecision === "SUPPLEMENTARY_NEW_VENUE"
  );
  for (const r of reviewItems) {
    const candCityNorm = normalizeCityName(r.city);
    const candNorm = advancedVenueNormalization(r.liveVenue, r.city);
    const candTokens = extractDistinctiveTokens(candNorm);
    const rCheck = calculateVenueScore(inputNorm, inputTokens, candNorm, candTokens, inputCityNorm, candCityNorm);
    if (rCheck.score >= 0.70) {
      const suppId = r.reviewId.startsWith("SUPP-") ? r.reviewId : `SUPP-${r.reviewId}`;
      if (!candidates.some((c) => c.venueId === suppId)) {
        candidates.push({
          venueId: suppId,
          venueName: r.liveVenue,
          city: r.city,
          state: r.state,
          score: rCheck.score,
          reason: rCheck.reason,
          isCanonical: false,
          isSupplementary: true,
        });
      }
    }
  }

  // 3. Search Canonical Venues
  const stateCanonical = getCanonicalVenuesByState(canonicalState);

  for (const c of stateCanonical) {
    const candCityNorm = normalizeCityName(c.city);
    const candNorm = advancedVenueNormalization(c.canonicalVenueName, c.city);
    const candTokens = extractDistinctiveTokens(candNorm);

    // Also check aliases
    const aliasNorms = (c.aliases || []).map((a) => advancedVenueNormalization(a, c.city));

    let bestScore = 0;
    let bestReason = "";

    const mainCheck = calculateVenueScore(inputNorm, inputTokens, candNorm, candTokens, inputCityNorm, candCityNorm);
    if (mainCheck.score > bestScore) {
      bestScore = mainCheck.score;
      bestReason = mainCheck.reason;
    }

    for (const an of aliasNorms) {
      const aTokens = extractDistinctiveTokens(an);
      const aCheck = calculateVenueScore(inputNorm, inputTokens, an, aTokens, inputCityNorm, candCityNorm);
      if (aCheck.score > bestScore) {
        bestScore = aCheck.score;
        bestReason = `Matched alias: ${aCheck.reason}`;
      }
    }

    if (bestScore >= 0.70) {
      candidates.push({
        venueId: c.canonicalVenueId,
        venueName: c.canonicalVenueName,
        city: c.city,
        state: c.state,
        score: bestScore,
        reason: bestReason,
        isCanonical: true,
        isSupplementary: false,
      });
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  // 4. Check for Ambiguity
  if (candidates.length > 1) {
    const top = candidates[0];
    const second = candidates[1];
    // If top two candidates are both strong and close in score, return AMBIGUOUS
    if (top.score >= 0.80 && second.score >= 0.75 && top.score - second.score < 0.10) {
      return {
        status: "AMBIGUOUS",
        canonicalState,
        stateCode,
        canonicalVenueName: rawVenue,
        city: rawCity,
        matchScore: top.score,
        matchReason: `Ambiguous match between multiple venues: "${top.venueName}" (${top.venueId}) vs "${second.venueName}" (${second.venueId})`,
        isExistingVenue: false,
        candidateMatches: candidates,
      };
    }
  }

  // 5. Single Strong Match Found
  if (candidates.length > 0 && candidates[0].score >= 0.80) {
    const match = candidates[0];
    return {
      status: match.isCanonical ? "EXACT_CANONICAL" : "NORMALIZED_MATCH",
      resolvedVenueId: match.venueId,
      canonicalState,
      stateCode,
      canonicalVenueName: match.venueName,
      city: match.city || rawCity,
      matchScore: match.score,
      matchReason: match.reason,
      isExistingVenue: true,
      candidateMatches: candidates,
    };
  }

  // 6. Genuinely New Venue
  return {
    status: "GENUINELY_NEW",
    canonicalState,
    stateCode,
    canonicalVenueName: rawVenue,
    city: rawCity,
    matchScore: 0.0,
    matchReason: "No matching canonical or supplementary venue found",
    isExistingVenue: false,
    candidateMatches: candidates,
  };
}

/**
 * Asynchronous Central CPR Venue Resolution Service.
 */
export async function resolveCPRVenueAsync(
  params: ResolveCPRVenueParams,
  forceRefresh = false
): Promise<VenueResolutionResult> {
  // Preload supplementary courses
  await loadImplementedSupplementaryCoursesAsync(forceRefresh);
  return resolveCPRVenue(params);
}
