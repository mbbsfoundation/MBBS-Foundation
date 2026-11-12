import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export const LEARNER_SESSION_COOKIE = "mbbs_learner_session";
export const LEARNER_VERIFIED_TICKET_COOKIE = "mbbs_verified_ticket";

// Hardened Token & Session Configurations
const VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const VERIFIED_TICKET_TTL_MS = 15 * 60 * 1000; // 15 minutes
const VERIFIED_TICKET_TTL_SECONDS = 15 * 60; // 15 minutes
const LEARNER_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// Multi-instance persistent throttling
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_EMAIL_REQUESTS_PER_WINDOW = 3; // Max 3 requests per 15 min per email
const MAX_IP_REQUESTS_PER_WINDOW = 10; // Max 10 requests per 15 min per IP

const TOKEN_ISSUER = "mbbs-foundation";
const TOKEN_AUDIENCE = "mbbs-foundation-learner";

export type LearnerSessionPayload = {
  userId: string;
  email: string;
  normalizedEmail: string;
  profileId: string | null;
  role: "MBBS_LEARNER";
  purpose: "learner_session";
};

export type VerifiedTicketPayload = {
  ticketId: string;
  normalizedEmail: string;
  displayEmail: string;
  verifiedAt: number;
  purpose: "learner_registration_ticket";
};

/**
 * Retrieves and validates the dedicated secret for MBBS learner authentication.
 * Strict security requirement:
 * - Fallback to SESSION_SECRET is forbidden.
 * - Missing or weak secrets (< 32 characters) are rejected immediately.
 * - Never prints or logs the secret.
 */
function getLearnerAuthSecret(): Uint8Array {
  const secret = process.env.MBBS_LEARNER_AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "SECURITY ERROR: MBBS_LEARNER_AUTH_SECRET is missing. Dedicated secret is required."
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "SECURITY ERROR: MBBS_LEARNER_AUTH_SECRET is too weak. Minimum 32 characters (256-bit entropy) required."
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Normalizes email address for canonical uniqueness comparison.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Computes a deterministic SHA-256 hex digest of a raw token.
 * Only the digest is stored in the database, never the plaintext token.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generates a cryptographically secure random token string (256-bit entropy).
 */
export function generateSecureRandomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Keyed HMAC IP hashing for privacy-preserving throttling metadata.
 * Uses MBBS_LEARNER_AUTH_SECRET as salt to prevent unsalted rainbow-table reversal.
 */
export function hashClientIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return crypto
    .createHmac("sha256", getLearnerAuthSecret())
    .update(ip.trim())
    .digest("hex")
    .slice(0, 32);
}

/**
 * Multi-instance persistent throttling check against database state.
 * Works consistently across serverless Vercel function instances.
 * Enforces both per-email and per-IP thresholds.
 */
export async function checkVerificationRateLimit(params: {
  normalizedEmail: string;
  ipHash?: string | null;
  client?: Prisma.TransactionClient | typeof prisma;
}): Promise<{
  allowed: boolean;
  remainingRequests: number;
  retryAfterSeconds?: number;
  reason?: "EMAIL_LIMIT" | "IP_LIMIT";
}> {
  const db = params.client || prisma;
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  // 1. Check per-email rate limit
  const emailCount = await db.mBBSLearnerVerificationToken.count({
    where: {
      normalizedEmail: params.normalizedEmail,
      createdAt: { gte: windowStart },
    },
  });

  if (emailCount >= MAX_EMAIL_REQUESTS_PER_WINDOW) {
    const oldestInWindow = await db.mBBSLearnerVerificationToken.findFirst({
      where: {
        normalizedEmail: params.normalizedEmail,
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const resetTime = oldestInWindow
      ? oldestInWindow.createdAt.getTime() + RATE_LIMIT_WINDOW_MS
      : Date.now() + RATE_LIMIT_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds,
      reason: "EMAIL_LIMIT",
    };
  }

  // 2. Check per-IP rate limit (if IP is present)
  if (params.ipHash) {
    const ipCount = await db.mBBSLearnerVerificationToken.count({
      where: {
        ipHash: params.ipHash,
        createdAt: { gte: windowStart },
      },
    });

    if (ipCount >= MAX_IP_REQUESTS_PER_WINDOW) {
      const oldestIpToken = await db.mBBSLearnerVerificationToken.findFirst({
        where: {
          ipHash: params.ipHash,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });

      const resetTime = oldestIpToken
        ? oldestIpToken.createdAt.getTime() + RATE_LIMIT_WINDOW_MS
        : Date.now() + RATE_LIMIT_WINDOW_MS;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

      return {
        allowed: false,
        remainingRequests: 0,
        retryAfterSeconds,
        reason: "IP_LIMIT",
      };
    }
  }

  return {
    allowed: true,
    remainingRequests: MAX_EMAIL_REQUESTS_PER_WINDOW - emailCount,
  };
}

/**
 * Converts a string and namespace into a deterministic 64-bit signed BigInt for PostgreSQL advisory locks.
 */
export function stringToAdvisoryLockKey(str: string, namespace: number = 0): bigint {
  const hash = crypto.createHash("sha256").update(`${namespace}:${str}`).digest();
  return hash.readBigInt64BE(0);
}

/**
 * Creates and persists a hashed verification token for a given email within an atomic transaction.
 * Applies multi-instance rate limiting and invalidates prior unconsumed tokens atomically.
 * Uses PostgreSQL transaction advisory locks to guarantee strict concurrency serialization.
 */
export async function createLearnerVerificationRecord(params: {
  email: string;
  ipAddress?: string | null;
}): Promise<{
  success: boolean;
  rawToken?: string;
  expiresAt?: Date;
  normalizedEmail?: string;
  error?: "RATE_LIMITED";
  reason?: "EMAIL_LIMIT" | "IP_LIMIT";
  retryAfterSeconds?: number;
}> {
  const normalizedEmail = normalizeEmail(params.email);
  const displayEmail = params.email.trim();
  const ipHash = hashClientIp(params.ipAddress);

  const rawToken = generateSecureRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  // Execute rate-check, invalidation, and creation within an isolated transaction
  // with PostgreSQL advisory locks to eliminate all concurrency race conditions
  const result = await prisma.$transaction(async (tx) => {
    // 1. Acquire deterministic advisory locks for email and IP
    const emailLockKey = stringToAdvisoryLockKey(normalizedEmail, 1);
    const locksToAcquire: bigint[] = [emailLockKey];

    if (ipHash) {
      const ipLockKey = stringToAdvisoryLockKey(ipHash, 2);
      locksToAcquire.push(ipLockKey);
    }

    // Sort deterministically to prevent any deadlock possibility
    locksToAcquire.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    for (const lockKey of locksToAcquire) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey});`;
    }

    // 2. Perform accurate rate limit check with lock held
    const rateLimit = await checkVerificationRateLimit({
      normalizedEmail,
      ipHash,
      client: tx,
    });

    if (!rateLimit.allowed) {
      return {
        success: false as const,
        error: "RATE_LIMITED" as const,
        reason: rateLimit.reason,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      };
    }

    // 3. Invalidate any existing unconsumed tokens for this email to prevent accumulation
    await tx.mBBSLearnerVerificationToken.updateMany({
      where: {
        normalizedEmail,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    // Store only the hash, never the raw token
    await tx.mBBSLearnerVerificationToken.create({
      data: {
        tokenHash,
        normalizedEmail,
        displayEmail,
        expiresAt,
        ipHash,
      },
    });

    return {
      success: true as const,
      rawToken,
      expiresAt,
      normalizedEmail,
    };
  });

  return result;
}

/**
 * Atomically consumes a verification token and transitions into a persistent one-time ticket.
 * Enforces atomic transition to eliminate race conditions.
 */
export async function consumeLearnerVerificationToken(
  rawToken: string
): Promise<{
  success: boolean;
  ticketJwt?: string;
  normalizedEmail?: string;
  displayEmail?: string;
  error?: "INVALID_TOKEN" | "TOKEN_EXPIRED" | "TOKEN_ALREADY_CONSUMED";
}> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
    return { success: false, error: "INVALID_TOKEN" };
  }

  const tokenHash = hashToken(rawToken.trim());
  const now = new Date();

  // Find token record by hash
  const record = await prisma.mBBSLearnerVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record) {
    return { success: false, error: "INVALID_TOKEN" };
  }

  if (record.consumedAt !== null) {
    return { success: false, error: "TOKEN_ALREADY_CONSUMED" };
  }

  if (record.expiresAt < now) {
    return { success: false, error: "TOKEN_EXPIRED" };
  }

  // Generate persistent one-time ticket credentials
  const rawTicketId = generateSecureRandomToken();
  const ticketHash = hashToken(rawTicketId);
  const ticketExpiresAt = new Date(Date.now() + VERIFIED_TICKET_TTL_MS);

  // Atomically consume token and assign ticket credentials in a single conditional update
  const updateResult = await prisma.mBBSLearnerVerificationToken.updateMany({
    where: {
      id: record.id,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      consumedAt: now,
      ticketHash,
      ticketExpiresAt,
      ticketConsumedAt: null,
    },
  });

  if (updateResult.count === 0) {
    return { success: false, error: "TOKEN_ALREADY_CONSUMED" };
  }

  // Issue signed one-time registration ticket JWT
  const issuedAt = Math.floor(Date.now() / 1000);
  const ticketJwt = await new SignJWT({
    ticketId: rawTicketId,
    normalizedEmail: record.normalizedEmail,
    displayEmail: record.displayEmail || record.normalizedEmail,
    verifiedAt: issuedAt,
    purpose: "learner_registration_ticket",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + VERIFIED_TICKET_TTL_SECONDS)
    .sign(getLearnerAuthSecret());

  return {
    success: true,
    ticketJwt,
    normalizedEmail: record.normalizedEmail,
    displayEmail: record.displayEmail || record.normalizedEmail,
  };
}

/**
 * Validates and atomically redeems a one-time verification ticket.
 * 
 * Supports Prisma.TransactionClient to participate in atomic database transactions:
 * - If called inside a registration transaction, a failed registration will roll back
 *   the entire transaction, ensuring the ticket is NOT burned on registration validation errors.
 */
export async function redeemRegistrationTicket(
  ticketJwt: string,
  expectedEmail: string,
  tx?: Prisma.TransactionClient
): Promise<{
  success: boolean;
  normalizedEmail?: string;
  displayEmail?: string;
  error?: "INVALID_TICKET" | "TICKET_EXPIRED" | "TICKET_ALREADY_REDEEMED" | "EMAIL_MISMATCH";
}> {
  try {
    const { payload } = await jwtVerify(ticketJwt, getLearnerAuthSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    // Enforce mutual exclusivity: reject session tokens
    if (
      payload.purpose !== "learner_registration_ticket" ||
      typeof payload.ticketId !== "string" ||
      typeof payload.normalizedEmail !== "string"
    ) {
      return { success: false, error: "INVALID_TICKET" };
    }

    // Identity binding: ensure ticket cannot claim a different email
    const expectedNormalized = normalizeEmail(expectedEmail);
    if (payload.normalizedEmail !== expectedNormalized) {
      return { success: false, error: "EMAIL_MISMATCH" };
    }

    const ticketHash = hashToken(payload.ticketId);
    const now = new Date();
    const db = tx || prisma;

    // Atomically consume ticket in database
    const updateResult = await db.mBBSLearnerVerificationToken.updateMany({
      where: {
        ticketHash,
        ticketConsumedAt: null,
        ticketExpiresAt: { gt: now },
        normalizedEmail: expectedNormalized,
      },
      data: {
        ticketConsumedAt: now,
      },
    });

    if (updateResult.count === 0) {
      // Check whether it was already redeemed or expired
      const existing = await db.mBBSLearnerVerificationToken.findUnique({
        where: { ticketHash },
        select: { ticketConsumedAt: true, ticketExpiresAt: true },
      });

      if (existing?.ticketConsumedAt) {
        return { success: false, error: "TICKET_ALREADY_REDEEMED" };
      }
      return { success: false, error: "TICKET_EXPIRED" };
    }

    return {
      success: true,
      normalizedEmail: payload.normalizedEmail,
      displayEmail: (payload.displayEmail as string) || payload.normalizedEmail,
    };
  } catch {
    return { success: false, error: "INVALID_TICKET" };
  }
}

/**
 * Issues a persistent learner session JWT token (30-day validity).
 * Explicitly carries purpose: "learner_session" and role: "MBBS_LEARNER".
 */
export async function createLearnerSessionToken(
  payload: Omit<LearnerSessionPayload, "purpose" | "role">
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    normalizedEmail: payload.normalizedEmail,
    profileId: payload.profileId,
    role: "MBBS_LEARNER",
    purpose: "learner_session",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + LEARNER_SESSION_TTL_SECONDS)
    .setSubject(payload.userId)
    .sign(getLearnerAuthSecret());
}

/**
 * Validates a learner session token.
 * Enforces mutual exclusivity: rejects verification tickets and enforces purpose: "learner_session".
 */
export async function verifyLearnerSessionToken(
  token: string
): Promise<LearnerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getLearnerAuthSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    // Mutual exclusivity: reject verification tickets
    if (
      payload.purpose !== "learner_session" ||
      payload.role !== "MBBS_LEARNER" ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.normalizedEmail !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      normalizedEmail: payload.normalizedEmail,
      profileId: (payload.profileId as string) || null,
      role: "MBBS_LEARNER",
      purpose: "learner_session",
    };
  } catch {
    return null;
  }
}

/**
 * Validates and protects existing User records during learner registration:
 * 1. Rejects inactive User accounts.
 * 2. Checks mobile number uniqueness against other accounts and returns safe, non-disclosing error.
 * 3. Guarantees existing coordinator/admin roles, names, and passwordHash are preserved.
 */
export async function validateAndProtectExistingUser(params: {
  normalizedEmail: string;
  submittedMobile: string;
  tx?: Prisma.TransactionClient;
}): Promise<{
  canProceed: boolean;
  existingUser?: any;
  error?: "ACCOUNT_INACTIVE" | "CONTACT_CONFLICT";
  safeMessage?: string;
}> {
  const db = params.tx || prisma;

  // Check if a User already exists with this email
  const existingUserByEmail = await db.user.findUnique({
    where: { email: params.normalizedEmail },
    include: {
      roleAssignments: true,
      learningProfile: true,
    },
  });

  if (existingUserByEmail) {
    if (!existingUserByEmail.isActive) {
      return {
        canProceed: false,
        error: "ACCOUNT_INACTIVE",
        safeMessage: "This account cannot be accessed. Please contact support.",
      };
    }

    // Check if the submitted mobile number is registered to a different User account
    const conflictingUser = await db.user.findFirst({
      where: {
        mobileNumber: params.submittedMobile,
        id: { not: existingUserByEmail.id },
      },
      select: { id: true },
    });

    if (conflictingUser) {
      return {
        canProceed: false,
        error: "CONTACT_CONFLICT",
        safeMessage:
          "The contact details provided cannot be linked. Please verify your information or contact support.",
      };
    }

    return {
      canProceed: true,
      existingUser: existingUserByEmail,
    };
  }

  // User does not exist by email: check if submitted mobile number is already taken
  const mobileTaken = await db.user.findUnique({
    where: { mobileNumber: params.submittedMobile },
    select: { id: true },
  });

  if (mobileTaken) {
    return {
      canProceed: false,
      error: "CONTACT_CONFLICT",
      safeMessage:
        "The contact details provided cannot be linked. Please verify your information or contact support.",
    };
  }

  return { canProceed: true };
}

/**
 * Cookie options for the persistent learner session.
 */
export function getLearnerSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: LEARNER_SESSION_TTL_SECONDS,
  };
}

/**
 * Cookie options for the temporary registration ticket.
 */
export function getVerifiedTicketCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VERIFIED_TICKET_TTL_SECONDS,
  };
}
