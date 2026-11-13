import { getCleanCollegeDisplayName } from "../counselling/pathwayOrdering";

const PRESERVED_ACRONYMS = new Set([
  "AIIMS", "JIPMER", "PGIMER", "KGMU", "VMMC", "LHMC", "MAMC", "AFMC",
  "IMS-BHU", "BHU", "AMU", "GMC", "RIMS", "SNMC", "BJMC", "LTMMC",
  "TNMC", "UCMS", "NDMC", "IGMC", "RNT", "SPMC", "SMS", "GSVM",
  "BRD", "MLN", "LLRM", "MLB", "INHS", "ESIC", "GMERS", "NEIGRIHMS",
  "SKIMS", "SVIMS", "NILRATAN", "MGIMS", "HIMS", "SRMS", "KIMS", "JNMC",
  "MIMS", "GIMSR", "AIMS", "SIMS", "BIMS", "CIMS", "DIMS", "FIMS",
  "PIMS", "TIMS", "VIMS", "ZIMS", "MBBS", "INI"
]);

/**
 * Sanitizes and formats medical college names into official institution names for certificates.
 * Preserves official capitalization (acronyms like AIIMS, GMC), full institution name, and city/campus location.
 * Strips street addresses, postal pincodes, and MCC import noise without truncating or lowercase-mangling.
 */
export function formatConciseMedicalCollegeName(rawName?: string | null, shortName?: string | null): string {
  if (!rawName) return "Medical College";
  let clean = rawName.trim();

  // 1. Canonical AIIMS / INI variants checked FIRST with full official campus names
  const upper = clean.toUpperCase();
  if (upper.includes("ALL INDIA INSTITUTE OF MEDICAL SCIENCES") || upper.startsWith("AIIMS") || upper.includes("AIIMS")) {
    if (upper.includes("NEW DELHI") || upper.includes("ANSARI")) return "AIIMS New Delhi";
    if (upper.includes("RISHIKESH")) return "AIIMS Rishikesh";
    if (upper.includes("JODHPUR")) return "AIIMS Jodhpur";
    if (upper.includes("BHOPAL")) return "AIIMS Bhopal";
    if (upper.includes("BHUBANESWAR")) return "AIIMS Bhubaneswar";
    if (upper.includes("NAGPUR")) return "AIIMS Nagpur";
    if (upper.includes("RAIPUR")) return "AIIMS Raipur";
    if (upper.includes("PATNA")) return "AIIMS Patna";
    if (upper.includes("MANGALAGIRI")) return "AIIMS Mangalagiri";
    if (upper.includes("BATHINDA")) return "AIIMS Bathinda";
    if (upper.includes("GUWAHATI")) return "AIIMS Guwahati";
    if (upper.includes("BIBINAGAR") || upper.includes("BIBI NAGAR")) return "AIIMS Bibinagar";
    if (upper.includes("KALYANI")) return "AIIMS Kalyani";
    if (upper.includes("GORAKHPUR")) return "AIIMS Gorakhpur";
    if (upper.includes("RAEBARELI") || upper.includes("RAI BARELI")) return "AIIMS Raebareli";
    if (upper.includes("DEOGHAR") || upper.includes("DEOGARH")) return "AIIMS Deoghar";
    if (upper.includes("BILASPUR")) return "AIIMS Bilaspur";
    if (upper.includes("RAJKOT")) return "AIIMS Rajkot";
    if (upper.includes("JAMMU")) return "AIIMS Jammu";
    if (upper.includes("MADURAI")) return "AIIMS Madurai";
    if (upper.includes("AWANTIPORA")) return "AIIMS Awantipora";
    if (upper === "AIIMS") return "AIIMS";
  }

  if (upper.includes("JAWAHARLAL INSTITUTE OF POSTGRADUATE") || upper.startsWith("JIPMER") || upper.includes("JIPMER")) {
    if (upper.includes("KARAIKAL")) return "JIPMER Karaikal";
    return "JIPMER Puducherry";
  }

  if (upper.includes("POSTGRADUATE INSTITUTE OF MEDICAL EDUCATION") || upper.startsWith("PGIMER") || upper.includes("PGIMER")) {
    return "PGIMER Chandigarh";
  }

  // 2. If shortName is provided and is a specific institution name with campus (not a bare generic acronym like "AIIMS" or "GMC")
  if (shortName && shortName.trim().length >= 3 && shortName.trim().length < clean.length) {
    const sn = shortName.trim();
    const snUpper = sn.toUpperCase();
    const isGenericBareAcronym = ["AIIMS", "GMC", "GDC", "RIMS", "MIMS", "IMS", "MC"].includes(snUpper);
    if (!isGenericBareAcronym && !sn.includes(",") && !sn.includes("-")) {
      return sn;
    }
  }

  // 3. Try canonical college display sanitizer
  const knownCanonical = getCleanCollegeDisplayName(clean, shortName);
  if (knownCanonical && knownCanonical !== clean) {
    return knownCanonical;
  }

  // 4. Remove MCC standard address separator ' , ' (e.g. "College Name , Address, State - 123456")
  if (clean.includes(" , ")) {
    const parts = clean.split(" , ");
    if (parts[0] && parts[0].trim().length > 3) {
      clean = parts[0].trim();
    }
  }

  // 5. Remove trailing pincodes and addresses like ", City, State - 123456" or "- 123456"
  clean = clean.replace(/,\s*[A-Za-z\s]+-\s*\d{6}\s*$/, "");
  clean = clean.replace(/\s*-\s*\d{6}\s*$/, "");
  clean = clean.replace(/,\s*\d{6}\s*$/, "");

  // 6. Remove redundant street/address fragments if enclosed in parentheses at end
  clean = clean.replace(/\s*\([^)]*Road[^)]*\)$/i, "");
  clean = clean.replace(/\s*\([^)]*Campus[^)]*\)$/i, "");

  // 7. Clean up any lingering trailing commas or hyphens
  clean = clean.replace(/[,-\s]+$/, "").trim();

  // 8. Casing normalization: ONLY if string is ENTIRELY UPPERCASE
  // Do NOT touch strings that already have proper mixed casing (e.g. "St. John's Medical College")
  if (clean === clean.toUpperCase() && clean.length > 3) {
    clean = clean
      .toLowerCase()
      .split(" ")
      .map((word) => {
        const wordUpper = word.toUpperCase();
        if (PRESERVED_ACRONYMS.has(wordUpper)) return wordUpper;
        if (["and", "of", "in", "the", "for", "&"].includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  // Clean up punctuation like "AIIMS, Rishikesh" -> "AIIMS Rishikesh"
  clean = clean.replace(/^([A-Z]{2,6}),\s*/, "$1 ");

  return clean || rawName?.trim() || "Medical College";
}
