import { NextRequest, NextResponse } from "next/server";

// Spotify OAuth callback — redirects back to settings with the auth code
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/settings?spotify_error=" + error, request.url));
  }

  if (code) {
    return NextResponse.redirect(new URL("/settings?spotify_code=" + code, request.url));
  }

  return NextResponse.redirect(new URL("/settings", request.url));
}
