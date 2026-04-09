import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserSettings, updateUserSettings } from "@/lib/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getUserSettings(session.user.id);
  if (!settings) {
    return NextResponse.json(null);
  }
  // Strip sensitive fields — never send secrets to the client
  const { llm_api_key, spotify_access_token, spotify_refresh_token, ...safe } = settings;
  return NextResponse.json({
    ...safe,
    has_llm_key: !!llm_api_key,
    has_system_key: !!process.env.OPENAI_API_KEY,
    spotify_connected: settings.spotify_connected,
    // Spotify access token is needed client-side for Web Playback SDK
    spotify_access_token: spotify_access_token,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const updated = await updateUserSettings(session.user.id, body);
  // Strip sensitive fields from response
  const { llm_api_key: _k, spotify_refresh_token: _r, ...safe } = updated;
  return NextResponse.json({
    ...safe,
    has_llm_key: !!_k,
    has_system_key: !!process.env.OPENAI_API_KEY,
  });
}
