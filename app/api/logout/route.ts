import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  
  // Clear the auth cookie
  res.cookies.set("dashboard_auth", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return res;
}
