// ================================
// SUPER ADMIN — COMPANIES PAGE
// Shows all surf companies on the platform.
// Super admin can view details and toggle company status.
// ================================

"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Company } from "@/types";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const data = await adminApi.getCompanies();
      setCompanies(data.companies);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCompany(companyId: string) {
    try {
      await adminApi.toggleCompany(companyId);
      loadCompanies();
    } catch (error) {
      console.error("Error toggling company:", error);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Companies</h1>

      {loading ? (
        <p className="text-gray-500">Loading companies...</p>
      ) : companies.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🏢</div>
          <p className="text-gray-500">No companies registered yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const owner = company.ownerId as any;

                return (
                  <tr key={company._id} className="border-b last:border-0">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-gray-400 text-xs">/{company.slug}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      {owner?.firstName} {owner?.lastName}
                      <br />
                      <span className="text-gray-400 text-xs">
                        {owner?.email}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="badge bg-blue-100 text-blue-800 capitalize">
                        {company.subscription.plan}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`badge ${getStatusColor(
                          company.isActive ? "active" : "inactive"
                        )}`}
                      >
                        {company.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleCompany(company._id)}
                        className={`text-xs ${
                          company.isActive
                            ? "text-red-600 hover:underline"
                            : "text-green-600 hover:underline"
                        }`}
                      >
                        {company.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
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
