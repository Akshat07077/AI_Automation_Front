import { NextResponse } from "next/server";
import { validateUser } from "../../lib/users";

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "Server auth is not configured" },
      { status: 500 }
    );
  }

  const { username, password } = await request.json().catch(() => ({ username: "", password: "" }));

  // Check if it's admin login (no username or username is "admin")
  if (!username || username === "admin") {
    if (password !== adminPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  } else {
    // Check registered users
    if (!validateUser(username, password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("dashboard_auth", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}

