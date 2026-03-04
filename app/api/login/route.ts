import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
    // Check registered users via backend API
    try {
      const verifyRes = await fetch(`${apiBaseUrl}/verify-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!verifyRes.ok) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      return NextResponse.json(
        { error: "Failed to verify credentials" },
        { status: 500 }
      );
    }
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("dashboard_auth", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}

