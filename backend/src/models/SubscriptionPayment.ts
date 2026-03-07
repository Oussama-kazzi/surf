// ================================
// SUBSCRIPTION PAYMENT MODEL
// Records every real payment made for subscriptions.
//
// WHY THIS EXISTS:
// When a company subscribes or renews, we record an actual
// payment entry so the super admin can see REAL revenue,
// not just projected revenue from active plan prices.
//
// Each subscribe or renew action creates ONE payment record.
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriptionPayment extends Document {
  companyId: mongoose.Types.ObjectId; // Which company paid
  subscriptionId: mongoose.Types.ObjectId; // Which subscription this payment is for
  amount: number; // Amount paid (in cents)
  plan: "basic" | "pro" | "premium"; // Which plan they paid for
  type: "new" | "renewal"; // New subscription or renewal
  status: "completed" | "failed" | "refunded"; // Payment status
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    // Amount in cents (matches the plan's pricePerMonth at time of payment)
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    plan: {
      type: String,
      enum: ["basic", "pro", "premium"],
      required: true,
    },
    // "new" = first time subscribing to this plan, "renewal" = renewing same plan
    type: {
      type: String,
      enum: ["new", "renewal"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed", "refunded"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionPayment = mongoose.model<ISubscriptionPayment>(
  "SubscriptionPayment",
  subscriptionPaymentSchema
);

export default SubscriptionPayment;
