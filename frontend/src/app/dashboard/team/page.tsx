// ================================
// TEAM PAGE (Dashboard)
// Manage team members — add, change roles, activate/deactivate.
// Only admin can access this page.
// ================================

"use client";

import { useState, useEffect } from "react";
import { teamApi } from "@/lib/api";
import { formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { TeamMember } from "@/types";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formError, setFormError] = useState("");

  // New member form
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "staff" as "manager" | "staff",
  });

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      const data = await teamApi.getAll();
      setMembers(data.teamMembers);
    } catch (error) {
      console.error("Error loading team:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    // Client-side validation
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setFormError("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      await teamApi.add(form);
      setShowForm(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "staff",
      });
      loadTeam();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      await teamApi.updateRole(memberId, newRole);
      loadTeam();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  }

  async function handleToggleActive(memberId: string) {
    try {
      await teamApi.toggleActive(memberId);
      loadTeam();
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="page-subtitle">Manage roles and access for your team</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add Member
        </button>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <form onSubmit={handleAddMember} className="form-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Add Team Member</h2>

          {formError && <div className="alert-error">{formError}</div>}

          <div className="form-grid">
            <div>
              <label className="label">First Name</label>
              <input
                type="text"
                className="input"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                type="text"
                className="input"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as "manager" | "staff",
                  })
                }
              >
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Add Member
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Team List */}
      {loading ? (
        <div className="py-12">
          <span className="loading-text">Loading team...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No team members yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header">Joined</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} className="table-row">
                  <td className="table-cell font-medium text-gray-800">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="table-cell text-gray-500">{member.email}</td>
                  <td className="table-cell">
                    {member.role === "admin" ? (
                      <span className="badge bg-purple-50 text-purple-700">
                        Admin
                      </span>
                    ) : (
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member._id, e.target.value)
                        }
                      >
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    )}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-cell text-gray-400">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="table-cell">
                    {member.role !== "admin" && (
                      <button
                        onClick={() => handleToggleActive(member._id)}
                        className={`text-xs font-medium transition-colors ${
                          member.isActive
                            ? "text-red-500 hover:text-red-700"
                            : "text-emerald-600 hover:text-emerald-800"
                        }`}
                      >
                        {member.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
