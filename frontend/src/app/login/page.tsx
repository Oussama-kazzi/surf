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
  const { login } = useAuth();

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

      // Redirect based on role
      if (loggedInUser.role === "super_admin") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-50 to-white px-4">
      <div className="card max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🏄</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Log in to SurfBook
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Enter your credentials.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <Link href="/register" className="text-ocean-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
