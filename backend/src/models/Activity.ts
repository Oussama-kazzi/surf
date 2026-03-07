// ================================
// ACTIVITY MODEL
// Represents a surf activity that a company offers.
// Examples: Surf Lesson, Surf Guiding, Yoga Session, Airport Transfer.
//
// Each company can create multiple activities.
// Customers can add activities to their booking.
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number; // Price per person in cents
  duration: number; // Duration in minutes
  capacity: number; // Max participants per session
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Price per person in cents (e.g., 5000 = $50.00)
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Duration in minutes (e.g., 90 = 1.5 hours)
    duration: {
      type: Number,
      required: true,
      min: 15,
    },
    // Max number of participants in a single session
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model<IActivity>("Activity", activitySchema);
export default Activity;
