import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes only for program staff (not portal client accounts). */
function isStaffOnlyPath(pathname: string) {
  const staffPrefixes = [
    "/dashboard",
    "/clients",
    "/calendar",
    "/reports",
    "/admin",
    "/fields",
    "/profile",
    "/services",
  ];
  return staffPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Pass through in demo mode (Supabase not configured)
  if (!url || !key) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let profileRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profileRole = profile?.role ?? null;
  }

  const isClientRole = profileRole === "client";

  if (user && isClientRole && isStaffOnlyPath(pathname)) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (user && !isClientRole && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && pathname === "/login") {
    const dest = isClientRole ? "/portal" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (user && pathname === "/signup") {
    const dest = isClientRole ? "/portal" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
