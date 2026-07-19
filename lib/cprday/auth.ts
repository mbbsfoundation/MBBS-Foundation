import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export const COORDINATOR_SESSION_COOKIE = "cprday_coordinator_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export type CoordinatorSessionPayload = {
  userId: string;
  email: string;
  role: "COURSE_COORDINATOR";
};

function getSessionSecret(): Uint8Array {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error(
      "SESSION_SECRET is missing. Add it to the local .env file and Vercel environment variables.",
    );
  }

  return new TextEncoder().encode(sessionSecret);
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 10) {
    throw new Error("Password must contain at least 10 characters.");
  }

  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createCoordinatorSessionToken(
  payload: CoordinatorSessionPayload,
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_DURATION_SECONDS)
    .setSubject(payload.userId)
    .sign(getSessionSecret());
}

export async function verifyCoordinatorSessionToken(
  token: string,
): Promise<CoordinatorSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      payload.role !== "COURSE_COORDINATOR"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: "COURSE_COORDINATOR",
    };
  } catch {
    return null;
  }
}

export function getCoordinatorSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}