// ================================
// ROOM CALENDAR PAGE (Dashboard)
// Visual calendar showing room availability.
// Displays a grid of rooms × dates with booking status.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { roomApi, bookingApi } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/helpers";
import { Room, Booking } from "@/types";

export default function CalendarPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar controls: start date and number of days to show
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  });
  const daysToShow = 14;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [roomData, bookingData] = await Promise.all([
        roomApi.getAll(),
        bookingApi.getAll(),
      ]);
      setRooms(roomData.rooms.filter((r: Room) => r.isActive));
      // Only show non-cancelled bookings
      setBookings(
        bookingData.bookings.filter(
          (b: Booking) => b.status !== "cancelled"
        )
      );
    } catch (err) {
      console.error("Error loading calendar data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Generate array of dates to display
  function getDates(): Date[] {
    const dates: Date[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  // Check if a room is booked on a specific date
  function getBookingForRoomOnDate(
    roomId: string,
    date: Date
  ): Booking | null {
    return (
      bookings.find((b) => {
        const bRoomId =
          typeof b.roomId === "string" ? b.roomId : (b.roomId as Room)._id;
        if (bRoomId !== roomId) return false;

        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        return d >= checkIn && d < checkOut;
      }) || null
    );
  }

  // Navigate dates
  function shiftDates(direction: number) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + direction * 7);
    setStartDate(d.toISOString().split("T")[0]);
  }

  function goToToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today.toISOString().split("T")[0]);
  }

  const dates = getDates();

  // Calculate occupancy rate
  const totalSlots = rooms.length * daysToShow;
  const bookedSlots = rooms.reduce((count, room) => {
    return (
      count +
      dates.filter((d) => getBookingForRoomOnDate(room._id, d) !== null).length
    );
  }, 0);
  const occupancyRate =
    totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  if (loading) {
    return <p className="text-gray-500">Loading calendar...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Room Calendar</h1>
          <p className="text-gray-500">
            Occupancy rate:{" "}
            <span
              className={`font-bold ${
                occupancyRate > 80
                  ? "text-green-600"
                  : occupancyRate > 50
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {occupancyRate}%
            </span>{" "}
            ({bookedSlots}/{totalSlots} room-nights)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDates(-1)}
            className="btn-secondary text-sm px-3"
          >
            ← Prev
          </button>
          <button onClick={goToToday} className="btn-secondary text-sm px-3">
            Today
          </button>
          <button
            onClick={() => shiftDates(1)}
            className="btn-secondary text-sm px-3"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-ocean-200 border border-ocean-400"></div>
          <span className="text-gray-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-400"></div>
          <span className="text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-purple-200 border border-purple-400"></div>
          <span className="text-gray-600">Completed</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-r bg-gray-50 sticky left-0 z-10 min-w-[140px]">
                Room
              </th>
              {dates.map((date) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <th
                    key={date.toISOString()}
                    className={`p-2 border-b text-center min-w-[80px] ${
                      isToday
                        ? "bg-ocean-50 font-bold"
                        : isWeekend
                        ? "bg-gray-50"
                        : ""
                    }`}
                  >
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className={isToday ? "text-ocean-700" : ""}>
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room._id}>
                <td className="p-2 border-b border-r bg-white sticky left-0 z-10">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {room.type} · {formatPrice(room.pricePerNight)}/night
                  </div>
                </td>
                {dates.map((date) => {
                  const booking = getBookingForRoomOnDate(room._id, date);
                  const isToday =
                    date.toDateString() === new Date().toDateString();

                  let bgColor = "bg-green-50 hover:bg-green-100";
                  let label = "";
                  let title = "Available";

                  if (booking) {
                    const customer = booking.customerId as any;
                    const customerName = customer?.firstName
                      ? `${customer.firstName} ${customer.lastName}`
                      : "Guest";

                    switch (booking.status) {
                      case "confirmed":
                        bgColor = "bg-ocean-100";
                        break;
                      case "pending":
                        bgColor = "bg-yellow-100";
                        break;
                      case "completed":
                        bgColor = "bg-purple-100";
                        break;
                      default:
                        bgColor = "bg-gray-100";
                    }

                    // Show customer initial on first day of booking
                    const checkInDate = new Date(booking.checkIn);
                    checkInDate.setHours(0, 0, 0, 0);
                    const cellDate = new Date(date);
                    cellDate.setHours(0, 0, 0, 0);
                    if (checkInDate.getTime() === cellDate.getTime()) {
                      label = customerName.charAt(0).toUpperCase();
                    }

                    title = `${customerName} — ${booking.status} (${formatDate(
                      booking.checkIn
                    )} → ${formatDate(booking.checkOut)})`;
                  }

                  return (
                    <td
                      key={date.toISOString()}
                      className={`p-1 border-b text-center cursor-default ${bgColor} ${
                        isToday ? "ring-2 ring-inset ring-ocean-400" : ""
                      }`}
                      title={title}
                    >
                      {label && (
                        <span className="text-xs font-bold text-gray-700">
                          {label}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rooms.length === 0 && (
        <div className="card text-center py-12 mt-4">
          <div className="text-4xl mb-4">🏠</div>
          <p className="text-gray-500">No rooms found. Create rooms first.</p>
        </div>
      )}
    </div>
  );
}
