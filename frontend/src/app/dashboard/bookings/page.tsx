// ================================
// BOOKINGS PAGE
// Shows all bookings for the company.
// Admin/Manager can update booking status.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { bookingApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Booking } from "@/types";

export default function BookingsPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // Filter by status

  // Load bookings
  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    try {
      setLoading(true);
      const params = filter !== "all" ? `status=${filter}` : "";
      const data = await bookingApi.getAll(params);
      setBookings(data.bookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  // Update booking status (only admin/manager)
  async function updateStatus(bookingId: string, newStatus: string) {
    try {
      await bookingApi.updateStatus(bookingId, newStatus);
      // Reload bookings to show the change
      loadBookings();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">Manage and track all reservations</p>
        </div>

        {/* Status Filter */}
        <select
          className="input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse-dot"></div>
          <span className="loading-text">Loading bookings...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p className="empty-state-text">No bookings found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Customer</th>
                <th className="table-header">Room</th>
                <th className="table-header">Check-in</th>
                <th className="table-header">Check-out</th>
                <th className="table-header">Nights</th>
                <th className="table-header">Status</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Total</th>
                {(user?.role === "admin" || user?.role === "manager") && (
                  <th className="table-header">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const customer = booking.customerId as any;
                const room = booking.roomId as any;

                return (
                  <tr key={booking._id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-800">
                          {customer?.firstName} {customer?.lastName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {customer?.email}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{room?.name || "—"}</td>
                    <td className="table-cell text-gray-500">{formatDate(booking.checkIn)}</td>
                    <td className="table-cell text-gray-500">{formatDate(booking.checkOut)}</td>
                    <td className="table-cell text-gray-500">{booking.numberOfNights}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(booking.status)}`}>
                        {capitalize(booking.status)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${getStatusColor(booking.paymentStatus)}`}
                      >
                        {capitalize(booking.paymentStatus)}
                      </span>
                    </td>
                    <td className="table-cell font-semibold">
                      {formatPrice(booking.totalPrice)}
                    </td>
                    {(user?.role === "admin" || user?.role === "manager") && (
                      <td className="table-cell">
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300"
                          value={booking.status}
                          onChange={(e) =>
                            updateStatus(booking._id, e.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    )}
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
