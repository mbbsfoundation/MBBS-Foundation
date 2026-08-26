/**
 * Authoritative Locked Official Census Figures for National IAP CPR Day 2026.
 *
 * Source: Official National IAP CPR Day Programme Census Master.
 * These figures are authoritative and must NOT be overwritten by certificate counts.
 */

export interface LockedStateCensusEntry {
  state: string;
  canonicalState: string;
  centres: number;
  participantsTrained: number;
  zone: string;
}

export const LOCKED_OFFICIAL_STATE_CENSUS: LockedStateCensusEntry[] = [
  { state: "Andaman & Nikobar Island", canonicalState: "Andaman & Nicobar Islands", centres: 2, participantsTrained: 164, zone: "South Zone" },
  { state: "Andhra Pradesh", canonicalState: "Andhra Pradesh", centres: 42, participantsTrained: 3809, zone: "Central Zone" },
  { state: "Assam", canonicalState: "Assam", centres: 8, participantsTrained: 734, zone: "East Zone" },
  { state: "Bihar", canonicalState: "Bihar", centres: 23, participantsTrained: 2928, zone: "East Zone" },
  { state: "Chandigarh", canonicalState: "Chandigarh", centres: 13, participantsTrained: 1387, zone: "North Zone" },
  { state: "Chhattisgarh", canonicalState: "Chhattisgarh", centres: 7, participantsTrained: 760, zone: "Central Zone" },
  { state: "Delhi", canonicalState: "Delhi", centres: 10, participantsTrained: 939, zone: "North Zone" },
  { state: "Gujarat", canonicalState: "Gujarat", centres: 20, participantsTrained: 2289, zone: "West Zone" },
  { state: "Haryana", canonicalState: "Haryana", centres: 6, participantsTrained: 487, zone: "North Zone" },
  { state: "Himachal Pradesh", canonicalState: "Himachal Pradesh", centres: 1, participantsTrained: 36, zone: "North Zone" },
  { state: "Jammu & Kashmir", canonicalState: "Jammu & Kashmir", centres: 3, participantsTrained: 384, zone: "North Zone" },
  { state: "Jharkhand", canonicalState: "Jharkhand", centres: 1, participantsTrained: 94, zone: "East Zone" },
  { state: "Karnataka", canonicalState: "Karnataka", centres: 11, participantsTrained: 1158, zone: "South Zone" },
  { state: "Kerala", canonicalState: "Kerala", centres: 11, participantsTrained: 698, zone: "South Zone" },
  { state: "Ladakh", canonicalState: "Ladakh", centres: 2, participantsTrained: 142, zone: "North Zone" },
  { state: "Madhya Pradesh", canonicalState: "Madhya Pradesh", centres: 63, participantsTrained: 6448, zone: "Central Zone" },
  { state: "Maharashtra", canonicalState: "Maharashtra", centres: 49, participantsTrained: 5523, zone: "West Zone" },
  { state: "Meghalaya", canonicalState: "Meghalaya", centres: 6, participantsTrained: 1159, zone: "East Zone" },
  { state: "Odisha", canonicalState: "Odisha", centres: 9, participantsTrained: 1219, zone: "East Zone" },
  { state: "Punjab", canonicalState: "Punjab", centres: 24, participantsTrained: 2567, zone: "North Zone" },
  { state: "Rajasthan", canonicalState: "Rajasthan", centres: 5, participantsTrained: 359, zone: "North Zone" },
  { state: "Sikkim", canonicalState: "Sikkim", centres: 1, participantsTrained: 93, zone: "East Zone" },
  { state: "Tamil Nadu", canonicalState: "Tamil Nadu", centres: 9, participantsTrained: 1664, zone: "South Zone" },
  { state: "Telangana", canonicalState: "Telangana", centres: 5, participantsTrained: 1748, zone: "Central Zone" },
  { state: "Tripura", canonicalState: "Tripura", centres: 2, participantsTrained: 49, zone: "East Zone" },
  { state: "Uttar Pradesh", canonicalState: "Uttar Pradesh", centres: 12, participantsTrained: 1373, zone: "Central Zone" },
  { state: "Uttarakhand", canonicalState: "Uttarakhand", centres: 5, participantsTrained: 504, zone: "North Zone" },
  { state: "West Bengal", canonicalState: "West Bengal", centres: 41, participantsTrained: 4921, zone: "East Zone" },
];

export const LOCKED_OFFICIAL_INDIA_TOTAL = {
  centres: 391,
  participantsTrained: 43636,
  statesCount: 28,
};

/**
 * Returns the locked official census entry for a given state query (case and alias insensitive).
 */
export function getLockedOfficialStateCensus(stateQuery: string): LockedStateCensusEntry | undefined {
  if (!stateQuery) return undefined;
  const q = stateQuery.trim().toLowerCase();
  return LOCKED_OFFICIAL_STATE_CENSUS.find(
    (s) =>
      s.state.toLowerCase() === q ||
      s.canonicalState.toLowerCase() === q ||
      (q.includes("andaman") && s.canonicalState.includes("Andaman")) ||
      (q.includes("jammu") && s.canonicalState.includes("Jammu"))
  );
}

/**
 * Returns sorted list of all 28 authoritative States/UTs.
 */
export function getLockedCensusStateList(): LockedStateCensusEntry[] {
  return [...LOCKED_OFFICIAL_STATE_CENSUS].sort((a, b) =>
    a.canonicalState.localeCompare(b.canonicalState)
  );
}
