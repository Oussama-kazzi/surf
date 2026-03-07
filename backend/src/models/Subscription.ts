// ================================
// SUBSCRIPTION MODEL
// Tracks each company's monthly subscription.
// Each company has ONE active subscription at a time.
//
// HOW IT WORKS:
// - When a company registers, they get a 15-day free trial
// - After that, they must pick a plan (Basic, Pro, Premium)
// - Each plan has a monthly price
// - The subscription has a start date and next billing date
// - If the billing date passes without payment, status becomes "expired"
// ================================

import mongoose, { Schema, Document } from "mongoose";

// ================================
// SUBSCRIPTION PLANS CONFIG
// Defines what each plan costs and what features it includes.
// Prices are in CENTS to avoid floating-point issues.
// ================================
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic",
    pricePerMonth: 2900, // $29/month
    maxRooms: 5, // Can only have 5 rooms
    maxBookingsPerMonth: 50, // Max 50 bookings per month
    features: ["Up to 5 rooms", "50 bookings/month", "Email support"],
  },
  pro: {
    name: "Pro",
    pricePerMonth: 7900, // $79/month
    maxRooms: 20, // Can have 20 rooms
    maxBookingsPerMonth: 200, // Max 200 bookings per month
    features: [
      "Up to 20 rooms",
      "200 bookings/month",
      "Priority support",
      "Custom booking page",
    ],
  },
  premium: {
    name: "Premium",
    pricePerMonth: 14900, // $149/month
    maxRooms: -1, // Unlimited rooms (-1 means no limit)
    maxBookingsPerMonth: -1, // Unlimited bookings
    features: [
      "Unlimited rooms",
      "Unlimited bookings",
      "24/7 phone support",
      "Custom booking page",
      "API access",
      "White-label option",
    ],
  },
};

// TypeScript type for plan names
export type PlanType = "basic" | "pro" | "premium";

// ================================
// SUBSCRIPTION INTERFACE
// Defines the shape of a Subscription document.
// ================================
export interface ISubscription extends Document {
  companyId: mongoose.Types.ObjectId; // Which company this subscription belongs to
  plan: PlanType; // Which plan they're on
  status: "active" | "expired" | "canceled" | "trial"; // Current status
  pricePerMonth: number; // How much they pay monthly (in cents)
  startDate: Date; // When the subscription started
  nextBillingDate: Date; // When the next payment is due
  canceledAt?: Date; // When they canceled (if they did)
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// SUBSCRIPTION SCHEMA
// The MongoDB schema for subscriptions.
// ================================
const subscriptionSchema = new Schema<ISubscription>(
  {
    // Which company owns this subscription
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // The plan type: basic, pro, or premium
    plan: {
      type: String,
      enum: ["basic", "pro", "premium"],
      required: true,
    },

    // Subscription status:
    // - "trial"    = free trial period (15 days after registration)
    // - "active"   = paid and active
    // - "expired"  = billing date passed, needs renewal
    // - "canceled" = user canceled their subscription
    status: {
      type: String,
      enum: ["active", "expired", "canceled", "trial"],
      default: "trial",
    },

    // Monthly price in cents
    // We store this here too so we know what they agreed to pay
    // (in case we change plan prices later)
    pricePerMonth: {
      type: Number,
      required: true,
    },

    // When the subscription started
    startDate: {
      type: Date,
      default: Date.now,
    },

    // When the next payment is due
    // For trial: this is when the trial ends
    // For active: this is the next monthly billing date
    nextBillingDate: {
      type: Date,
      required: true,
    },

    // If the user canceled, when did they cancel?
    canceledAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create the model
const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);

export default Subscription;
