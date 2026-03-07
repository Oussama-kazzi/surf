// ================================
// SUPER ADMIN — COMPANIES PAGE
// Shows all surf companies on the platform.
// Super admin can view details, toggle company status,
// and see subscription information.
// ================================

"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, getStatusColor, capitalize } from "@/lib/helpers";
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

  // Activate or suspend a company's subscription
  async function updateSubscription(
    companyId: string,
    status: string
  ) {
    try {
      await adminApi.updateSubscription(companyId, { status });
      loadCompanies();
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Companies</h1>
          <p className="page-subtitle">Manage all registered surf companies</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse-dot"></div>
          <span className="loading-text">Loading companies...</span>
        </div>
      ) : companies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <p className="empty-state-text">No companies registered yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="table-cell font-medium">Company</th>
                <th className="table-cell font-medium">Owner</th>
                <th className="table-cell font-medium">Plan</th>
                <th className="table-cell font-medium">Sub. Status</th>
                <th className="table-cell font-medium">Active</th>
                <th className="table-cell font-medium">Created</th>
                <th className="table-cell font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const owner = company.ownerId as any;

                return (
                  <tr key={company._id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-800">{company.name}</p>
                        <p className="text-gray-400 text-xs">/{company.slug}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-gray-700">{owner?.firstName} {owner?.lastName}</span>
                      <br />
                      <span className="text-gray-400 text-xs">
                        {owner?.email}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge bg-blue-50 text-blue-700 capitalize">
                        {company.subscription?.plan || "none"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${getStatusColor(
                          company.subscription?.status || "inactive"
                        )}`}
                      >
                        {capitalize(company.subscription?.status || "none")}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${getStatusColor(
                          company.isActive ? "active" : "inactive"
                        )}`}
                      >
                        {company.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => toggleCompany(company._id)}
                          className={`text-xs font-medium transition-colors ${
                            company.isActive
                              ? "text-red-500 hover:text-red-700"
                              : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {company.isActive ? "Deactivate" : "Activate"}
                        </button>

                        {company.subscription?.status === "expired" && (
                          <button
                            onClick={() =>
                              updateSubscription(company._id, "active")
                            }
                            className="text-xs font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
                          >
                            Reactivate Sub.
                          </button>
                        )}
                        {(company.subscription?.status === "active" ||
                          company.subscription?.status === "trial") && (
                          <button
                            onClick={() =>
                              updateSubscription(company._id, "expired")
                            }
                            className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            Suspend Sub.
                          </button>
                        )}
                      </div>
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
