import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
    [email, password_hash, name]
  );

  // Create default settings row
  await pool.query(
    "INSERT INTO user_settings (user_id) VALUES ($1)",
    [result.rows[0].id]
  );

  return NextResponse.json({ ok: true });
}
