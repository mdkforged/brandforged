/**
 * Entry routing rules (pure, no imports so node --test can load it).
 * Decisions use only the signed-in session and the kit flag - never geo,
 * IP, locale or request headers - so a VPN behaves exactly the same.
 */

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";
export const START_PATH = "/start";

/** Paths a guest may load without being sent to /login. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    return true;
  }
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/")
  ) {
    return true;
  }
  // Static files from /public (logo, icons, manifest, sounds).
  return /\/[^/]+\.[a-z0-9]{2,8}$/i.test(pathname);
}

export function isStartPath(pathname: string): boolean {
  return pathname === START_PATH || pathname.startsWith(`${START_PATH}/`);
}

/** Where to send a guest: /login, keeping a deep link (never / or /start). */
export function loginPathFor(pathname: string, search = ""): string {
  if (pathname === HOME_PATH || isStartPath(pathname)) return LOGIN_PATH;
  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    return LOGIN_PATH;
  }
  const query = search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : "";
  return `${LOGIN_PATH}?next=${encodeURIComponent(`${pathname}${query}`)}`;
}

/** Only same-site paths; anything odd (or /login itself) falls back to home. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return HOME_PATH;
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return HOME_PATH;
  }
  const path = next.split(/[?#]/)[0];
  if (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`)) return HOME_PATH;
  return next;
}

/**
 * After sign-in: no kit -> setup (/start). Kit (or unknown, e.g. the profile
 * check failed) -> where she was headed, but never the setup questions.
 */
export function destinationAfterSignIn(input: {
  hasKit: boolean | null;
  next?: string | null;
}): string {
  if (input.hasKit === false) return START_PATH;
  const next = safeNextPath(input.next);
  const [path, query = ""] = next.split("?");
  if (isStartPath(path) && !/(^|&)edit=1(&|$)/.test(query)) return HOME_PATH;
  return next;
}
