/**
 * Pure client-safe utilities for CPR Sanjeevani State routes & coordinator display.
 * Zero Node.js / fs / database dependencies — safe for Client Components and Edge runtimes.
 */

export const AUTHORITATIVE_STATE_NAMES = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Meghalaya",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const STATE_CODE_MAP: Record<string, string> = {
  "Andaman & Nicobar Islands": "AN",
  "Andhra Pradesh": "AP",
  "Assam": "AS",
  "Bihar": "BR",
  "Chandigarh": "CH",
  "Chhattisgarh": "CG",
  "Delhi": "DL",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jammu & Kashmir": "JK",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Ladakh": "LA",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Meghalaya": "ML",
  "Odisha": "OD",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Telangana": "TS",
  "Tripura": "TR",
  "Uttar Pradesh": "UP",
  "Uttarakhand": "UK",
  "West Bengal": "WB",
};

/**
 * Converts a state name to a URL-friendly slug.
 * e.g. "Andaman & Nicobar Islands" -> "andaman-and-nicobar-islands"
 * e.g. "Madhya Pradesh" -> "madhya-pradesh"
 */
export function stateNameToSlug(stateName: string): string {
  if (!stateName) return "";
  return stateName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves any state slug, code, or name variation to the authoritative canonical State name.
 */
export function slugToCanonicalState(rawQuery: string): string | null {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  const q = rawQuery.trim().toLowerCase();

  // 1. Direct slug match
  for (const s of AUTHORITATIVE_STATE_NAMES) {
    if (stateNameToSlug(s) === q) {
      return s;
    }
  }

  // 2. Also check hyphen variants where "and" might be omitted or replaced with "nicobar"
  const cleanQ = q.replace(/[^a-z0-9]/g, "");
  for (const s of AUTHORITATIVE_STATE_NAMES) {
    const cleanCanon = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanCanon === cleanQ) {
      return s;
    }
    const code = STATE_CODE_MAP[s]?.toLowerCase();
    if (code && code === q) {
      return s;
    }
  }

  // 3. Substring / keyword match for common abbreviations
  for (const s of AUTHORITATIVE_STATE_NAMES) {
    const sLower = s.toLowerCase();
    if (sLower.includes(q) || q.includes(sLower.replace(/[^a-z]/g, ""))) {
      return s;
    }
  }

  return null;
}

/**
 * Normalizes a person name for comparison (strips titles, punctuation, lowercase).
 */
export function normalizePersonName(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .replace(/\b(dr|prof|col|capt|brig|lt|col|maj|shri|sri|smt|mr|mrs|ms)\b\.?/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Standardizes person titles and casing for clean UI display.
 */
export function formatCoordinatorDisplayName(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let clean = raw.trim();

  // Normalize title prefix
  clean = clean.replace(/^dr\.?\s+/i, "Dr ");
  clean = clean.replace(/^prof\.?\s+/i, "Prof ");
  clean = clean.replace(/^col\.?\s+/i, "Col ");
  clean = clean.replace(/^capt\.?\s+/i, "Capt ");
  clean = clean.replace(/^mr\.?\s+/i, "Mr ");
  clean = clean.replace(/^mrs\.?\s+/i, "Mrs ");
  clean = clean.replace(/^ms\.?\s+/i, "Ms ");

  // Title-case if fully uppercase
  if (clean === clean.toUpperCase() && clean.length > 3) {
    clean = clean
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
    clean = clean.replace(/^Dr\s+/i, "Dr ");
  }

  return clean.replace(/\s+/g, " ").trim();
}

/**
 * Deduplicates and formats coordinator names for submitter dropdown selection.
 * e.g. ["Dr Gayatri Bhide", "DR. GAYATRI BHIDE", "Dr. Gayatri Bhide"] -> ["Dr Gayatri Bhide"]
 */
export function getNormalizedCoordinatorsForDisplay(rawNames: string[]): string[] {
  if (!Array.isArray(rawNames)) return [];
  const map = new Map<string, string>();

  for (const raw of rawNames) {
    if (!raw || typeof raw !== "string") continue;
    const clean = raw.trim();
    if (!clean || clean.toLowerCase() === "tba" || clean.toLowerCase() === "na") continue;

    const key = normalizePersonName(clean);
    if (!key) continue;

    const formatted = formatCoordinatorDisplayName(clean);
    if (!map.has(key)) {
      map.set(key, formatted);
    } else {
      const existing = map.get(key)!;
      if (formatted.startsWith("Dr ") && !existing.startsWith("Dr ")) {
        map.set(key, formatted);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
}

/**
 * Normalizes an Indian phone / mobile number for uniform comparison.
 */
export function normalizeMobileNumber(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.substring(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits.substring(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

