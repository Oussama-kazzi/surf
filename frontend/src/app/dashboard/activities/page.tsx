// ================================
// ACTIVITIES PAGE (Dashboard)
// Manage surf activities for the company.
// Admin/Manager can create, edit, and deactivate activities.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { activityApi } from "@/lib/api";
import { formatPrice } from "@/lib/helpers";
import { Activity } from "@/types";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 60,
    capacity: 10,
  });

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const data = await activityApi.getAll();
      setActivities(data.activities);
    } catch (err) {
      console.error("Error loading activities:", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", description: "", price: 0, duration: 60, capacity: 10 });
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(activity: Activity) {
    setForm({
      name: activity.name,
      description: activity.description,
      price: activity.price / 100, // cents → dollars for the form
      duration: activity.duration,
      capacity: activity.capacity,
    });
    setEditingId(activity._id);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError("Activity name is required.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Math.round(form.price * 100), // dollars → cents
        duration: form.duration,
        capacity: form.capacity,
      };

      if (editingId) {
        await activityApi.update(editingId, payload);
      } else {
        await activityApi.create(payload);
      }

      resetForm();
      loadActivities();
    } catch (err: any) {
      setError(err.message || "Failed to save activity.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this activity?")) return;

    try {
      await activityApi.delete(id);
      loadActivities();
    } catch (err: any) {
      console.error("Error deleting activity:", err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activities</h1>
          <p className="page-subtitle">Manage surf activities offered to your guests</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn-primary"
          >
            + New Activity
          </button>
        )}
      </div>

      {/* Error */}
      {error && <div className="alert-error">{error}</div>}

      {/* Create / Edit Form */}
      {showForm && canManage && (
        <div className="form-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editingId ? "Edit Activity" : "New Activity"}
          </h2>

          <div className="form-grid">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Surf Lesson"
              />
            </div>
            <div>
              <label className="label">Price ($)</label>
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input
                type="number"
                className="input"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: Number(e.target.value) })
                }
                min={15}
              />
            </div>
            <div>
              <label className="label">Default Capacity</label>
              <input
                type="number"
                className="input"
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) })
                }
                min={1}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe what this activity includes..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleSubmit} className="btn-primary">
              {editingId ? "Update Activity" : "Create Activity"}
            </button>
            <button onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activities List */}
      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
          <span className="loading-text">Loading activities...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No activities yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className={`card-hover group ${!activity.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{activity.name}</h3>
                  {!activity.isActive && (
                    <span className="badge bg-red-50 text-red-700 text-xs mt-1">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(activity.price)}
                </p>
              </div>

              <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                {activity.description || "No description."}
              </p>

              <div className="flex gap-4 text-sm text-gray-400 mb-4">
                <span>{activity.duration} min</span>
                <span>Max {activity.capacity}</span>
              </div>

              {canManage && (
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => startEdit(activity)}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Edit
                  </button>
                  {activity.isActive && (
                    <button
                      onClick={() => handleDelete(activity._id)}
                      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                      Deactivate
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
