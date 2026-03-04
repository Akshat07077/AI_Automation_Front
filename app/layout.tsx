import "./globals.css";
import type { ReactNode } from "react";
import Header from "./components/Header";

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
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
