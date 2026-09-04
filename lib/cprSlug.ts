/**
 * Pure client-safe URL slug utilities for CPR Sanjeevani State routes.
 * Zero Node.js / fs / database dependencies.
 */

export function stateNameToSlug(stateName: string): string {
  if (!stateName) return "";
  return stateName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
