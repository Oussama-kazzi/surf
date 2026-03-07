// ================================
// SESSIONS PAGE (Dashboard)
// Manage time slots for activities.
// Admin/Manager can create, edit, and delete sessions.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { sessionApi, activityApi } from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import { Session, Activity } from "@/types";

export default function SessionsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Filters
  const [filterActivity, setFilterActivity] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Form state
  const [form, setForm] = useState({
    activityId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    capacity: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sessData, actData] = await Promise.all([
        sessionApi.getMine(),
        activityApi.getAll(),
      ]);
      setSessions(sessData.sessions);
      setActivities(actData.activities.filter((a: Activity) => a.isActive));
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      const params = new URLSearchParams();
      if (filterActivity) params.set("activityId", filterActivity);
      if (filterDate) params.set("startDate", filterDate);
      const data = await sessionApi.getMine(params.toString() || undefined);
      setSessions(data.sessions);
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  }

  // Reload when filters change
  useEffect(() => {
    if (!loading) loadSessions();
  }, [filterActivity, filterDate]);

  function resetForm() {
    setForm({
      activityId: activities[0]?._id || "",
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      capacity: 10,
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(session: Session) {
    const activityId =
      typeof session.activityId === "string"
        ? session.activityId
        : session.activityId._id;

    setForm({
      activityId,
      date: session.date.split("T")[0],
      startTime: session.startTime,
      endTime: session.endTime,
      capacity: session.capacity,
    });
    setEditingId(session._id);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit() {
    if (!form.activityId || !form.date || !form.startTime || !form.endTime) {
      setError("All fields are required.");
      return;
    }

    try {
      if (editingId) {
        await sessionApi.update(editingId, {
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          capacity: form.capacity,
        });
      } else {
        await sessionApi.create(form);
      }

      resetForm();
      loadSessions();
    } catch (err: any) {
      setError(err.message || "Failed to save session.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return;

    try {
      await sessionApi.delete(id);
      loadSessions();
    } catch (err: any) {
      console.error("Error deleting session:", err);
    }
  }

  function getActivityName(session: Session): string {
    if (typeof session.activityId === "object" && session.activityId?.name) {
      return session.activityId.name;
    }
    const act = activities.find((a) => a._id === session.activityId);
    return act?.name || "Unknown";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-gray-500">
            Schedule time slots for your activities.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setForm((f) => ({ ...f, activityId: activities[0]?._id || "" }));
              setShowForm(true);
            }}
            className="btn-primary"
          >
            + New Session
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity
            </label>
            <select
              className="input"
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
            >
              <option value="">All Activities</option>
              {activities.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          {(filterActivity || filterDate) && (
            <button
              onClick={() => {
                setFilterActivity("");
                setFilterDate("");
              }}
              className="text-sm text-ocean-600 hover:underline pb-2"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && canManage && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Session" : "New Session"}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity *
                </label>
                <select
                  className="input"
                  value={form.activityId}
                  onChange={(e) =>
                    setForm({ ...form, activityId: e.target.value })
                  }
                >
                  <option value="">Select Activity</option>
                  {activities.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                className="input"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                className="input"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
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
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleSubmit} className="btn-primary">
              {editingId ? "Update Session" : "Create Session"}
            </button>
            <button onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <p className="text-gray-500">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-gray-500">
            No sessions scheduled. Create your first one!
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Activity</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Capacity</th>
                <th className="pb-3 font-medium">Booked</th>
                {canManage && (
                  <th className="pb-3 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const spotsLeft = session.capacity - session.bookedCount;
                const isFull = spotsLeft <= 0;

                return (
                  <tr
                    key={session._id}
                    className="border-b last:border-0"
                  >
                    <td className="py-3 font-medium">
                      {getActivityName(session)}
                    </td>
                    <td className="py-3">
                      {formatDate(session.date)}
                    </td>
                    <td className="py-3">
                      {session.startTime} – {session.endTime}
                    </td>
                    <td className="py-3">{session.capacity}</td>
                    <td className="py-3">
                      <span
                        className={`badge ${
                          isFull
                            ? "bg-red-100 text-red-800"
                            : spotsLeft <= 2
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {session.bookedCount}/{session.capacity}
                        {isFull ? " (Full)" : ""}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(session)}
                            className="text-sm text-ocean-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(session._id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
