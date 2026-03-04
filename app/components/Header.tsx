"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">AI Outreach</h1>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <Link href="/" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100">
              Dashboard
            </Link>
            <Link href="/follow-ups" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100">
              Follow-Ups
            </Link>
            <Link href="/activity" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100">
              Activity
            </Link>
            <Link href="/register" className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100">
              Register
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
