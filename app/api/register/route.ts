import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const { ok } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15min
  if (!ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    // Generic message — don't reveal whether email exists
    return NextResponse.json({ error: "Unable to create account. Try a different email." }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
    [normalizedEmail, password_hash, name]
  );

  // Create default settings row
  await pool.query(
    "INSERT INTO user_settings (user_id) VALUES ($1)",
    [result.rows[0].id]
  );

  return NextResponse.json({ ok: true });
}
