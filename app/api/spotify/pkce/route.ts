import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

// Generate PKCE code verifier + S256 challenge server-side
// (crypto.subtle isn't available in non-secure browser contexts)
export async function GET() {
  const verifier = randomBytes(32)
    .toString("base64url")
    .slice(0, 64);

  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return NextResponse.json({ verifier, challenge });
}
