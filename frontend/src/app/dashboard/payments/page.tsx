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
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">
            Total Revenue:{" "}
            <span className="font-bold text-emerald-600">
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
        <div className="form-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Record Payment</h2>

          <div className="form-grid">
            <div>
              <label className="label">Booking</label>
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
              <label className="label">Amount ($)</label>
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
              <label className="label">Method</label>
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
              <label className="label">Payment Type</label>
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
              <label className="label">Notes</label>
              <input
                type="text"
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="form-actions">
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
        <div className="flex items-center gap-3 py-12">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
          <span className="loading-text">Loading payments...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Customer</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Method</th>
                <th className="table-header">Type</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const customer = payment.customerId as any;

                return (
                  <tr key={payment._id} className="table-row">
                    <td className="table-cell font-medium text-gray-800">
                      {customer?.firstName} {customer?.lastName}
                    </td>
                    <td className="table-cell font-semibold">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="table-cell text-gray-500 capitalize">
                      {payment.method.replace("_", " ")}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        payment.type === "refund"
                          ? "bg-red-50 text-red-700"
                          : payment.type === "deposit"
                          ? "bg-amber-50 text-amber-700"
                          : payment.type === "remaining"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {capitalize(payment.type || "full")}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${getStatusColor(payment.status)}`}
                      >
                        {capitalize(payment.status)}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400">
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
