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
                <th className="pb-3 font-medium">Sub. Status</th>
                <th className="pb-3 font-medium">Active</th>
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
                        {company.subscription?.plan || "none"}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`badge ${getStatusColor(
                          company.subscription?.status || "inactive"
                        )}`}
                      >
                        {capitalize(company.subscription?.status || "none")}
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
                      <div className="flex flex-col gap-1">
                        {/* Toggle company active/inactive */}
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

                        {/* Subscription actions */}
                        {company.subscription?.status === "expired" && (
                          <button
                            onClick={() =>
                              updateSubscription(company._id, "active")
                            }
                            className="text-xs text-blue-600 hover:underline"
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
                            className="text-xs text-orange-600 hover:underline"
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
