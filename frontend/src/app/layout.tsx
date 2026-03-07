// ================================
// ROOT LAYOUT
// This layout wraps the entire app.
// It provides the AuthProvider so all pages can access auth state.
// ================================

import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurfBook — Surf Camp Booking System",
  description: "Modern booking platform built for surf camps and ocean lifestyle businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans">
        {/* AuthProvider gives all pages access to login state */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
