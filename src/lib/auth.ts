import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { prisma } from "./prisma";
import { sendOtpEmail } from "./emails";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production.");
  }
  return new TextEncoder().encode(
    secret || "mankerz-meet-dev-fallback-secret-change-in-prod-32c"
  );
}

export const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL || "sanchezmanuel397@gmail.com";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mankerz_session")?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function isSuperAdmin(email: string): boolean {
  return email.trim().toLowerCase() === SUPERADMIN_EMAIL.trim().toLowerCase();
}

export class OtpRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OtpRateLimitError";
  }
}

export async function generateAndSendOtp(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  // Cooldown check: 45 seconds between OTP requests for the same email
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      email: cleanEmail,
      createdAt: {
        gt: new Date(Date.now() - 45 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    throw new OtpRateLimitError(
      "Por favor esperá 45 segundos antes de solicitar un nuevo código."
    );
  }

  // Cryptographically random 6-digit OTP
  const code = randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate previous unused OTPs for this email
  await prisma.otpCode.updateMany({
    where: { email: cleanEmail, used: false },
    data: { used: true },
  });

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  const otpRecord = await prisma.otpCode.create({
    data: {
      email: cleanEmail,
      code,
      expiresAt,
      userId: user?.id,
    },
  });

  try {
    await sendOtpEmail(cleanEmail, code);
  } catch (err) {
    // Mark OTP as used if email delivery failed so it cannot linger
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });
    throw err;
  }
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{
  success: boolean;
  user?: { id: string; email: string; role: string; profile: unknown };
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      email: cleanEmail,
      code: cleanCode,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    return { success: false, error: "El código OTP es inválido o ha expirado." };
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  const role = isSuperAdmin(cleanEmail) ? "SUPERADMIN" : "USER";

  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { profile: true },
  });

  if (!user) {
    const baseSlug =
      cleanEmail
        .split("@")[0]
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .replace(/^-+|-+$/g, "") || "usuario";

    const reserved = new Set([
      "admin",
      "dashboard",
      "login",
      "api",
      "auth",
      "register",
    ]);
    const safePrefix = reserved.has(baseSlug) ? `${baseSlug}-perfil` : baseSlug;
    const uniqueSlug = `${safePrefix}-${randomInt(100, 999)}`;

    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        role,
        profile: {
          create: {
            slug: uniqueSlug,
            name: cleanEmail.split("@")[0],
            title: "Profesional",
            bio: "Reservá tu turno online de forma rápida.",
            whatsapp: "",
            template: "MINIMAL_DARK",
            status: "ACTIVE",
            slotDuration: 30,
            availabilities: {
              create: [
                { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },
                { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true },
                { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isActive: true },
                { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true },
                { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isActive: true },
              ],
            },
          },
        },
      },
      include: { profile: true },
    });
  } else if (isSuperAdmin(cleanEmail) && user.role !== "SUPERADMIN") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPERADMIN" },
      include: { profile: true },
    });
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
  };
}
