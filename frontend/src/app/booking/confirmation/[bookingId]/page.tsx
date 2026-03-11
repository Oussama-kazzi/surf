// ================================
// BOOKING CONFIRMATION PAGE
// URL: /booking/confirmation/[bookingId]
//
// Shows booking success + invoice details + PDF download.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { invoiceApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/helpers";
import { Invoice } from "@/types";

export default function BookingConfirmationPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the invoice for this booking
  useEffect(() => {
    async function loadInvoice() {
      try {
        const data = await invoiceApi.getByBooking(bookingId);
        setInvoice(data.invoice);
      } catch (err: any) {
        setError("Could not load invoice details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [bookingId]);

  // ================================
  // LOADING STATE
  // ================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
            <span className="loading-text">Loading confirmation...</span>
          </div>
        </div>
      </div>
    );
  }

  // ================================
  // ERROR STATE
  // ================================
  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invoice Not Found
          </h1>
          <p className="text-gray-400">
            {error || "We couldn't find the invoice for this booking."}
          </p>
        </div>
      </div>
    );
  }

  // Format payment method for display
  function formatPaymentMethod(method: string): string {
    switch (method) {
      case "pay_on_arrival":
        return "Pay on Arrival";
      case "stripe":
        return "Stripe";
      case "paypal":
        return "PayPal";
      default:
        return method;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 320\'%3E%3Cpath fill=\'%23ffffff\' d=\'M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,149.3C672,128,768,128,864,149.3C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z\'/%3E%3C/svg%3E")' }}></div>
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <h1 className="text-3xl font-bold tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-white/70 mt-2">
            Your reservation at <strong>{invoice.companyName}</strong> has been
            submitted successfully.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Invoice Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Invoice</h2>
              <p className="text-sm text-gray-400">
                {invoice.invoiceNumber}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                invoice.paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {invoice.paymentStatus.toUpperCase()}
            </span>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Customer
                </p>
                <p className="font-medium text-gray-900">
                  {invoice.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  {invoice.customerEmail}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Payment Method
                </p>
                <p className="font-medium text-gray-900">
                  {formatPaymentMethod(invoice.paymentMethod)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Booking Date
                </p>
                <p className="font-medium text-gray-900">
                  {formatDate(invoice.bookingDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Stay
                </p>
                <p className="font-medium text-gray-900">
                  {invoice.numberOfNights} night{invoice.numberOfNights !== 1 ? "s" : ""} · {invoice.numberOfGuests} guest{invoice.numberOfGuests !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Price Breakdown */}
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Price Breakdown
          </h3>
          <div className="space-y-3 mb-6">
            {/* Room */}
            <div className="flex justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">Room</p>
                <p className="text-gray-400">
                  {invoice.priceBreakdown.roomName} — {invoice.priceBreakdown.numberOfNights} night{invoice.priceBreakdown.numberOfNights !== 1 ? "s" : ""} × {formatPrice(invoice.priceBreakdown.roomPricePerNight)}/night
                </p>
              </div>
              <span className="font-medium text-gray-900">
                {formatPrice(invoice.priceBreakdown.roomTotal)}
              </span>
            </div>

            {/* Package */}
            {invoice.priceBreakdown.packageName && (
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">Package</p>
                  <p className="text-gray-400">
                    {invoice.priceBreakdown.packageName} — {invoice.priceBreakdown.numberOfGuests} guest{invoice.priceBreakdown.numberOfGuests !== 1 ? "s" : ""} × {formatPrice(invoice.priceBreakdown.packagePricePerPerson || 0)}/person
                  </p>
                </div>
                <span className="font-medium text-gray-900">
                  {formatPrice(invoice.priceBreakdown.packageTotal)}
                </span>
              </div>
            )}

            {/* Activities */}
            {invoice.priceBreakdown.activities.length > 0 &&
              invoice.priceBreakdown.activities.map((act, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Activity</p>
                    <p className="text-gray-400">{act.name}</p>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatPrice(act.price)}
                  </span>
                </div>
              ))}

            {/* Total */}
            <hr className="border-gray-100" />
            <div className="flex justify-between">
              <p className="text-lg font-bold text-gray-900">Total</p>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(invoice.totalAmount)}
              </p>
            </div>
          </div>

          {/* Surf Sessions */}
          {invoice.sessions.length > 0 && (
            <>
              <hr className="border-gray-100 mb-6" />
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Surf Sessions
              </h3>
              <div className="space-y-2 mb-6">
                {invoice.sessions.map((sess, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {sess.activityName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sess.date} · {sess.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Download PDF Button */}
          <div className="flex gap-3">
            <a
              href={invoiceApi.getPdfUrl(invoice._id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              Download Invoice PDF
            </a>
            <a
              href="/"
              className="btn-secondary inline-flex items-center gap-2"
            >
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Pay on Arrival reminder */}
        {invoice.paymentStatus === "unpaid" && (
          <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <div>
                <p className="font-semibold text-amber-800">Payment Pending</p>
                <p className="text-sm text-amber-700 mt-1">
                  You selected &quot;Pay on Arrival&quot;. Please pay at the reception
                  when you check in. A confirmation email has been sent to{" "}
                  <strong>{invoice.customerEmail}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
