// ================================
// PACKAGES PAGE (Dashboard)
// Manage surf packages for the company.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { packageApi } from "@/lib/api";
import { formatPrice } from "@/lib/helpers";
import { SurfPackage } from "@/types";

export default function PackagesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const [packages, setPackages] = useState<SurfPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SurfPackage | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationDays: 7,
    pricePerPerson: 0,
    includes: "",
    maxParticipants: 10,
    difficulty: "all-levels" as SurfPackage["difficulty"],
  });

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      const data = await packageApi.getAll();
      setPackages(data.packages);
    } catch (error) {
      console.error("Error loading packages:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingPackage(null);
    setForm({
      name: "",
      description: "",
      durationDays: 7,
      pricePerPerson: 0,
      includes: "",
      maxParticipants: 10,
      difficulty: "all-levels",
    });
    setShowForm(true);
  }

  function openEditForm(pkg: SurfPackage) {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description,
      durationDays: pkg.durationDays,
      pricePerPerson: pkg.pricePerPerson / 100, // cents to dollars
      includes: pkg.includes.join(", "),
      maxParticipants: pkg.maxParticipants,
      difficulty: pkg.difficulty,
    });
    setShowForm(true);
  }

  async function handleSave() {
    try {
      const pkgData = {
        name: form.name,
        description: form.description,
        durationDays: form.durationDays,
        pricePerPerson: Math.round(form.pricePerPerson * 100), // dollars to cents
        includes: form.includes
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        maxParticipants: form.maxParticipants,
        difficulty: form.difficulty,
      };

      if (editingPackage) {
        await packageApi.update(editingPackage._id, pkgData);
      } else {
        await packageApi.create(pkgData);
      }

      setShowForm(false);
      loadPackages();
    } catch (error) {
      console.error("Error saving package:", error);
    }
  }

  async function handleDelete(pkgId: string) {
    if (!confirm("Are you sure?")) return;
    try {
      await packageApi.delete(pkgId);
      loadPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Surf Packages</h1>
          <p className="page-subtitle">Create and manage your surf experiences</p>
        </div>
        {canEdit && (
          <button onClick={openCreateForm} className="btn-primary">
            + Add Package
          </button>
        )}
      </div>

      {/* Package Form */}
      {showForm && (
        <div className="form-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editingPackage ? "Edit Package" : "New Package"}
          </h2>

          <div className="form-grid">
            <div>
              <label className="label">Package Name</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Beginner Surf Week"
              />
            </div>

            <div>
              <label className="label">Difficulty</label>
              <select
                className="input"
                value={form.difficulty}
                onChange={(e) =>
                  setForm({
                    ...form,
                    difficulty: e.target.value as SurfPackage["difficulty"],
                  })
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all-levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="label">Duration (days)</label>
              <input
                type="number"
                className="input"
                value={form.durationDays}
                onChange={(e) =>
                  setForm({ ...form, durationDays: Number(e.target.value) })
                }
                min={1}
              />
            </div>

            <div>
              <label className="label">Price per Person ($)</label>
              <input
                type="number"
                className="input"
                value={form.pricePerPerson}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pricePerPerson: Number(e.target.value),
                  })
                }
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <label className="label">Max Participants</label>
              <input
                type="number"
                className="input"
                value={form.maxParticipants}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxParticipants: Number(e.target.value),
                  })
                }
                min={1}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">What&apos;s Included (comma-separated)</label>
              <input
                type="text"
                className="input"
                value={form.includes}
                onChange={(e) => setForm({ ...form, includes: e.target.value })}
                placeholder="e.g., Surf lessons, Board rental, Breakfast"
              />
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleSave} className="btn-primary">
              {editingPackage ? "Save Changes" : "Create Package"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Packages List */}
      {loading ? (
        <div className="py-12">
          <span className="loading-text">Loading packages...</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">
            No packages yet. Create your first surf package.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div key={pkg._id} className="card-hover group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{pkg.name}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {pkg.durationDays} days ·{" "}
                    <span className="capitalize">{pkg.difficulty}</span> ·
                    Max {pkg.maxParticipants} people
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(pkg.pricePerPerson)}
                  </p>
                  <p className="text-gray-400 text-xs">/person</p>
                </div>
              </div>

              <p className="text-gray-500 text-sm mt-3 line-clamp-2">{pkg.description}</p>

              {pkg.includes.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {pkg.includes.map((item) => (
                    <li
                      key={item}
                      className="text-sm text-gray-600 flex items-center gap-2"
                    >
                      <span className="text-emerald-500">✓</span> {item}
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openEditForm(pkg)}
                    className="text-sm font-medium text-gray-900 hover:text-gray-800 transition-colors"
                  >
                    Edit
                  </button>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
