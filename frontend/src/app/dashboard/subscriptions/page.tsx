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
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscriptions & Revenue</h1>
          <p className="page-subtitle">Platform subscription analytics</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Active / Trial</p>
          <p className="text-3xl font-bold mt-1 text-emerald-600">
            {activeCount}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Expired</p>
          <p className="text-3xl font-bold mt-1 text-red-500">
            {expiredCount}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Canceled</p>
          <p className="text-3xl font-bold mt-1 text-gray-500">
            {canceledCount}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Total Payments</p>
          <p className="text-3xl font-bold mt-1 text-ocean-600">
            {payments.length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1 text-purple-600">
            {formatPrice(totalRevenue)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">This Month</p>
          <p className="text-3xl font-bold mt-1 text-indigo-600">
            {formatPrice(thisMonthRevenue)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "subscriptions"
              ? "bg-ocean-600 text-white shadow-md"
              : "bg-white text-gray-500 hover:bg-sand-50 border border-gray-100"
          }`}
        >
          Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "payments"
              ? "bg-ocean-600 text-white shadow-md"
              : "bg-white text-gray-500 hover:bg-sand-50 border border-gray-100"
          }`}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse-dot"></div>
          <span className="loading-text">Loading...</span>
        </div>
      ) : activeTab === "subscriptions" ? (
        subscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💎</div>
            <p className="empty-state-text">No subscriptions yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="table-cell font-medium">Company</th>
                  <th className="table-cell font-medium">Plan</th>
                  <th className="table-cell font-medium">Status</th>
                  <th className="table-cell font-medium">Price/Month</th>
                  <th className="table-cell font-medium">Started</th>
                  <th className="table-cell font-medium">Next Billing</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const company = sub.companyId as any;

                  return (
                    <tr key={sub._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-800">
                            {company?.name || "Unknown"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {company?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge bg-blue-50 text-blue-700 capitalize">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${getStatusColor(sub.status)}`}
                        >
                          {capitalize(sub.status)}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-gray-800">
                        {formatPrice(sub.pricePerMonth)}
                      </td>
                      <td className="table-cell text-gray-500">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="table-cell">
                        <span
                          className={
                            sub.status === "expired"
                              ? "text-red-500 font-medium"
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
        payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <p className="empty-state-text">No subscription payments yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="table-cell font-medium">Company</th>
                  <th className="table-cell font-medium">Plan</th>
                  <th className="table-cell font-medium">Type</th>
                  <th className="table-cell font-medium">Amount</th>
                  <th className="table-cell font-medium">Status</th>
                  <th className="table-cell font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const company = payment.companyId as any;

                  return (
                    <tr key={payment._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-800">
                            {company?.name || "Unknown"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {company?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge bg-blue-50 text-blue-700 capitalize">
                          {payment.plan}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${
                            payment.type === "new"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {payment.type === "new" ? "New" : "Renewal"}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-emerald-600">
                        {formatPrice(payment.amount)}
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
        )
      )}
    </div>
  );
}
