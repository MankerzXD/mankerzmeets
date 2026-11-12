import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "mankerz-meet-ultra-secure-secret-key-32chars-long-xyz"
);

const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL || "sanchezmanuel397@gmail.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("mankerz_session")?.value;

  let session: { userId: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      session = {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string,
      };
    } catch {
      session = null;
    }
  }

  // 1. Protected Admin route
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/admin");
      return NextResponse.redirect(loginUrl);
    }

    if (session.email.trim().toLowerCase() !== SUPERADMIN_EMAIL.trim().toLowerCase()) {
      // Forbidden: redirect to regular dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 2. Protected Tenant Dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. If authenticated user visits /login, redirect to their home
  if (pathname === "/login" && session) {
    if (session.email.trim().toLowerCase() === SUPERADMIN_EMAIL.trim().toLowerCase()) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};

