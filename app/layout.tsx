import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "AI Outreach Dashboard",
  description: "Track outreach progress and insights",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="min-h-screen">
          {/* Header with Navigation */}
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
                </nav>
              </div>
            </div>
          </header>
          
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
