// ================================
// DASHBOARD OVERVIEW PAGE
// Shows key metrics and recent activity.
// For super admin: platform analytics
// For company users: company stats
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { bookingApi, customerApi, roomApi, paymentApi, adminApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Booking, Analytics } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  // State for company dashboard
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalCustomers: 0,
    totalRooms: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // State for super admin dashboard
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Load data when the page loads
  useEffect(() => {
    if (isSuperAdmin) {
      loadAdminData();
    } else {
      loadCompanyData();
    }
  }, [isSuperAdmin]);

  // Load company dashboard data
  async function loadCompanyData() {
    try {
      const [bookingsData, customersData, roomsData, paymentsData] =
        await Promise.all([
          bookingApi.getAll(),
          customerApi.getAll(),
          roomApi.getAll(),
          paymentApi.getAll(),
        ]);

      // Calculate stats
      const totalRevenue = paymentsData.payments
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const pendingBookings = bookingsData.bookings.filter(
        (b: any) => b.status === "pending"
      ).length;

      setStats({
        totalBookings: bookingsData.bookings.length,
        pendingBookings,
        totalCustomers: customersData.customers.length,
        totalRooms: roomsData.rooms.length,
        totalRevenue,
      });

      // Get the 5 most recent bookings
      setRecentBookings(bookingsData.bookings.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load super admin data
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

  if (loading) {
    return <p className="text-gray-500">Loading dashboard...</p>;
  }

  // ================================
  // SUPER ADMIN VIEW
  // ================================
  if (isSuperAdmin && analytics) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Platform Analytics</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-gray-500 text-sm">Total Companies</p>
            <p className="text-3xl font-bold mt-1">{analytics.totalCompanies}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-3xl font-bold mt-1">{analytics.totalBookings}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Total Customers</p>
            <p className="text-3xl font-bold mt-1">{analytics.totalCustomers}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {formatPrice(analytics.totalRevenue)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================================
  // COMPANY DASHBOARD VIEW
  // ================================
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-gray-500 text-sm">Total Bookings</p>
          <p className="text-3xl font-bold mt-1">{stats.totalBookings}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">
            {stats.pendingBookings}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Customers</p>
          <p className="text-3xl font-bold mt-1">{stats.totalCustomers}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Revenue</p>
          <p className="text-3xl font-bold mt-1 text-green-600">
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>

        {recentBookings.length === 0 ? (
          <p className="text-gray-500">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Room</th>
                  <th className="pb-3 font-medium">Check-in</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  // The populated fields come as objects
                  const customer = booking.customerId as any;
                  const room = booking.roomId as any;

                  return (
                    <tr key={booking._id} className="border-b last:border-0">
                      <td className="py-3">
                        {customer?.firstName} {customer?.lastName}
                      </td>
                      <td className="py-3">{room?.name || "—"}</td>
                      <td className="py-3">
                        {formatDate(booking.checkIn)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge ${getStatusColor(booking.status)}`}
                        >
                          {capitalize(booking.status)}
                        </span>
                      </td>
                      <td className="py-3 font-medium">
                        {formatPrice(booking.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
