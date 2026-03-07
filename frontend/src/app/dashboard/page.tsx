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
    return <p className="text-gray-500">Loading dashboard...</p>;
  }

  // ================================
  // SUPER ADMIN VIEW
  // ================================
  if (isSuperAdmin && analytics) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Platform Analytics</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
            <p className="text-gray-500 text-sm">Booking Revenue</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {formatPrice(analytics.totalRevenue)}
            </p>
          </div>
          {/* Subscription revenue from real payments */}
          <div className="card">
            <p className="text-gray-500 text-sm">Active Subscriptions</p>
            <p className="text-3xl font-bold mt-1 text-ocean-600">
              {analytics.activeSubscriptions}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Total Sub. Revenue</p>
            <p className="text-3xl font-bold mt-1 text-purple-600">
              {formatPrice(analytics.totalSubscriptionRevenue)}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">This Month Sub. Revenue</p>
            <p className="text-3xl font-bold mt-1 text-indigo-600">
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards - Row 1: Core metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

      {/* Stats Cards - Row 2: Occupancy & Activities */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-gray-500 text-sm">Today&apos;s Occupancy</p>
          <p
            className={`text-3xl font-bold mt-1 ${
              stats.occupancyRate > 80
                ? "text-green-600"
                : stats.occupancyRate > 50
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {stats.occupancyRate}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            of {stats.totalRooms} rooms
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Rooms</p>
          <p className="text-3xl font-bold mt-1">{stats.totalRooms}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Activities</p>
          <p className="text-3xl font-bold mt-1 text-ocean-600">
            {stats.totalActivities}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Bookings w/ Activities</p>
          <p className="text-3xl font-bold mt-1 text-purple-600">
            {stats.activityBookings}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Arrivals */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            🛬 Upcoming Arrivals{" "}
            <span className="text-sm font-normal text-gray-400">
              (next 7 days)
            </span>
          </h2>

          {upcomingArrivals.length === 0 ? (
            <p className="text-gray-500">No upcoming arrivals.</p>
          ) : (
            <div className="space-y-3">
              {upcomingArrivals.map((booking) => {
                const customer = booking.customerId as any;
                const room = booking.roomId as any;
                return (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {customer?.firstName} {customer?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {room?.name || "—"} · {booking.numberOfGuests} guest
                        {booking.numberOfGuests !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ocean-700">
                        {formatDate(booking.checkIn)}
                      </p>
                      <span
                        className={`badge text-xs ${getStatusColor(
                          booking.status
                        )}`}
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
                      <tr
                        key={booking._id}
                        className="border-b last:border-0"
                      >
                        <td className="py-3">
                          {customer?.firstName} {customer?.lastName}
                        </td>
                        <td className="py-3">{room?.name || "—"}</td>
                        <td className="py-3">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`badge ${getStatusColor(
                              booking.status
                            )}`}
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
    </div>
  );
}
