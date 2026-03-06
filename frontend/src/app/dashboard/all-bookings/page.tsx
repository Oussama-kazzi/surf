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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Bookings (Platform)</h1>
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
        <p className="text-gray-500">Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No bookings found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Room</th>
                <th className="pb-3 font-medium">Check-in</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const company = booking.companyId as any;
                const customer = booking.customerId as any;
                const room = booking.roomId as any;

                return (
                  <tr key={booking._id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      {company?.name || "—"}
                    </td>
                    <td className="py-3">
                      {customer?.firstName} {customer?.lastName}
                    </td>
                    <td className="py-3">{room?.name || "—"}</td>
                    <td className="py-3">{formatDate(booking.checkIn)}</td>
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
  );
}
