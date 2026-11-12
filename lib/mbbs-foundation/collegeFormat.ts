import { getCleanCollegeDisplayName } from "../counselling/pathwayOrdering";

/**
 * Sanitizes and formats long, raw medical college names into concise official institution names.
 * Strips street addresses, postal pincodes, and MCC import noise without modifying underlying database records.
 */
export function formatConciseMedicalCollegeName(rawName?: string | null, shortName?: string | null): string {
  if (!rawName) return "Medical College";
  let clean = rawName.trim();

  // If shortName is provided and is a concise official acronym/name (e.g. "AIIMS Rishikesh", "KGMU Lucknow", "VMMC New Delhi")
  if (shortName && shortName.trim().length >= 3 && shortName.trim().length < clean.length) {
    const sn = shortName.trim();
    if (!sn.includes(",") && !sn.includes("-")) {
      return sn;
    }
  }

  // Check canonical AIIMS / INI variants
  const upper = clean.toUpperCase();
  if (upper.includes("ALL INDIA INSTITUTE OF MEDICAL SCIENCES") || upper.startsWith("AIIMS")) {
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
    if (upper.includes("DEOGHAR")) return "AIIMS Deoghar";
    if (upper.includes("BILASPUR")) return "AIIMS Bilaspur";
    if (upper.includes("RAJKOT")) return "AIIMS Rajkot";
    if (upper.includes("JAMMU")) return "AIIMS Jammu";
    if (upper.includes("MADURAI")) return "AIIMS Madurai";
    if (upper.includes("AWANTIPORA")) return "AIIMS Awantipora";
  }

  if (upper.includes("JAWAHARLAL INSTITUTE OF POSTGRADUATE") || upper.startsWith("JIPMER")) {
    if (upper.includes("KARAIKAL")) return "JIPMER Karaikal";
    return "JIPMER Puducherry";
  }

  // 1. Try canonical college display sanitizer
  const knownCanonical = getCleanCollegeDisplayName(clean, shortName);
  if (knownCanonical && knownCanonical !== clean) {
    return knownCanonical;
  }

  // 2. Remove MCC standard address separator ' , ' (e.g. "College Name , Address, State - 123456")
  if (clean.includes(" , ")) {
    const parts = clean.split(" , ");
    if (parts[0] && parts[0].trim().length > 3) {
      clean = parts[0].trim();
    }
  }

  // 3. Remove trailing pincodes and addresses like ", City, State - 123456" or "- 123456"
  clean = clean.replace(/,\s*[A-Za-z\s]+-\s*\d{6}\s*$/, "");
  clean = clean.replace(/\s*-\s*\d{6}\s*$/, "");
  clean = clean.replace(/,\s*\d{6}\s*$/, "");

  // 4. Remove redundant street/address fragments if enclosed in parentheses at end
  clean = clean.replace(/\s*\([^)]*Road[^)]*\)$/i, "");
  clean = clean.replace(/\s*\([^)]*Campus[^)]*\)$/i, "");

  // 5. Clean up any lingering trailing commas or hyphens
  clean = clean.replace(/[,-\s]+$/, "").trim();

  // 6. If entire string is in UPPERCASE and long, convert to clean Title Case for readability
  if (clean === clean.toUpperCase() && clean.length > 4) {
    clean = clean
      .toLowerCase()
      .split(" ")
      .map((word) => {
        if (["and", "of", "in", "the", "for", "&"].includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  return clean || rawName?.trim() || "Medical College";
}

