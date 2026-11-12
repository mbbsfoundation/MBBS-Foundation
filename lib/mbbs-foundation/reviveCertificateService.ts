import * as crypto from "crypto";
import { prisma } from "../prisma";
import { formatConciseMedicalCollegeName } from "./collegeFormat";

export { formatConciseMedicalCollegeName };

export const REVIVE_CERTIFICATE_CONFIG = {
  moduleCode: "REVIVE",
  moduleNumber: 7,
  totalModules: 14,
  moduleTitle: "REVIVE — Cardiopulmonary Resuscitation (CPR) and Relief of Choking",
  passingThresholdScore: 14,
  passingThresholdPct: 70,
  issuingOrganization: "MBBS FOUNDATION",
  initiative: "An initiative of Ayurvigyan Health Academy India Foundation",
  association: "In association with the IAP ALS–BLS Group",
  disclaimer: "This certificate recognizes completion of the REVIVE module's online learning and knowledge assessment.",
  title: "Certificate of Module Completion",
  programmeHeading: "MBBS FOUNDATION ONLINE LEARNING PROGRAMME",
};

/**
 * Module-specific logo configuration for LMS certificates.
 * - MBBS Foundation logo: permanent, top-left.
 * - Collaborating organization logo: configurable, top-right.
 * - Modules without a collaborating organization: top-right area remains empty.
 */
export interface CollaboratingOrgLogoConfig {
  name: string;
  webPath: string;
  filePath?: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ModuleCertificateLogoConfig {
  primaryLogo: {
    name: string;
    webPath: string;
    filePath?: string;
    alt: string;
    aspectRatio: number; // width / height: 1846 / 522 ≈ 3.536
  };
  watermark: {
    name: string;
    webPath: string;
    filePath?: string;
    alt: string;
    aspectRatio: number; // width / height: 1096 / 736 ≈ 1.489
  };
  collaboratingOrgLogo?: CollaboratingOrgLogoConfig;
}

export const MBBS_FOUNDATION_PRIMARY_LOGO = {
  name: "MBBS Foundation",
  webPath: "/MBBS%20Foundation%20Logo.png",
  fallbackWebPath: "/images/mbbs-foundation-logo-2.png",
  alt: "MBBS Foundation Logo",
  aspectRatio: 1846 / 522, // 3.536398
};

export const MBBS_FOUNDATION_WATERMARK = {
  name: "MBBS Foundation Watermark",
  webPath: "/MBBS%20Foundation%20watermark.png",
  alt: "MBBS Foundation Watermark",
  aspectRatio: 1096 / 736, // 1.48913
};

export const MODULE_COLLABORATING_LOGOS: Record<string, CollaboratingOrgLogoConfig | undefined> = {
  REVIVE: {
    name: "Indian Academy of Pediatrics — IAP ALS–BLS Group",
    webPath: "/IAP%20ALS%20BLS%20Logo.jpg",
    alt: "Indian Academy of Pediatrics & IAP ALS–BLS Group",
    width: 58,
    height: 40,
  },
  // Future LMS modules can declare their collaborating organization here,
  // or leave it undefined for modules without a collaborator.
};

export function getModuleLogoConfig(moduleCode: string = "REVIVE"): ModuleCertificateLogoConfig {
  const code = (moduleCode || "REVIVE").toUpperCase();
  return {
    primaryLogo: MBBS_FOUNDATION_PRIMARY_LOGO,
    watermark: MBBS_FOUNDATION_WATERMARK,
    collaboratingOrgLogo: MODULE_COLLABORATING_LOGOS[code],
  };
}

/**
 * Generates a unique, cryptographically secure certificate ID adhering to:
 * MBBSF-REV-YYYY-XXXXXXXX
 * where YYYY is the actual issuance year and XXXXXXXX is an 8-character uppercase hex token.
 */
export function generateReviveCertificateId(year: number = new Date().getFullYear()): string {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `MBBSF-REV-${year}-${suffix}`;
}

export interface PublicCertificateRecord {
  isValid: boolean;
  certificateId: string;
  learnerName: string;
  medicalCollege: string;
  moduleCode: string;
  moduleTitle: string;
  certificateTitle: string;
  completionDate: string;
  issuedAt: Date;
  score: number;
  percentage: number;
  passingThreshold: number;
  disclaimer: string;
  organization: string;
  initiative: string;
  association: string;
}

/**
 * Retrieves an existing REVIVE certificate for a given learner ID.
 */
export async function getReviveCertificateForUser(userId: string) {
  if (!userId) return null;
  return prisma.mBBSLearnerCertificate.findUnique({
    where: {
      userId_moduleCode_unique: {
        userId,
        moduleCode: REVIVE_CERTIFICATE_CONFIG.moduleCode,
      },
    },
  });
}

/**
 * Issues an immutable REVIVE certificate for an authenticated learner following verified assessment passage.
 * Idempotency safeguard: If a certificate already exists, the authoritative record is returned without re-creation.
 */
export async function issueReviveCertificate({
  userId,
  score,
  percentage,
}: {
  userId: string;
  score: number;
  percentage: number;
}) {
  if (!userId) {
    throw new Error("AUTHENTICATION_REQUIRED: Learner ID is required for certificate issuance.");
  }

  // 1. Validate passing eligibility (>= 14/20 or >= 70%)
  if (score < REVIVE_CERTIFICATE_CONFIG.passingThresholdScore || percentage < REVIVE_CERTIFICATE_CONFIG.passingThresholdPct) {
    throw new Error(
      `INELIGIBLE_SCORE: Minimum passing score of ${REVIVE_CERTIFICATE_CONFIG.passingThresholdScore}/20 (70%) required.`
    );
  }

  // 2. Strict Idempotency Check: Return existing certificate if already issued
  const existing = await prisma.mBBSLearnerCertificate.findUnique({
    where: {
      userId_moduleCode_unique: {
        userId,
        moduleCode: REVIVE_CERTIFICATE_CONFIG.moduleCode,
      },
    },
  });

  if (existing) {
    return {
      certificate: existing,
      isNew: false,
    };
  }

  // 3. Retrieve user profile to capture immutable snapshot of name & medical college
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      learningProfile: {
        include: {
          college: {
            select: { collegeName: true, shortName: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new Error("USER_NOT_FOUND: Active learner record not found.");
  }

  const profile = user.learningProfile;
  const learnerName = profile?.fullName?.trim() || user.fullName?.trim() || "Learner";
  const rawMedicalCollege =
    profile?.college?.collegeName?.trim() ||
    profile?.institutionName?.trim() ||
    "Medical College";
  const medicalCollege = formatConciseMedicalCollegeName(
    rawMedicalCollege,
    profile?.college?.shortName
  );

  // 4. Generate unique certificate ID with collision safeguard
  let certificateId = generateReviveCertificateId();
  let collisionCount = 0;
  while (collisionCount < 5) {
    const conflict = await prisma.mBBSLearnerCertificate.findUnique({
      where: { certificateId },
      select: { id: true },
    });
    if (!conflict) break;
    certificateId = generateReviveCertificateId();
    collisionCount++;
  }

  // 5. Persist immutable certificate snapshot in database
  const certificate = await prisma.mBBSLearnerCertificate.create({
    data: {
      certificateId,
      userId,
      moduleCode: REVIVE_CERTIFICATE_CONFIG.moduleCode,
      moduleTitle: REVIVE_CERTIFICATE_CONFIG.moduleTitle,
      learnerName,
      medicalCollege,
      score,
      percentage,
      passingThreshold: REVIVE_CERTIFICATE_CONFIG.passingThresholdPct,
      metadata: {
        source: "MBBS_FOUNDATION_ASSESSMENT",
        evaluatedAt: new Date().toISOString(),
      },
    },
  });

  return {
    certificate,
    isNew: true,
  };
}

/**
 * Public lookup of certificate by public certificateId.
 * Guarantees privacy: Never exposes email, mobile number, or assessment question answers.
 */
export async function getPublicReviveCertificate(certificateId: string): Promise<PublicCertificateRecord | null> {
  if (!certificateId || typeof certificateId !== "string") {
    return null;
  }

  const cleanId = certificateId.trim();

  const cert = await prisma.mBBSLearnerCertificate.findUnique({
    where: { certificateId: cleanId },
  });

  if (!cert) {
    return null;
  }

  const completionDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(cert.issuedAt);

  return {
    isValid: true,
    certificateId: cert.certificateId,
    learnerName: cert.learnerName,
    medicalCollege: formatConciseMedicalCollegeName(cert.medicalCollege),
    moduleCode: cert.moduleCode,
    moduleTitle: cert.moduleTitle,
    certificateTitle: REVIVE_CERTIFICATE_CONFIG.title,
    completionDate,
    issuedAt: cert.issuedAt,
    score: cert.score,
    percentage: cert.percentage,
    passingThreshold: cert.passingThreshold,
    disclaimer: REVIVE_CERTIFICATE_CONFIG.disclaimer,
    organization: REVIVE_CERTIFICATE_CONFIG.issuingOrganization,
    initiative: REVIVE_CERTIFICATE_CONFIG.initiative,
    association: REVIVE_CERTIFICATE_CONFIG.association,
  };
}
