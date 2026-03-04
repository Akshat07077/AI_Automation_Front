import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addUser, getUsers } from "../../lib/users";

export async function POST(request: NextRequest) {
  // Check if user is authenticated as admin
  const isAdmin = request.cookies.get("dashboard_auth")?.value === "1";
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin authentication required." },
      { status: 403 }
    );
  }

  // Verify admin password from environment
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Server auth is not configured" },
      { status: 500 }
    );
  }

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

    // Add the new user
    addUser(username, password);

    return NextResponse.json({
      ok: true,
      message: `User "${username}" registered successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    
    if (message.includes("already exists")) {
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

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

  const users = getUsers();
  
  // Return usernames only (no passwords)
  return NextResponse.json({
    users: users.map(u => ({
      username: u.username,
      createdAt: u.createdAt,
    })),
  });
}
