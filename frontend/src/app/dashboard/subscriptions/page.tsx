// ================================
// SUPER ADMIN — SUBSCRIPTIONS PAGE
// Shows all subscriptions across all companies.
// Lets the platform owner see:
// - Which companies are paying
// - Which subscriptions are active, expired, or on trial
// - Real revenue from subscription payments
//
// WHY THIS PAGE EXISTS:
// The super admin needs to track subscription revenue
// and manage company subscriptions.
// ================================

"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, getStatusColor, capitalize } from "@/lib/helpers";
import { Subscription, SubscriptionPayment } from "@/types";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "payments">("subscriptions");

  // Load all subscriptions and payments when the page opens
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [subsData, paymentsData] = await Promise.all([
        adminApi.getSubscriptions(),
        adminApi.getSubscriptionPayments(),
      ]);
      setSubscriptions(subsData.subscriptions);
      setPayments(paymentsData.payments);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate summary stats from the subscriptions data
  const activeCount = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trial"
  ).length;
  const expiredCount = subscriptions.filter(
    (s) => s.status === "expired"
  ).length;
  const canceledCount = subscriptions.filter(
    (s) => s.status === "canceled"
  ).length;

  // Total revenue = sum of all completed subscription payments
  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  // This month's revenue
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = payments
    .filter(
      (p) =>
        p.status === "completed" &&
        new Date(p.createdAt) >= startOfMonth
    )
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscriptions & Revenue</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card">
          <p className="text-gray-500 text-sm">Active / Trial</p>
          <p className="text-3xl font-bold mt-1 text-green-600">
            {activeCount}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Expired</p>
          <p className="text-3xl font-bold mt-1 text-red-600">
            {expiredCount}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Canceled</p>
          <p className="text-3xl font-bold mt-1 text-gray-600">
            {canceledCount}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Total Payments</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {payments.length}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1 text-purple-600">
            {formatPrice(totalRevenue)}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">This Month</p>
          <p className="text-3xl font-bold mt-1 text-indigo-600">
            {formatPrice(thisMonthRevenue)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "subscriptions"
              ? "bg-ocean-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "payments"
              ? "bg-ocean-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : activeTab === "subscriptions" ? (
        /* ================================
           SUBSCRIPTIONS TAB
           ================================ */
        subscriptions.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">💎</div>
            <p className="text-gray-500">No subscriptions yet.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Price/Month</th>
                  <th className="pb-3 font-medium">Started</th>
                  <th className="pb-3 font-medium">Next Billing</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const company = sub.companyId as any;

                  return (
                    <tr key={sub._id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">
                            {company?.name || "Unknown"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {company?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-blue-100 text-blue-800 capitalize">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge ${getStatusColor(sub.status)}`}
                        >
                          {capitalize(sub.status)}
                        </span>
                      </td>
                      <td className="py-3 font-medium">
                        {formatPrice(sub.pricePerMonth)}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="py-3">
                        <span
                          className={
                            sub.status === "expired"
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }
                        >
                          {formatDate(sub.nextBillingDate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ================================
           PAYMENT HISTORY TAB
           ================================ */
        payments.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">💳</div>
            <p className="text-gray-500">No subscription payments yet.</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const company = payment.companyId as any;

                  return (
                    <tr key={payment._id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">
                            {company?.name || "Unknown"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {company?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-blue-100 text-blue-800 capitalize">
                          {payment.plan}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge ${
                            payment.type === "new"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payment.type === "new" ? "New" : "Renewal"}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-green-600">
                        {formatPrice(payment.amount)}
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
        )
      )}
    </div>
  );
}
