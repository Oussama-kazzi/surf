// ================================
// SUPER ADMIN — ALL BOOKINGS PAGE
// Shows all bookings across all companies.
// ================================

"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Booking } from "@/types";

export default function AdminAllBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    try {
      setLoading(true);
      const params = filter !== "all" ? `status=${filter}` : "";
      const data = await adminApi.getBookings(params);
      setBookings(data.bookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Bookings (Platform)</h1>
          <p className="page-subtitle">View bookings across all companies</p>
        </div>
        <select
          className="input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
          <span className="loading-text">Loading bookings...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No bookings found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="table-cell font-medium">Company</th>
                <th className="table-cell font-medium">Customer</th>
                <th className="table-cell font-medium">Room</th>
                <th className="table-cell font-medium">Check-in</th>
                <th className="table-cell font-medium">Status</th>
                <th className="table-cell font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const company = booking.companyId as any;
                const customer = booking.customerId as any;
                const room = booking.roomId as any;

                return (
                  <tr key={booking._id} className="table-row">
                    <td className="table-cell font-medium text-gray-800">
                      {company?.name || "—"}
                    </td>
                    <td className="table-cell text-gray-700">
                      {customer?.firstName} {customer?.lastName}
                    </td>
                    <td className="table-cell text-gray-600">{room?.name || "—"}</td>
                    <td className="table-cell text-gray-500">{formatDate(booking.checkIn)}</td>
                    <td className="table-cell">
                      <span
                        className={`badge ${getStatusColor(booking.status)}`}
                      >
                        {capitalize(booking.status)}
                      </span>
                    </td>
                    <td className="table-cell font-medium text-gray-800">
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
  );
}
