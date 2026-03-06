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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Payments (Platform)</h1>
          <p className="text-gray-500">
            Platform Revenue:{" "}
            <span className="font-bold text-green-600">
              {formatPrice(totalRevenue)}
            </span>
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const company = payment.companyId as any;
                const customer = payment.customerId as any;

                return (
                  <tr key={payment._id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      {company?.name || "—"}
                    </td>
                    <td className="py-3">
                      {customer?.firstName} {customer?.lastName}
                    </td>
                    <td className="py-3 font-medium">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="py-3 capitalize">
                      {payment.method.replace("_", " ")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`badge ${getStatusColor(payment.status)}`}
                      >
                        {capitalize(payment.status)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
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
