// ================================
// ROOT LAYOUT
// This layout wraps the entire app.
// It provides the AuthProvider so all pages can access auth state.
// ================================

import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurfBook - Surf Company Booking System",
  description: "SaaS booking system for surf companies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* AuthProvider gives all pages access to login state */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
