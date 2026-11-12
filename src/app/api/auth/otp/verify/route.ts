import { NextResponse } from "next/server";
import { verifyOtp, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Correo electrónico y código son requeridos." },
        { status: 400 }
      );
    }

    const verification = await verifyOtp(email, code);

    if (!verification.success || !verification.user) {
      return NextResponse.json(
        { error: verification.error || "Código incorrecto o vencido." },
        { status: 401 }
      );
    }

    const { user } = verification;

    // Create session JWT token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const redirectUrl = user.role === "SUPERADMIN" ? "/admin" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: "Sesión iniciada con éxito",
      user,
      redirectUrl,
    });

    // Set cookie securely
    response.cookies.set({
      name: "mankerz_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al verificar el código." },
      { status: 500 }
    );
  }
}

