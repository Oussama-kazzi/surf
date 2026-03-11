// Dashboard Overview Page

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  bookingApi,
  customerApi,
  roomApi,
  paymentApi,
  adminApi,
  activityApi,
} from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Booking, Analytics, Room } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

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
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!user) return;
    if (isSuperAdmin) {
      loadAdminData();
    } else {
      loadCompanyData();
    }
  }, [user, isSuperAdmin]);

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

      const totalRevenue = paymentsData.payments
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const pendingBookings = bookingsData.bookings.filter(
        (b: any) => b.status === "pending"
      ).length;

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
      setRecentBookings(bookingsData.bookings.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

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
      <div className="py-12">
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  // Super Admin View
  if (isSuperAdmin && analytics) {
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

  // Company Dashboard View
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back — here&apos;s your overview
          </p>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Bookings", value: stats.totalBookings },
          {
            label: "Pending",
            value: stats.pendingBookings,
            color: "text-amber-600",
          },
          { label: "Customers", value: stats.totalCustomers },
          {
            label: "Revenue",
            value: formatPrice(stats.totalRevenue),
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

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Occupancy
          </p>
          <p
            className={`text-2xl font-bold mt-1.5 ${
              stats.occupancyRate > 80
                ? "text-green-600"
                : stats.occupancyRate > 50
                ? "text-amber-600"
                : "text-red-500"
            }`}
          >
            {stats.occupancyRate}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            of {stats.totalRooms} rooms today
          </p>
        </div>
        {[
          { label: "Rooms", value: stats.totalRooms },
          { label: "Activities", value: stats.totalActivities },
          { label: "With Activities", value: stats.activityBookings },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-1.5 text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Arrivals */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming Arrivals
            </h2>
            <span className="badge bg-gray-100 text-gray-600">Next 7 days</span>
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
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {customer?.firstName} {customer?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {room?.name || "—"} &middot; {booking.numberOfGuests}{" "}
                        guest
                        {booking.numberOfGuests !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {formatDate(booking.checkIn)}
                      </p>
                      <span
                        className={`badge text-[10px] ${getStatusColor(
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

        {/* Recent Bookings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Recent Bookings
          </h2>

          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header pb-3">Customer</th>
                    <th className="table-header pb-3">Room</th>
                    <th className="table-header pb-3">Check-in</th>
                    <th className="table-header pb-3">Status</th>
                    <th className="table-header pb-3 text-right">Total</th>
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
                        <td className="table-cell text-gray-500">
                          {room?.name || "—"}
                        </td>
                        <td className="table-cell text-gray-500">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`badge ${getStatusColor(booking.status)}`}
                          >
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
