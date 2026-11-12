import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Sesión cerrada" });
  response.cookies.delete("mankerz_session");
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  response.cookies.delete("mankerz_session");
  return response;
}

