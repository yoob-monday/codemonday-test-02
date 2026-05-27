import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/register"]);
const AUTH_COOKIE_NAME = "lantern-library-token";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAuthToken = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (!hasAuthToken && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);

    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (hasAuthToken && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
