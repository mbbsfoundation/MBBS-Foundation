import { prisma } from "@/lib/prisma";

export interface ReviveCertificateSummary {
  certificateId: string;
  moduleCode: string;
  score: number;
  percentage: number;
  passingThreshold: number;
  issuedAt: string;
}

export interface LearnerAdminItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  normalizedEmail: string;
  mobileNumber: string;
  learnerCategory: string;
  learnerCategoryLabel: string;
  collegeId: string | null;
  institutionName: string;
  state: string;
  district: string;
  city: string;
  pinCode: string;
  mbbsYear: string | null;
  departmentDesignation: string | null;
  createdAt: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  reviveCertificate: ReviveCertificateSummary | null;
}

export interface LearnerAdminSummary {
  totalRegistered: number;
  totalVerified: number;
  totalColleges: number;
  totalCertificates: number;
}

export interface LearnerAdminFilterParams {
  search?: string;
  college?: string;
  state?: string;
  category?: string;
  certified?: "ALL" | "YES" | "NO";
  verified?: "ALL" | "YES" | "NO";
}

/**
 * Human-readable label for learner category enum.
 */
export function formatLearnerCategory(category: string): string {
  const map: Record<string, string> = {
    MBBS_STUDENT: "MBBS Student",
    INTERN: "Intern",
    POSTGRADUATE_RESIDENT: "Postgraduate Resident",
    DOCTOR: "Doctor / Clinician",
    MEDICAL_FACULTY: "Medical Faculty",
    RESOURCE_PERSON: "Resource Person",
    OTHER_HEALTHCARE_PROFESSIONAL: "Healthcare Professional",
  };
  return map[category] || category.replace(/_/g, " ");
}

/**
 * Computes live aggregated summary metrics for the Online Learning Programme.
 */
export async function getLearnerAdminSummary(): Promise<LearnerAdminSummary> {
  const [totalRegistered, verifiedUsersCount, certificatesCount, distinctColleges] =
    await Promise.all([
      prisma.mBBSLearningProfile.count(),
      prisma.user.count({
        where: {
          learningProfile: { isNot: null },
          emailVerifiedAt: { not: null },
        },
      }),
      prisma.mBBSLearnerCertificate.count({
        where: { moduleCode: "REVIVE" },
      }),
      prisma.mBBSLearningProfile.findMany({
        select: { institutionName: true },
        distinct: ["institutionName"],
      }),
    ]);

  return {
    totalRegistered,
    totalVerified: verifiedUsersCount,
    totalColleges: distinctColleges.length,
    totalCertificates: certificatesCount,
  };
}

/**
 * Fetches all registered learners with user verification status and REVIVE certificate.
 * Performs in-memory filtering and provides unique lists of colleges, states, and categories.
 */
export async function getLearnersAdminList(filters?: LearnerAdminFilterParams): Promise<{
  learners: LearnerAdminItem[];
  availableColleges: string[];
  availableStates: string[];
  availableCategories: { value: string; label: string }[];
}> {
  const profiles = await prisma.mBBSLearningProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          emailVerifiedAt: true,
          isActive: true,
          learnerCertificates: {
            where: { moduleCode: "REVIVE" },
            select: {
              id: true,
              certificateId: true,
              moduleCode: true,
              score: true,
              percentage: true,
              passingThreshold: true,
              issuedAt: true,
            },
          },
        },
      },
    },
  });

  const availableColleges = Array.from(
    new Set(profiles.map((p) => p.institutionName).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const availableStates = Array.from(
    new Set(profiles.map((p) => p.state).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const uniqueRawCategories = Array.from(
    new Set(profiles.map((p) => p.learnerCategory).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const availableCategories = uniqueRawCategories.map((cat) => ({
    value: cat,
    label: formatLearnerCategory(cat),
  }));

  let mapped: LearnerAdminItem[] = profiles.map((p) => {
    const reviveCert = p.user?.learnerCertificates?.[0] || null;
    const isEmailVerified = Boolean(p.user?.emailVerifiedAt);

    return {
      id: p.id,
      userId: p.userId,
      fullName: p.fullName,
      email: p.email,
      normalizedEmail: p.normalizedEmail,
      mobileNumber: p.mobileNumber,
      learnerCategory: p.learnerCategory,
      learnerCategoryLabel: formatLearnerCategory(p.learnerCategory),
      collegeId: p.collegeId,
      institutionName: p.institutionName,
      state: p.state,
      district: p.district,
      city: p.city,
      pinCode: p.pinCode,
      mbbsYear: p.mbbsYear,
      departmentDesignation: p.departmentDesignation,
      createdAt: p.createdAt.toISOString(),
      emailVerified: isEmailVerified,
      emailVerifiedAt: p.user?.emailVerifiedAt ? p.user.emailVerifiedAt.toISOString() : null,
      reviveCertificate: reviveCert
        ? {
            certificateId: reviveCert.certificateId,
            moduleCode: reviveCert.moduleCode,
            score: reviveCert.score,
            percentage: reviveCert.percentage,
            passingThreshold: reviveCert.passingThreshold,
            issuedAt: reviveCert.issuedAt.toISOString(),
          }
        : null,
    };
  });

  // Apply filters
  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase().trim();
    mapped = mapped.filter((item) => {
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.institutionName.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        (item.reviveCertificate?.certificateId &&
          item.reviveCertificate.certificateId.toLowerCase().includes(q))
      );
    });
  }

  if (filters?.college && filters.college !== "ALL") {
    mapped = mapped.filter((item) => item.institutionName === filters.college);
  }

  if (filters?.state && filters.state !== "ALL") {
    mapped = mapped.filter((item) => item.state === filters.state);
  }

  if (filters?.category && filters.category !== "ALL") {
    mapped = mapped.filter((item) => item.learnerCategory === filters.category);
  }

  if (filters?.certified === "YES") {
    mapped = mapped.filter((item) => Boolean(item.reviveCertificate));
  } else if (filters?.certified === "NO") {
    mapped = mapped.filter((item) => !item.reviveCertificate);
  }

  if (filters?.verified === "YES") {
    mapped = mapped.filter((item) => item.emailVerified);
  } else if (filters?.verified === "NO") {
    mapped = mapped.filter((item) => !item.emailVerified);
  }

  return {
    learners: mapped,
    availableColleges,
    availableStates,
    availableCategories,
  };
}

/**
 * Escapes CSV values according to RFC 4180 with spreadsheet formula injection defense (CWE-1236).
 */
export function escapeCsvField(field: any): string {
  if (field === null || field === undefined) {
    return '""';
  }
  let str = String(field);

  // Formula injection defense: if field begins with =, +, -, @, tab, or carriage return,
  // prepend a single quote so spreadsheet software interprets it as literal text.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180 Escaping: wrap in quotes and escape internal quotes
  if (
    str.includes('"') ||
    str.includes(",") ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.startsWith("'")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Builds standard CSV content for learner export.
 */
export function generateLearnersCsv(learners: LearnerAdminItem[]): string {
  const headers = [
    "Learner ID",
    "Registration Date",
    "Full Name",
    "Registered Email",
    "Mobile Number",
    "Email Verification Status",
    "Email Verified At",
    "Learner Category",
    "Medical College / Institution",
    "State",
    "District",
    "City",
    "PIN Code",
    "MBBS Year",
    "Department / Designation",
    "REVIVE Certified",
    "REVIVE Certificate ID",
    "REVIVE Score (out of 20)",
    "REVIVE Percentage",
    "REVIVE Certificate Issued At",
  ];

  const rows = learners.map((l) => [
    escapeCsvField(l.id),
    escapeCsvField(l.createdAt),
    escapeCsvField(l.fullName),
    escapeCsvField(l.email),
    escapeCsvField(l.mobileNumber),
    escapeCsvField(l.emailVerified ? "VERIFIED" : "PENDING"),
    escapeCsvField(l.emailVerifiedAt || ""),
    escapeCsvField(l.learnerCategoryLabel),
    escapeCsvField(l.institutionName),
    escapeCsvField(l.state),
    escapeCsvField(l.district),
    escapeCsvField(l.city),
    escapeCsvField(l.pinCode),
    escapeCsvField(l.mbbsYear || ""),
    escapeCsvField(l.departmentDesignation || ""),
    escapeCsvField(l.reviveCertificate ? "YES" : "NO"),
    escapeCsvField(l.reviveCertificate?.certificateId || ""),
    escapeCsvField(l.reviveCertificate?.score ?? ""),
    escapeCsvField(l.reviveCertificate ? `${l.reviveCertificate.percentage}%` : ""),
    escapeCsvField(l.reviveCertificate?.issuedAt || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

