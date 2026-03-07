// ================================
// BOOKING MODEL
// This is the core of our system.
// A booking connects a customer to a room and a package
// for a specific date range.
// ================================

import mongoose, { Schema, Document } from "mongoose";

// A single activity+session booked as part of a booking
export interface IBookingActivity {
  activityId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  price: number; // Price in cents at the time of booking
}

export interface IBooking extends Document {
  companyId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  // Activities added to this booking
  activities: IBookingActivity[];
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  numberOfNights: number;
  // Price breakdown (all in cents)
  roomTotal: number; // pricePerNight * numberOfNights
  packageTotal: number; // package price * numberOfGuests
  activitiesTotal: number; // sum of all activity prices
  totalPrice: number; // roomTotal + packageTotal + activitiesTotal
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    // Who made the booking
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    // Which room was booked
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    // Which surf package (optional, customer might just want the room)
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    // Activities booked (optional array of activity+session pairs)
    activities: [
      {
        activityId: {
          type: Schema.Types.ObjectId,
          ref: "Activity",
          required: true,
        },
        sessionId: {
          type: Schema.Types.ObjectId,
          ref: "Session",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Check-in and check-out dates
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    // Calculated: difference between checkOut and checkIn in days
    numberOfNights: {
      type: Number,
      required: true,
      min: 1,
    },
    // ================================
    // PRICE BREAKDOWN
    // All prices in cents (e.g., 15000 = $150.00)
    // ================================
    roomTotal: {
      type: Number,
      required: true,
    },
    packageTotal: {
      type: Number,
      default: 0,
    },
    activitiesTotal: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    // Booking status
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    // Payment status
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
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

const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;
