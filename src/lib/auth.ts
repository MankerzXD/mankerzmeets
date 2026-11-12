import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { randomInt } from "node:crypto";
import { prisma } from "./prisma";

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

async function sendOtpEmailWithResend(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY no está configurada. Configurala en las variables de entorno para enviar códigos OTP reales."
    );
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Mankerz Meet <onboarding@resend.dev>";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: `${code} es tu código de acceso a Mankerz Meet`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #fafafa; padding: 40px 20px;">
        <div style="max-width: 420px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 32px; text-align: center;">
          <div style="width: 36px; height: 36px; background-color: #ffffff; color: #09090b; border-radius: 8px; font-weight: 700; font-size: 16px; line-height: 36px; margin: 0 auto 16px;">M</div>
          <h1 style="font-size: 18px; font-weight: 600; margin: 0 0 8px; color: #ffffff;">Código de verificación</h1>
          <p style="font-size: 13px; color: #a1a1aa; margin: 0 0 24px;">Ingresá este código de 6 dígitos para acceder a tu cuenta en Mankerz Meet.</p>
          <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #ffffff; margin-bottom: 24px;">
            ${code}
          </div>
          <p style="font-size: 11px; color: #71717a; margin: 0;">Este código expira en 10 minutos. Si no solicitaste este acceso, podés ignorar este correo.</p>
        </div>
      </div>
    `,
    text: `Tu código de acceso a Mankerz Meet es: ${code}. Expira en 10 minutos.`,
  });

  if (error) {
    throw new Error(`Error al enviar email con Resend: ${error.message}`);
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
    await sendOtpEmailWithResend(cleanEmail, code);
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
