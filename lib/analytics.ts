import { track } from "@vercel/analytics";

export function trackNeetEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | null>
) {
  try {
    if (typeof window !== "undefined") {
      track(eventName, properties);
    }
  } catch {
    // Graceful no-op in non-production or blocked environments
  }
}
