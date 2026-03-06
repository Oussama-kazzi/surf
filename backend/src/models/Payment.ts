// ================================
// PAYMENT MODEL
// Tracks payments made for bookings.
// A booking can have multiple payments (e.g., deposit + final payment).
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  companyId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number; // Amount in cents
  method: "credit_card" | "bank_transfer" | "cash" | "other";
  status: "pending" | "completed" | "failed" | "refunded";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    // Amount in cents
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ["credit_card", "bank_transfer", "cash", "other"],
      default: "credit_card",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;
