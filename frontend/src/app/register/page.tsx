// ================================
// REGISTER PAGE
// New surf company owners register here.
// Creates both a user account AND a company.
// ================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Update form field
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(formData);

      // After registration, redirect to subscription page
      // so the new owner can see the plans and choose one
      router.push("/dashboard/subscription");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create your SurfBook Account
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Set up your surf company in minutes.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* Register form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                className="input"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                className="input"
                placeholder="Surfer"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              className="input"
              placeholder="Bali Surf Camp"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="input"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-900 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
