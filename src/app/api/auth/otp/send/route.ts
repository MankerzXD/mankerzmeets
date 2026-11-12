import { NextResponse } from "next/server";
import { generateAndSendOtp, OtpRateLimitError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Por favor ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    await generateAndSendOtp(cleanEmail);

    return NextResponse.json({
      success: true,
      message: `Código de verificación enviado a ${cleanEmail}`,
    });
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al enviar el código de verificación.",
      },
      { status: 500 }
    );
  }
}
