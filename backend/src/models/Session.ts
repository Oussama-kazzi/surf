// ================================
// SESSION MODEL
// A session is a specific time slot for an activity.
//
// Example:
//   Activity = "Surf Lesson"
//   Session 1 = Surf Lesson on Jan 15 at 09:00–11:00
//   Session 2 = Surf Lesson on Jan 15 at 14:00–16:00
//
// Each session tracks how many spots are booked (bookedCount)
// vs total capacity. Before booking, we verify:
//   bookedCount < capacity
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  activityId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  date: Date; // The date of the session (YYYY-MM-DD)
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "11:00"
  capacity: number; // Max spots in this session
  bookedCount: number; // How many are already booked
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    // Date of the session
    date: {
      type: Date,
      required: true,
    },
    // Start time as HH:mm string
    startTime: {
      type: String,
      required: true,
    },
    // End time as HH:mm string
    endTime: {
      type: String,
      required: true,
    },
    // Maximum participants for this specific session
    // Defaults to the activity's capacity but can be overridden
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    // How many spots are already booked
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model<ISession>("Session", sessionSchema);
export default Session;
