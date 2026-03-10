import "./globals.css";
import type { ReactNode } from "react";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "AI Outreach Dashboard",
  description: "Track outreach progress and insights",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
