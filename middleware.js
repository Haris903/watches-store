import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// 🔒 STRICT AUTHORIZED ADMIN EMAIL
const ADMIN_EMAIL = "opff56266@gmail.com";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Sirf /admin wale tamam routes ko protect karein
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const userEmail = token?.email ? String(token.email).toLowerCase().trim() : "";
    const authorizedEmail = ADMIN_EMAIL.toLowerCase().trim();

    // Agar token na ho YA email match na kare, seedha home page par bhej dein
    if (!token || userEmail !== authorizedEmail) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};