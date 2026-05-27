import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Let Next.js internals, static files, and api routes bypass redirects
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes("/static/") ||
    path.endsWith(".ico") ||
    path.endsWith(".svg") ||
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg")
  ) {
    return NextResponse.next();
  }

  // Paths
  const isLoginPage = path === "/login";
  const isOnboardingPage = path === "/onboarding";

  // Case 1: Not logged in
  if (!user) {
    const isProtectedRoute = [
      "/cart",
      "/orders",
      "/wallet",
      "/admin",
      "/payment",
      "/confirmation",
      "/onboarding",
    ].some((route) => path.startsWith(route));

    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Case 2: Logged in - check onboarding & role from metadata
  const userMetadata = user.user_metadata || {};
  const onboardingCompleted = userMetadata.onboarding_completed === true;
  const role = userMetadata.role || "student";

  // Prevent users from bypassing onboarding
  if (!onboardingCompleted) {
    if (!isOnboardingPage && !isLoginPage && path !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Onboarding completed: redirect from auth/onboarding back to home
  if (isOnboardingPage || isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role check: Protect /admin routes
  if (path.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
