import { ImageResponse } from "next/og";
import { getCollegeEvidenceBySlug } from "@/lib/counselling/evidenceService";
import {
  getPrimaryOpenBenchmark,
  getStudentFriendlyQuotaLabel,
} from "@/lib/counselling/pathwayOrdering";

export const runtime = "nodejs";

export const alt = "Medical College NEET-UG 2026 Allotment Evidence & MBBS Seats";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Image({ params }: Props) {
  let college = null;
  try {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug
      ? decodeURIComponent(resolvedParams.slug).trim().toLowerCase()
      : "";
    if (slug) {
      college = await getCollegeEvidenceBySlug(slug);
    }
  } catch (err) {
    console.error("Error generating college OG image:", err);
  }

  if (!college) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#070b14",
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #1e293b 0%, #070b14 100%)",
            color: "#ffffff",
            fontFamily: "sans-serif",
            padding: "40px",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#38bdf8",
              marginBottom: 14,
              letterSpacing: "2px",
            }}
          >
            NEET-UG 2026 COUNSELLING PLANNER
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: 18,
            }}
          >
            Medical College Profile
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#94a3b8",
            }}
          >
            MBBS Foundation™ • https://mbbsfoundation.com
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }

  const primaryBenchmark = getPrimaryOpenBenchmark(college.allCategoryProfiles || []);
  const studentFriendlyQuota = primaryBenchmark
    ? getStudentFriendlyQuotaLabel(primaryBenchmark.quota)
    : "";

  // Dynamic typography for college name based on character length
  const nameLen = college.collegeName.length;
  let titleFontSize = 38;
  let titleLineHeight = 1.15;
  if (nameLen > 90) {
    titleFontSize = 24;
    titleLineHeight = 1.2;
  } else if (nameLen > 50) {
    titleFontSize = 30;
    titleLineHeight = 1.18;
  }

  // Institutional classification determination
  let primaryBadge =
    college.managementType === "GOVERNMENT"
      ? "Government Medical College"
      : college.managementType === "INI" || college.isINI
      ? "Institute of National Importance (INI)"
      : "Private Medical College";

  let secondaryBadge = "";
  if (college.isDeemed) {
    secondaryBadge = "Deemed University";
  } else if (college.isCentralUniversity) {
    secondaryBadge = "Central University";
  } else if (college.isESIC) {
    secondaryBadge = "ESIC Medical College";
  }

  let managementDisplay = "Private";
  if (college.managementType === "GOVERNMENT") {
    managementDisplay = "Government";
  } else if (college.managementType === "INI" || college.isINI) {
    managementDisplay = "Central / INI";
  } else if (college.isDeemed) {
    managementDisplay = "Deemed (Private)";
  }

  const totalSeats = college.totalMBBSSeats2026 || 0;
  const locationStr = college.city
    ? `${college.city}, ${college.state}`
    : college.state;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#070b14",
          backgroundImage:
            "radial-gradient(circle at 90% 10%, #1e3a8a 0%, #0a1128 45%, #050811 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: "28px 36px",
          boxSizing: "border-box",
        }}
      >
        {/* TOP STRIP */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(37, 99, 235, 0.25)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 800,
              color: "#93c5fd",
              letterSpacing: "1.2px",
            }}
          >
            NEET-UG 2026 • MCC ROUND-1 DATA
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "12px",
              color: "#94a3b8",
              fontWeight: 500,
              letterSpacing: "0.2px",
            }}
          >
            Based on MCC NEET-UG 2026 Round-1 Allotment Data
          </div>
        </div>

        {/* COLLEGE IDENTITY SECTION */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "12px",
            marginBottom: "12px",
          }}
        >
          {/* Dominant College Name */}
          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: titleLineHeight,
              letterSpacing: "-0.5px",
              maxHeight: "85px",
              overflow: "hidden",
            }}
          >
            {college.collegeName}
          </div>

          {/* Location & Badges Sub-row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
              }}
            >
              📍 {locationStr}
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor:
                  college.managementType === "GOVERNMENT"
                    ? "rgba(16, 185, 129, 0.18)"
                    : college.isINI || college.managementType === "INI"
                    ? "rgba(99, 102, 241, 0.2)"
                    : "rgba(100, 116, 139, 0.25)",
                border:
                  college.managementType === "GOVERNMENT"
                    ? "1px solid rgba(16, 185, 129, 0.45)"
                    : college.isINI || college.managementType === "INI"
                    ? "1px solid rgba(129, 140, 248, 0.45)"
                    : "1px solid rgba(148, 163, 184, 0.35)",
                color:
                  college.managementType === "GOVERNMENT"
                    ? "#34d399"
                    : college.isINI || college.managementType === "INI"
                    ? "#a5b4fc"
                    : "#e2e8f0",
                borderRadius: "6px",
                padding: "2px 8px",
              }}
            >
              {primaryBadge}
            </div>

            {secondaryBadge && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  backgroundColor: "rgba(168, 85, 247, 0.2)",
                  border: "1px solid rgba(192, 132, 252, 0.45)",
                  color: "#d8b4fe",
                  borderRadius: "6px",
                  padding: "2px 8px",
                }}
              >
                {secondaryBadge}
              </div>
            )}
          </div>
        </div>

        {/* MAIN BODY: 2 EVIDENCE PANELS */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            width: "100%",
            height: "230px",
          }}
        >
          {/* PRIMARY EVIDENCE PANEL (64% width) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "65%",
              height: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              borderRadius: "14px",
              padding: "16px 20px",
              boxSizing: "border-box",
            }}
          >
            {primaryBenchmark ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  height: "100%",
                  justifyContent: "space-between",
                }}
              >
                {/* Median AIR Header & Value */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#fbbf24",
                        letterSpacing: "1.2px",
                        marginBottom: "2px",
                      }}
                    >
                      TYPICAL (MEDIAN) AIR
                    </div>
                    <div
                      style={{
                        fontSize: "56px",
                        fontWeight: 900,
                        color: "#ffffff",
                        lineHeight: 1,
                        letterSpacing: "-1px",
                      }}
                    >
                      {primaryBenchmark.medianAIR !== null && primaryBenchmark.medianAIR !== undefined
                        ? primaryBenchmark.medianAIR.toLocaleString("en-IN")
                        : "—"}
                    </div>
                  </div>

                  {/* Best & Last Observed Pills */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: "6px",
                        padding: "3px 10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          letterSpacing: "0.5px",
                        }}
                      >
                        BEST AIR:
                      </span>
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#38bdf8",
                        }}
                      >
                        {primaryBenchmark.bestAIR !== null && primaryBenchmark.bestAIR !== undefined
                          ? primaryBenchmark.bestAIR.toLocaleString("en-IN")
                          : "—"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: "6px",
                        padding: "3px 10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          letterSpacing: "0.5px",
                        }}
                      >
                        LAST OBSERVED AIR:
                      </span>
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#38bdf8",
                        }}
                      >
                        {primaryBenchmark.highestAIR !== null && primaryBenchmark.highestAIR !== undefined
                          ? primaryBenchmark.highestAIR.toLocaleString("en-IN")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pathway Context Footnote */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(51, 65, 85, 0.6)",
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                    MCC Round-1
                  </span>
                  <span>•</span>
                  <span>{studentFriendlyQuota}</span>
                  <span>•</span>
                  <span>Open Category</span>
                  {primaryBenchmark.seatsAllotted > 0 && (
                    <>
                      <span>•</span>
                      <span style={{ color: "#cbd5e1" }}>
                        {primaryBenchmark.seatsAllotted} observed Open allotments
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Factual Fallback for Non-MCC Institutions */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#94a3b8",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  MCC ROUND-1 AIR EVIDENCE
                </div>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#cbd5e1",
                    marginBottom: "6px",
                  }}
                >
                  MCC Round-1 AIR Evidence Not Available
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    lineHeight: 1.35,
                  }}
                >
                  Explore the college profile on MBBS Foundation™ for available
                  seat information.
                </div>
              </div>
            )}
          </div>

          {/* SEAT & CAPACITY PANEL (36% width) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "35%",
              height: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(51, 65, 85, 0.6)",
              borderRadius: "14px",
              padding: "16px 18px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  letterSpacing: "1px",
                  marginBottom: "2px",
                }}
              >
                ANNUAL INTAKE
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "46px",
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}
                >
                  {totalSeats > 0 ? totalSeats.toLocaleString("en-IN") : "—"}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#38bdf8",
                  }}
                >
                  MBBS Seats
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                paddingTop: "8px",
                borderTop: "1px solid rgba(51, 65, 85, 0.6)",
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Management:</span>
                <span style={{ color: "#ffffff", fontWeight: 600 }}>
                  {managementDisplay}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>State:</span>
                <span style={{ color: "#ffffff", fontWeight: 600 }}>
                  {college.state}
                </span>
              </div>
              {college.mccRound1SeatsOffered > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>MCC Round-1 Pool:</span>
                  <span style={{ color: "#38bdf8", fontWeight: 600 }}>
                    {college.mccRound1SeatsOffered} Seats
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM BRAND / CTA STRIP */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingTop: "10px",
            borderTop: "1px solid rgba(51, 65, 85, 0.5)",
          }}
        >
          {/* Brand Mark */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "19px",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.5px",
              }}
            >
              MBBS Foundation™
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              See where you stand in NEET-UG 2026
            </span>
          </div>

          {/* CTA Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(37, 99, 235, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#38bdf8",
            }}
          >
            Explore this college on MBBS Foundation™ →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
