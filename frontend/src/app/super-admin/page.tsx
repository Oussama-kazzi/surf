// Super Admin Overview Page

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/helpers";
import { Analytics } from "@/types";

export default function SuperAdminPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!user || !isSuperAdmin) return;
    loadAdminData();
  }, [user, isSuperAdmin]);

  async function loadAdminData() {
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !analytics) {
    return (
      <div className="py-12">
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-subtitle">Overview of all companies and revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { label: "Companies", value: analytics.totalCompanies },
          { label: "Total Bookings", value: analytics.totalBookings },
          { label: "Customers", value: analytics.totalCustomers },
          {
            label: "Booking Revenue",
            value: formatPrice(analytics.totalRevenue),
            color: "text-green-600",
          },
          {
            label: "Active Subscriptions",
            value: analytics.activeSubscriptions,
          },
          {
            label: "Subscription Revenue",
            value: formatPrice(analytics.totalSubscriptionRevenue),
            color: "text-green-600",
          },
          {
            label: "Monthly Sub Revenue",
            value: formatPrice(analytics.monthlySubscriptionRevenue),
            color: "text-green-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p
              className={`text-2xl font-bold mt-1.5 ${
                stat.color || "text-gray-900"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
