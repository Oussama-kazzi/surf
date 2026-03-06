// ================================
// SETTINGS PAGE (Dashboard)
// Company settings — update company info.
// Only admin can access this page.
// ================================

"use client";

import { useState, useEffect } from "react";
import { companyApi } from "@/lib/api";
import { Company } from "@/types";

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form state — we'll populate this when company data loads
  const [form, setForm] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    website: "",
  });

  // Load company data
  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await companyApi.getMine();
        setCompany(data.company);

        // Populate the form with existing data
        setForm({
          name: data.company.name,
          description: data.company.description,
          email: data.company.email,
          phone: data.company.phone,
          address: data.company.address,
          city: data.company.city,
          country: data.company.country,
          website: data.company.website,
        });
      } catch (error) {
        console.error("Error loading company:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, []);

  // Save settings
  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      await companyApi.updateMine(form);
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading settings...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Company Settings</h1>

      {/* Success/Error message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg mb-4 text-sm ${
            message.includes("success")
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      <div className="card">
        {/* Booking URL */}
        {company && (
          <div className="mb-6 p-4 bg-ocean-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Your booking page URL:
            </p>
            <p className="font-mono text-ocean-700 font-medium">
              {typeof window !== "undefined" ? window.location.origin : ""}/book/
              {company.slug}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Share this link with your customers so they can make bookings.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              className="input"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              className="input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              className="input"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary mt-6 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
