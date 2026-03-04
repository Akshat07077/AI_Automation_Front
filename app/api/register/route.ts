import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Check if user is authenticated as admin
  const isAdmin = request.cookies.get("dashboard_auth")?.value === "1";
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin authentication required." },
      { status: 403 }
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Register user via backend API
    const registerRes = await fetch(`${apiBaseUrl}/register-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!registerRes.ok) {
      const errorData = await registerRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Registration failed" },
        { status: registerRes.status }
      );
    }

    const data = await registerRes.json();
    return NextResponse.json({
      ok: true,
      message: data.message || `User "${username}" registered successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// GET endpoint to list registered users (admin only)
export async function GET(request: NextRequest) {
  const isAdmin = request.cookies.get("dashboard_auth")?.value === "1";
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin authentication required." },
      { status: 403 }
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const usersRes = await fetch(`${apiBaseUrl}/users`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!usersRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: usersRes.status }
      );
    }

    const data = await usersRes.json();
    return NextResponse.json({
      users: data.users || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
