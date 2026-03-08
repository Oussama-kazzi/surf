// ================================
// SETTINGS PAGE (Dashboard)
// Company settings — update company info, payment config, payment history.
// Only admin can access this page.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { companyApi, paymentApi, bookingApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Company, Payment, Booking } from "@/types";

type SettingsTab = "company" | "payment-settings" | "payment-history";

export default function SettingsPage() {
  const { user } = useAuth();
  const canRecord = user?.role === "admin" || user?.role === "manager";

  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Company form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    website: "",
  });

  // Payment settings state
  const [paymentForm, setPaymentForm] = useState({
    method: "manual" as "manual" | "stripe" | "bank_transfer",
    manualInstructions: "Please pay at the reception when you arrive.",
    bankName: "",
    iban: "",
    swift: "",
    accountHolder: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  // Payment history state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordForm, setRecordForm] = useState({
    bookingId: "",
    amount: 0,
    method: "credit_card" as Payment["method"],
    type: "full" as Payment["type"],
    notes: "",
  });

  // Load company data
  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await companyApi.getMine();
        setCompany(data.company);
        setForm({
          name: data.company.name,
          description: data.company.description,
          email: data.company.email,
          phone: data.company.phone,
          address: data.company.address,
          city: data.company.city,
          country: data.company.country,
          website: data.company.website,
        });
        // Load payment settings from company
        if (data.company.paymentSettings) {
          setPaymentForm({
            method: data.company.paymentSettings.method || "manual",
            manualInstructions:
              data.company.paymentSettings.manualInstructions ||
              "Please pay at the reception when you arrive.",
            bankName: data.company.paymentSettings.bankName || "",
            iban: data.company.paymentSettings.iban || "",
            swift: data.company.paymentSettings.swift || "",
            accountHolder: data.company.paymentSettings.accountHolder || "",
          });
        }
      } catch (error) {
        console.error("Error loading company:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  // Load payments when switching to payment history tab
  useEffect(() => {
    if (activeTab === "payment-history" && payments.length === 0) {
      loadPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadPayments() {
    setPaymentsLoading(true);
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
      setPaymentsLoading(false);
    }
  }

  // Save company settings
  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await companyApi.updateMine(form);
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  // Save payment settings
  async function handleSavePayment() {
    setSavingPayment(true);
    setPaymentMessage("");
    try {
      await companyApi.updateMine({ paymentSettings: paymentForm });
      setPaymentMessage("Payment settings saved successfully!");
      setTimeout(() => setPaymentMessage(""), 3000);
    } catch (error) {
      console.error("Error saving payment settings:", error);
      setPaymentMessage("Failed to save payment settings.");
    } finally {
      setSavingPayment(false);
    }
  }

  // Record a payment
  async function handleRecordPayment() {
    try {
      await paymentApi.create({
        bookingId: recordForm.bookingId,
        amount: Math.round(recordForm.amount * 100),
        method: recordForm.method,
        type: recordForm.type,
        notes: recordForm.notes,
      });
      setShowRecordForm(false);
      setRecordForm({
        bookingId: "",
        amount: 0,
        method: "credit_card",
        type: "full",
        notes: "",
      });
      loadPayments();
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  }

  const totalRevenue = payments
    .filter((p) => (p as any).status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse-dot"></div>
        <span className="loading-text">Loading settings...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your company configuration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {(
          [
            { id: "company", label: "Company Info" },
            { id: "payment-settings", label: "Payment Settings" },
            { id: "payment-history", label: "Payments History" },
          ] as { id: SettingsTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-ocean-600 text-white shadow-md"
                : "bg-white text-gray-500 hover:bg-sand-50 border border-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================
          TAB: COMPANY INFO
          ================================ */}
      {activeTab === "company" && (
        <>
          {message && (
            <div
              className={
                message.includes("success") ? "alert-success" : "alert-error"
              }
            >
              {message}
            </div>
          )}

          <div className="form-card">
            {company && (
              <div className="mb-6 p-4 bg-ocean-50 rounded-xl border border-ocean-100">
                <p className="text-sm text-gray-600">Your booking page URL:</p>
                <p className="font-mono text-ocean-700 font-medium mt-1">
                  {typeof window !== "undefined"
                    ? window.location.origin
                    : ""}
                  /book/{company.slug}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Share this link with your customers so they can make bookings.
                </p>
              </div>
            )}

            <div className="form-grid">
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  className="input"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  type="text"
                  className="input"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input
                  type="text"
                  className="input"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary mt-6 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </>
      )}

      {/* ================================
          TAB: PAYMENT SETTINGS
          ================================ */}
      {activeTab === "payment-settings" && (
        <>
          {paymentMessage && (
            <div
              className={
                paymentMessage.includes("success")
                  ? "alert-success"
                  : "alert-error"
              }
            >
              {paymentMessage}
            </div>
          )}

          <div className="form-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Payment Settings
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Configure how customers pay for bookings.
            </p>

            {/* Payment Method Selector */}
            <div className="mb-6">
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                {(
                  [
                    {
                      id: "manual",
                      label: "Manual Payment",
                      icon: "💵",
                      desc: "Customers pay on arrival",
                    },
                    {
                      id: "stripe",
                      label: "Stripe",
                      icon: "💳",
                      desc: "Online card payments",
                    },
                    {
                      id: "bank_transfer",
                      label: "Bank Transfer",
                      icon: "🏦",
                      desc: "Wire transfer to your bank",
                    },
                  ] as {
                    id: "manual" | "stripe" | "bank_transfer";
                    label: string;
                    icon: string;
                    desc: string;
                  }[]
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setPaymentForm({ ...paymentForm, method: option.id })
                    }
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      paymentForm.method === option.id
                        ? "border-ocean-500 bg-ocean-50/50 shadow-sm"
                        : "border-gray-100 hover:border-ocean-200"
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <p className="font-medium text-gray-900 text-sm">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {option.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Payment Fields */}
            {paymentForm.method === "manual" && (
              <div className="mb-6 p-5 bg-sand-50 rounded-xl border border-sand-100">
                <label className="label">Payment Instructions</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="e.g., Please pay at the reception when you arrive."
                  value={paymentForm.manualInstructions}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      manualInstructions: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-400 mt-2">
                  These instructions will be shown to customers after they
                  complete a booking.
                </p>
              </div>
            )}

            {/* Stripe Fields */}
            {paymentForm.method === "stripe" && (
              <div className="mb-6 p-5 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Stripe Integration
                    </p>
                    <p className="text-sm text-gray-500">
                      Online payment processing
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-gray-500">
                    Stripe integration is coming soon. Customers will see a
                    &quot;Pay Now&quot; button during booking. For now, a
                    placeholder will be shown.
                  </p>
                </div>
              </div>
            )}

            {/* Bank Transfer Fields */}
            {paymentForm.method === "bank_transfer" && (
              <div className="mb-6 p-5 bg-sand-50 rounded-xl border border-sand-100">
                <p className="text-sm font-medium text-gray-700 mb-4">
                  Bank Account Details
                </p>
                <div className="form-grid">
                  <div>
                    <label className="label">Bank Name</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Bank of Bali"
                      value={paymentForm.bankName}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          bankName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Account Holder</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Bali Surf Camp Ltd"
                      value={paymentForm.accountHolder}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          accountHolder: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">IBAN</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., DE89370400440532013000"
                      value={paymentForm.iban}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          iban: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">SWIFT / BIC</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., COBADEFFXXX"
                      value={paymentForm.swift}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          swift: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  These details will be displayed to customers so they can
                  transfer payment.
                </p>
              </div>
            )}

            <button
              onClick={handleSavePayment}
              disabled={savingPayment}
              className="btn-primary disabled:opacity-50"
            >
              {savingPayment ? "Saving..." : "Save Payment Settings"}
            </button>
          </div>
        </>
      )}

      {/* ================================
          TAB: PAYMENT HISTORY
          ================================ */}
      {activeTab === "payment-history" && (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">
              Total Revenue:{" "}
              <span className="font-bold text-emerald-600">
                {formatPrice(totalRevenue)}
              </span>
            </p>
            {canRecord && (
              <button
                onClick={() => setShowRecordForm(!showRecordForm)}
                className="btn-primary"
              >
                + Record Payment
              </button>
            )}
          </div>

          {/* Record Payment Form */}
          {showRecordForm && (
            <div className="form-card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                Record Payment
              </h2>
              <div className="form-grid">
                <div>
                  <label className="label">Booking</label>
                  <select
                    className="input"
                    value={recordForm.bookingId}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        bookingId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a booking</option>
                    {bookings.map((b) => {
                      const customer = b.customerId as any;
                      return (
                        <option key={b._id} value={b._id}>
                          {customer?.firstName} {customer?.lastName} —{" "}
                          {formatPrice(b.totalPrice)} (
                          {capitalize(b.paymentStatus)})
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
                    value={recordForm.amount}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        amount: Number(e.target.value),
                      })
                    }
                    min={0}
                    step={0.01}
                  />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select
                    className="input"
                    value={recordForm.method}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
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
                    value={recordForm.type}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
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
                    value={recordForm.notes}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, notes: e.target.value })
                    }
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button onClick={handleRecordPayment} className="btn-primary">
                  Record Payment
                </button>
                <button
                  onClick={() => setShowRecordForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Payments Table */}
          {paymentsLoading ? (
            <div className="flex items-center gap-3 py-12">
              <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse-dot"></div>
              <span className="loading-text">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <p className="empty-state-text">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="table-cell font-medium">Customer</th>
                    <th className="table-cell font-medium">Amount</th>
                    <th className="table-cell font-medium">Method</th>
                    <th className="table-cell font-medium">Type</th>
                    <th className="table-cell font-medium">Status</th>
                    <th className="table-cell font-medium">Date</th>
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
                          <span
                            className={`badge ${
                              payment.type === "refund"
                                ? "bg-red-50 text-red-700"
                                : payment.type === "deposit"
                                ? "bg-amber-50 text-amber-700"
                                : payment.type === "remaining"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {capitalize(payment.type || "full")}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`badge ${getStatusColor(
                              payment.status
                            )}`}
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
        </>
      )}
    </div>
  );
}
