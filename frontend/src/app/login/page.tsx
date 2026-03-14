// ================================
// LOGIN PAGE
// Users (company owners, team members, super admin) log in here.
// ================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth(); // Import logout to clear unauthorized sessions

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Prevent page refresh
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      // Security Check: Is this a super admin trying to use the company login?
      if (loggedInUser.role === "super_admin") {
        logout(); // Log them out immediately
        setError("Access denied. Please use the Super Admin login portal.");
      } else {
        // Success! Send company members to the dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Log in to SurfBook
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Welcome back. Enter your credentials.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-gray-900 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
