import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  redeemRegistrationTicket,
  validateAndProtectExistingUser,
  normalizeEmail,
} from "./learnerAuth";

export const VALID_LEARNER_CATEGORIES = [
  "MBBS_STUDENT",
  "INTERN",
  "POSTGRADUATE_RESIDENT",
  "DOCTOR",
  "MEDICAL_FACULTY",
  "RESOURCE_PERSON",
  "OTHER_HEALTHCARE_PROFESSIONAL",
] as const;

export type MBBSLearnerCategoryType = (typeof VALID_LEARNER_CATEGORIES)[number];

export interface LearnerRegistrationInput {
  ticket?: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  learnerCategory: MBBSLearnerCategoryType;
  collegeId?: string | null;
  institutionName?: string | null;
  state: string;
  district: string;
  city: string;
  pinCode: string;
  mbbsYear?: string | null;
  departmentDesignation?: string | null;
}

export interface SanitizedRegistrationInput {
  fullName: string;
  displayEmail: string;
  normalizedEmail: string;
  mobileNumber: string;
  learnerCategory: MBBSLearnerCategoryType;
  collegeId: string | null;
  institutionName: string;
  state: string;
  district: string;
  city: string;
  pinCode: string;
  mbbsYear: string | null;
  departmentDesignation: string | null;
}

export class RegistrationError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "RegistrationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Validates and sanitizes registration input from the client.
 */
export function validateRegistrationInput(raw: any): {
  isValid: boolean;
  data?: SanitizedRegistrationInput;
  errors?: Record<string, string>;
  message?: string;
} {
  const errors: Record<string, string> = {};

  if (!raw || typeof raw !== "object") {
    return {
      isValid: false,
      message: "Registration payload must be a valid JSON object.",
      errors: { _general: "Invalid JSON object" },
    };
  }

  // 1. Full Name
  const fullName = typeof raw.fullName === "string" ? raw.fullName.trim() : "";
  if (!fullName || fullName.length < 2 || fullName.length > 100) {
    errors.fullName = "Full name must be between 2 and 100 characters.";
  }

  // 2. Email
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!email || !emailRegex.test(email) || email.length > 150) {
    errors.email = "Please enter a valid email address.";
  }

  // 3. Mobile Number (Indian 10-digit mobile number)
  let mobile = typeof raw.mobileNumber === "string" ? raw.mobileNumber.trim() : "";
  // Strip optional country prefix: +91 or leading 0
  mobile = mobile.replace(/^(\+91|0)/, "").replace(/[\s-]/g, "");
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile)) {
    errors.mobileNumber = "Please enter a valid 10-digit Indian mobile number.";
  }

  // 4. Learner Category
  const category = raw.learnerCategory as MBBSLearnerCategoryType;
  if (!category || !VALID_LEARNER_CATEGORIES.includes(category)) {
    errors.learnerCategory = `Please select a valid learner category.`;
  }

  // 5. College / Institution
  const rawCollegeId =
    typeof raw.collegeId === "string" && raw.collegeId.trim()
      ? raw.collegeId.trim()
      : null;
  const rawInstitutionName =
    typeof raw.institutionName === "string" ? raw.institutionName.trim() : "";

  if (!rawCollegeId && (!rawInstitutionName || rawInstitutionName.length < 2)) {
    errors.institutionName =
      "Please select a medical college or provide your institution name.";
  }

  // 6. Location fields
  const state = typeof raw.state === "string" ? raw.state.trim() : "";
  if (!state || state.length < 2 || state.length > 100) {
    errors.state = "State is required.";
  }

  const district = typeof raw.district === "string" ? raw.district.trim() : "";
  if (!district || district.length < 2 || district.length > 100) {
    errors.district = "District is required.";
  }

  const city = typeof raw.city === "string" ? raw.city.trim() : "";
  if (!city || city.length < 2 || city.length > 100) {
    errors.city = "City is required.";
  }

  const pinCode = typeof raw.pinCode === "string" ? raw.pinCode.trim() : "";
  if (!pinCode || !/^\d{6}$/.test(pinCode)) {
    errors.pinCode = "Please enter a valid 6-digit PIN code.";
  }

  // 7. Academic / Clinical optional fields
  const mbbsYear =
    typeof raw.mbbsYear === "string" && raw.mbbsYear.trim()
      ? raw.mbbsYear.trim().slice(0, 50)
      : null;

  const departmentDesignation =
    typeof raw.departmentDesignation === "string" && raw.departmentDesignation.trim()
      ? raw.departmentDesignation.trim().slice(0, 100)
      : null;

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
      message: "Please correct the highlighted registration fields.",
    };
  }

  return {
    isValid: true,
    data: {
      fullName,
      displayEmail: email,
      normalizedEmail: normalizeEmail(email),
      mobileNumber: mobile,
      learnerCategory: category,
      collegeId: rawCollegeId,
      institutionName: rawInstitutionName,
      state,
      district,
      city,
      pinCode,
      mbbsYear,
      departmentDesignation,
    },
  };
}

/**
 * Registers a new learner profile atomically in one database transaction.
 *
 * Guarantees:
 * 1. Verification ticket redemption and profile creation succeed or fail together.
 * 2. If registration fails (e.g. invalid college or mobile conflict), transaction rolls back
 *    and the ticket is NOT permanently consumed.
 * 3. Existing User accounts (coordinators, admins) have roles and passwords preserved.
 * 4. Duplicate profiles for the same email or conflicting mobile numbers are safely rejected.
 */
export async function executeLearnerRegistration(params: {
  input: SanitizedRegistrationInput;
  ticketJwt: string;
}): Promise<{
  user: { id: string; fullName: string; email: string | null };
  profile: any;
}> {
  const { input, ticketJwt } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Redeem registration ticket inside transaction
    const redeemResult = await redeemRegistrationTicket(
      ticketJwt,
      input.normalizedEmail,
      tx
    );

    if (!redeemResult.success) {
      if (redeemResult.error === "TICKET_EXPIRED") {
        throw new RegistrationError(
          "TICKET_EXPIRED",
          "Your verification ticket has expired. Please verify your email again.",
          400
        );
      }
      if (redeemResult.error === "TICKET_ALREADY_REDEEMED") {
        throw new RegistrationError(
          "TICKET_ALREADY_REDEEMED",
          "This verification ticket has already been used.",
          400
        );
      }
      if (redeemResult.error === "EMAIL_MISMATCH") {
        throw new RegistrationError(
          "EMAIL_MISMATCH",
          "The email submitted does not match the verified ticket.",
          400
        );
      }
      throw new RegistrationError(
        "INVALID_TICKET",
        "Invalid registration ticket. Please verify your email again.",
        400
      );
    }

    // 2. Validate and protect existing User record
    const userCheck = await validateAndProtectExistingUser({
      normalizedEmail: input.normalizedEmail,
      submittedMobile: input.mobileNumber,
      tx,
    });

    if (!userCheck.canProceed) {
      if (userCheck.error === "ACCOUNT_INACTIVE") {
        throw new RegistrationError(
          "ACCOUNT_INACTIVE",
          userCheck.safeMessage || "This account cannot be accessed. Please contact support.",
          403
        );
      }
      throw new RegistrationError(
        userCheck.error || "CONTACT_CONFLICT",
        userCheck.safeMessage || "The contact details provided cannot be linked.",
        409
      );
    }

    // 3. Ensure no MBBSLearningProfile already exists for this email
    const existingProfile = await tx.mBBSLearningProfile.findUnique({
      where: { normalizedEmail: input.normalizedEmail },
      select: { id: true },
    });

    if (existingProfile) {
      throw new RegistrationError(
        "PROFILE_ALREADY_EXISTS",
        "A learner profile already exists for this email address.",
        409
      );
    }

    // 4. Resolve or create User entity
    let user = userCheck.existingUser;
    if (!user) {
      user = await tx.user.create({
        data: {
          fullName: input.fullName,
          email: input.normalizedEmail,
          mobileNumber: input.mobileNumber,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });
    } else {
      // Existing user (e.g. coordinator):
      // Update emailVerifiedAt if not set, but NEVER touch roles, password, or permissions
      if (!user.emailVerifiedAt) {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      }
    }

    // 5. College resolution
    let verifiedCollegeId: string | null = null;
    let finalInstitutionName = input.institutionName;

    if (input.collegeId) {
      const college = await tx.college.findUnique({
        where: { id: input.collegeId },
        select: { id: true, collegeName: true, isActive: true },
      });

      if (!college || !college.isActive) {
        throw new RegistrationError(
          "INVALID_COLLEGE",
          "The selected medical college is invalid or inactive.",
          400
        );
      }

      verifiedCollegeId = college.id;
      finalInstitutionName = college.collegeName;
    }

    // 6. Persist MBBSLearningProfile
    const profile = await tx.mBBSLearningProfile.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        email: input.displayEmail,
        normalizedEmail: input.normalizedEmail,
        mobileNumber: input.mobileNumber,
        learnerCategory: input.learnerCategory,
        collegeId: verifiedCollegeId,
        institutionName: finalInstitutionName,
        city: input.city,
        state: input.state,
        district: input.district,
        pinCode: input.pinCode,
        mbbsYear: input.mbbsYear,
        departmentDesignation: input.departmentDesignation,
      },
      include: {
        college: {
          select: { id: true, collegeName: true, state: true, city: true },
        },
      },
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      profile,
    };
  });
}
