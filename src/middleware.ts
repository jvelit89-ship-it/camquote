import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/register", "/api/auth/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rutas públicas y archivos estáticos
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/branding")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protección de rutas Superadmin
  if (pathname.startsWith("/superadmin") && payload.role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirigir a Superadmin si tratan de usar la app normal
  if (!pathname.startsWith("/superadmin") && !pathname.startsWith("/api") && payload.role === "superadmin" && !pathname.startsWith("/api/auth/logout")) {
    return NextResponse.redirect(new URL("/superadmin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
