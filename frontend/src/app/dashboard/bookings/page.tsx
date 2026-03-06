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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>

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
        <p className="text-gray-500">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-gray-500">No bookings found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Room</th>
                <th className="pb-3 font-medium">Check-in</th>
                <th className="pb-3 font-medium">Check-out</th>
                <th className="pb-3 font-medium">Nights</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Payment</th>
                <th className="pb-3 font-medium">Total</th>
                {(user?.role === "admin" || user?.role === "manager") && (
                  <th className="pb-3 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const customer = booking.customerId as any;
                const room = booking.roomId as any;

                return (
                  <tr key={booking._id} className="border-b last:border-0">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">
                          {customer?.firstName} {customer?.lastName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {customer?.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">{room?.name || "—"}</td>
                    <td className="py-3">{formatDate(booking.checkIn)}</td>
                    <td className="py-3">{formatDate(booking.checkOut)}</td>
                    <td className="py-3">{booking.numberOfNights}</td>
                    <td className="py-3">
                      <span className={`badge ${getStatusColor(booking.status)}`}>
                        {capitalize(booking.status)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`badge ${getStatusColor(booking.paymentStatus)}`}
                      >
                        {capitalize(booking.paymentStatus)}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {formatPrice(booking.totalPrice)}
                    </td>
                    {(user?.role === "admin" || user?.role === "manager") && (
                      <td className="py-3">
                        <select
                          className="text-xs border rounded px-2 py-1"
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
