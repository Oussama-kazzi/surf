// ================================
// SUPER ADMIN — ALL PAYMENTS PAGE
// Shows all payments across all companies.
// ================================

"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Payment } from "@/types";

export default function AdminAllPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminApi.getPayments();
        setPayments(data.payments);
      } catch (error) {
        console.error("Error loading payments:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Total revenue across all companies
  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Payments (Platform)</h1>
          <p className="page-subtitle">
            Platform Revenue:{" "}
            <span className="font-bold text-emerald-600">
              {formatPrice(totalRevenue)}
            </span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
          <span className="loading-text">Loading payments...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="table-cell font-medium">Company</th>
                <th className="table-cell font-medium">Customer</th>
                <th className="table-cell font-medium">Amount</th>
                <th className="table-cell font-medium">Method</th>
                <th className="table-cell font-medium">Status</th>
                <th className="table-cell font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const company = payment.companyId as any;
                const customer = payment.customerId as any;

                return (
                  <tr key={payment._id} className="table-row">
                    <td className="table-cell font-medium text-gray-800">
                      {company?.name || "—"}
                    </td>
                    <td className="table-cell text-gray-700">
                      {customer?.firstName} {customer?.lastName}
                    </td>
                    <td className="table-cell font-medium text-emerald-600">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="table-cell capitalize text-gray-600">
                      {payment.method.replace("_", " ")}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${getStatusColor(payment.status)}`}
                      >
                        {capitalize(payment.status)}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatDate(payment.createdAt)}
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
