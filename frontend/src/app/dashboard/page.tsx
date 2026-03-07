// ================================
// DASHBOARD OVERVIEW PAGE
// Shows key metrics and recent activity.
// For super admin: platform analytics
// For company users: company stats
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { bookingApi, customerApi, roomApi, paymentApi, adminApi, activityApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Booking, Analytics, Activity, Room } from "@/types";

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
    occupancyRate: 0,
    totalActivities: 0,
    activityBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [upcomingArrivals, setUpcomingArrivals] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // State for super admin dashboard
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Load data when the page loads or when user changes
  useEffect(() => {
    if (!user) return;

    if (isSuperAdmin) {
      setStats({ totalBookings: 0, pendingBookings: 0, totalCustomers: 0, totalRooms: 0, totalRevenue: 0, occupancyRate: 0, totalActivities: 0, activityBookings: 0 });
      loadAdminData();
    } else {
      setAnalytics(null);
      loadCompanyData();
    }
  }, [user, isSuperAdmin]);

  // Load company dashboard data
  async function loadCompanyData() {
    try {
      const [bookingsData, customersData, roomsData, paymentsData, activitiesData] =
        await Promise.all([
          bookingApi.getAll(),
          customerApi.getAll(),
          roomApi.getAll(),
          paymentApi.getAll(),
          activityApi.getAll(),
        ]);

      // Calculate stats
      const totalRevenue = paymentsData.payments
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const pendingBookings = bookingsData.bookings.filter(
        (b: any) => b.status === "pending"
      ).length;

      // Occupancy rate: check bookings occupying rooms today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeRooms = roomsData.rooms.filter((r: Room) => r.isActive);
      const occupiedToday = bookingsData.bookings.filter((b: Booking) => {
        if (b.status === "cancelled") return false;
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return checkIn <= today && checkOut > today;
      }).length;
      const occupancyRate =
        activeRooms.length > 0
          ? Math.round((occupiedToday / activeRooms.length) * 100)
          : 0;

      // Activity stats
      const activityBookings = bookingsData.bookings.filter(
        (b: Booking) => b.activities && b.activities.length > 0
      ).length;

      setStats({
        totalBookings: bookingsData.bookings.length,
        pendingBookings,
        totalCustomers: customersData.customers.length,
        totalRooms: activeRooms.length,
        totalRevenue,
        occupancyRate,
        totalActivities: activitiesData.activities?.length || 0,
        activityBookings,
      });

      // Upcoming arrivals: bookings with check-in in the next 7 days
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 7);
      const arrivals = bookingsData.bookings
        .filter((b: Booking) => {
          if (b.status === "cancelled") return false;
          const checkIn = new Date(b.checkIn);
          checkIn.setHours(0, 0, 0, 0);
          return checkIn >= today && checkIn <= next7;
        })
        .sort(
          (a: Booking, b: Booking) =>
            new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
        )
        .slice(0, 10);
      setUpcomingArrivals(arrivals);

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
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse-dot"></div>
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  // ================================
  // SUPER ADMIN VIEW
  // ================================
  if (isSuperAdmin && analytics) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Platform Analytics</h1>
            <p className="page-subtitle">Overview of all companies and revenue</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Companies</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{analytics.totalCompanies}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{analytics.totalBookings}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customers</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{analytics.totalCustomers}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Booking Revenue</p>
            <p className="text-3xl font-bold mt-2 text-emerald-600">
              {formatPrice(analytics.totalRevenue)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Subs</p>
            <p className="text-3xl font-bold mt-2 text-ocean-600">
              {analytics.activeSubscriptions}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Sub. Revenue</p>
            <p className="text-3xl font-bold mt-2 text-purple-600">
              {formatPrice(analytics.totalSubscriptionRevenue)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Month Subs</p>
            <p className="text-3xl font-bold mt-2 text-indigo-600">
              {formatPrice(analytics.monthlySubscriptionRevenue)}
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here&apos;s your overview</p>
        </div>
      </div>

      {/* Stats Cards - Row 1: Core metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bookings</p>
            <span className="text-lg opacity-60">📅</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.totalBookings}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</p>
            <span className="text-lg opacity-60">⏳</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-amber-500">{stats.pendingBookings}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customers</p>
            <span className="text-lg opacity-60">👥</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.totalCustomers}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</p>
            <span className="text-lg opacity-60">💰</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-emerald-600">
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Occupancy</p>
            <span className="text-lg opacity-60">🏠</span>
          </div>
          <p
            className={`text-3xl font-bold mt-2 ${
              stats.occupancyRate > 80
                ? "text-emerald-600"
                : stats.occupancyRate > 50
                ? "text-amber-500"
                : "text-red-500"
            }`}
          >
            {stats.occupancyRate}%
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            of {stats.totalRooms} rooms · today
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rooms</p>
            <span className="text-lg opacity-60">🛏️</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.totalRooms}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activities</p>
            <span className="text-lg opacity-60">🏄</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-ocean-600">{stats.totalActivities}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">w/ Activities</p>
            <span className="text-lg opacity-60">✨</span>
          </div>
          <p className="text-3xl font-bold mt-2 text-purple-600">{stats.activityBookings}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Arrivals */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-section-title text-gray-900">Upcoming Arrivals</h2>
            <span className="badge bg-ocean-50 text-ocean-700">Next 7 days</span>
          </div>

          {upcomingArrivals.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No upcoming arrivals.</p>
          ) : (
            <div className="space-y-2">
              {upcomingArrivals.map((booking) => {
                const customer = booking.customerId as any;
                const room = booking.roomId as any;
                return (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-sand-50 hover:bg-sand-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-700 flex items-center justify-center text-xs font-bold">
                        {customer?.firstName?.charAt(0)}{customer?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-800">
                          {customer?.firstName} {customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {room?.name || "—"} · {booking.numberOfGuests} guest
                          {booking.numberOfGuests !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ocean-700">
                        {formatDate(booking.checkIn)}
                      </p>
                      <span
                        className={`badge text-[10px] ${getStatusColor(booking.status)}`}
                      >
                        {capitalize(booking.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Bookings Table */}
        <div className="card">
          <h2 className="text-section-title text-gray-900 mb-5">Recent Bookings</h2>

          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header px-6 pb-3">Customer</th>
                    <th className="table-header px-6 pb-3">Room</th>
                    <th className="table-header px-6 pb-3">Check-in</th>
                    <th className="table-header px-6 pb-3">Status</th>
                    <th className="table-header px-6 pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => {
                    const customer = booking.customerId as any;
                    const room = booking.roomId as any;

                    return (
                      <tr key={booking._id} className="table-row">
                        <td className="table-cell font-medium">
                          {customer?.firstName} {customer?.lastName}
                        </td>
                        <td className="table-cell text-gray-500">{room?.name || "—"}</td>
                        <td className="table-cell text-gray-500">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusColor(booking.status)}`}>
                            {capitalize(booking.status)}
                          </span>
                        </td>
                        <td className="table-cell text-right font-semibold">
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
    </div>
  );
}
