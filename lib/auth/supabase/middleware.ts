import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabasePublicEnv,
  isAuthConfigured,
  isAuthRequired,
} from "@/lib/validation/env";
import {
  HOME_PATH,
  isPublicPath,
  isStartPath,
  loginPathFor,
} from "@/lib/auth/entry-routing";

const PROTECTED_PREFIXES = ["/app", "/settings", "/workspaces"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Redirect while keeping any refreshed Supabase cookies; never cached. */
function redirectKeepingCookies(
  request: NextRequest,
  target: string,
  from: NextResponse,
): NextResponse {
  const url = request.nextUrl.clone();
  const [path, query = ""] = target.split("?");
  url.pathname = path;
  url.search = query ? `?${query}` : "";
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isAuthConfigured()) {
    if (isAuthRequired() && isProtectedPath(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    getSupabasePublicEnv();

  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Entry routing uses only the session cookie - no geo, IP, locale or other
  // headers - so a VPN lands on the same page as everyone else.
  const { pathname } = request.nextUrl;

  if (!user) {
    // Guests always open on /login (never home, Get started or /start).
    if (!isPublicPath(pathname)) {
      const params = new URLSearchParams(request.nextUrl.search);
      params.delete("_rsc");
      const search = params.toString();
      return redirectKeepingCookies(
        request,
        loginPathFor(pathname, search ? `?${search}` : ""),
        supabaseResponse,
      );
    }
    return supabaseResponse;
  }

  // Signed in with a finished kit: the setup questions are not for her.
  // (Change answers uses /start?edit=1.) A kit saved only on this device is
  // checked on the client by StartGate.
  if (
    isStartPath(pathname) &&
    request.nextUrl.searchParams.get("edit") !== "1"
  ) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.onboarding_completed_at) {
        return redirectKeepingCookies(request, HOME_PATH, supabaseResponse);
      }
    } catch {
      /* fall through; StartGate still checks the local kit */
    }
  }

  return supabaseResponse;
}
