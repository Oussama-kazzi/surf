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

  async function handleAddMember() {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add Member
        </button>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                className="input"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                className="input"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
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
                Password
              </label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
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

          <div className="flex gap-3 mt-4">
            <button onClick={handleAddMember} className="btn-primary">
              Add Member
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

      {/* Team List */}
      {loading ? (
        <p className="text-gray-500">Loading team...</p>
      ) : members.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">👤</div>
          <p className="text-gray-500">No team members yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} className="border-b last:border-0">
                  <td className="py-3 font-medium">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="py-3 text-gray-600">{member.email}</td>
                  <td className="py-3">
                    {member.role === "admin" ? (
                      <span className="badge bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    ) : (
                      <select
                        className="text-xs border rounded px-2 py-1"
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
                  <td className="py-3">
                    <span
                      className={`badge ${getStatusColor(
                        member.isActive ? "active" : "inactive"
                      )}`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="py-3">
                    {member.role !== "admin" && (
                      <button
                        onClick={() => handleToggleActive(member._id)}
                        className={`text-xs ${
                          member.isActive
                            ? "text-red-600 hover:underline"
                            : "text-green-600 hover:underline"
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
