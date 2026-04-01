import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isApi = req.nextUrl.pathname.startsWith("/api");
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth") || req.nextUrl.pathname.startsWith("/api/register");

  if (isAuthPage || isAuthApi) {
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (isApi && !isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
