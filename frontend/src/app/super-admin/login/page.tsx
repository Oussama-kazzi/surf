"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth(); // Import logout to clear unauthorized sessions

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.role === "super_admin") {
        router.push("/super-admin");
      } else {
        // Log them out and show error so they aren't stuck logged in but denied
        logout();
        setError("Access denied. Super Admin only.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full p-8 bg-white shadow rounded-lg text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Super Admin Login</h1>
          <p className="text-gray-500 mt-1 text-sm">Platform administration access</p>
        </div>

        {error && <div className="alert-error bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="label block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="input w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="input w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? "Signing in..." : "Sign In to Platform"}
          </button>
        </form>
      </div>
    </div>
  );
}
