import { NextRequest, NextResponse } from "next/server";

// Spotify OAuth callback — redirects back to settings with the auth code and state
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/settings?spotify_error=" + encodeURIComponent(error), request.url));
  }

  if (code && state) {
    const params = new URLSearchParams({ spotify_code: code, spotify_state: state });
    return NextResponse.redirect(new URL(`/settings?${params}`, request.url));
  }

  return NextResponse.redirect(new URL("/settings", request.url));
}
