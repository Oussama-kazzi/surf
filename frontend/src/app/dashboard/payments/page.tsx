// ================================
// PAYMENTS PAGE (Dashboard)
// Shows all payments and allows recording new ones.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { paymentApi, bookingApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Payment, Booking } from "@/types";

export default function PaymentsPage() {
  const { user } = useAuth();
  const canRecord = user?.role === "admin" || user?.role === "manager";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Payment form state
  const [form, setForm] = useState({
    bookingId: "",
    amount: 0,
    method: "credit_card" as Payment["method"],
    type: "full" as Payment["type"],
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [paymentData, bookingData] = await Promise.all([
        paymentApi.getAll(),
        bookingApi.getAll(),
      ]);
      setPayments(paymentData.payments);
      setBookings(bookingData.bookings);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordPayment() {
    try {
      await paymentApi.create({
        bookingId: form.bookingId,
        amount: Math.round(form.amount * 100), // dollars to cents
        method: form.method,
        type: form.type,
        notes: form.notes,
      });
      setShowForm(false);
      loadData(); // Refresh
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  }

  // Calculate total revenue
  const totalRevenue = payments
    .filter((p) => (p as any).status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-gray-500">
            Total Revenue:{" "}
            <span className="font-bold text-green-600">
              {formatPrice(totalRevenue)}
            </span>
          </p>
        </div>
        {canRecord && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Record Payment
          </button>
        )}
      </div>

      {/* Record Payment Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Record Payment</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking
              </label>
              <select
                className="input"
                value={form.bookingId}
                onChange={(e) =>
                  setForm({ ...form, bookingId: e.target.value })
                }
              >
                <option value="">Select a booking</option>
                {bookings.map((b) => {
                  const customer = b.customerId as any;
                  return (
                    <option key={b._id} value={b._id}>
                      {customer?.firstName} {customer?.lastName} —{" "}
                      {formatPrice(b.totalPrice)} ({capitalize(b.paymentStatus)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: Number(e.target.value) })
                }
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                className="input"
                value={form.method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    method: e.target.value as Payment["method"],
                  })
                }
              >
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type
              </label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as Payment["type"],
                  })
                }
              >
                <option value="full">Full Payment</option>
                <option value="deposit">Deposit</option>
                <option value="remaining">Remaining Balance</option>
                <option value="refund">Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleRecordPayment} className="btn-primary">
              Record Payment
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payments List */}
      {loading ? (
        <p className="text-gray-500">Loading payments...</p>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">💳</div>
          <p className="text-gray-500">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const customer = payment.customerId as any;

                return (
                  <tr key={payment._id} className="border-b last:border-0">
                    <td className="py-3">
                      {customer?.firstName} {customer?.lastName}
                    </td>
                    <td className="py-3 font-medium">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="py-3 capitalize">
                      {payment.method.replace("_", " ")}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${
                        payment.type === "refund"
                          ? "bg-red-100 text-red-700"
                          : payment.type === "deposit"
                          ? "bg-yellow-100 text-yellow-700"
                          : payment.type === "remaining"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {capitalize(payment.type || "full")}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`badge ${getStatusColor(payment.status)}`}
                      >
                        {capitalize(payment.status)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(payment.createdAt)}
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
