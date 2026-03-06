// ================================
// ROOM MODEL
// Represents a room that a surf company offers.
// Rooms are what customers book for their stay.
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: "single" | "double" | "suite" | "dorm" | "bungalow";
  capacity: number; // Max number of guests
  pricePerNight: number; // Base price per night in cents (to avoid decimal issues)
  amenities: string[]; // e.g., ["wifi", "ac", "sea-view"]
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    // Which company this room belongs to
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
    type: {
      type: String,
      enum: ["single", "double", "suite", "dorm", "bungalow"],
      default: "double",
    },
    // How many people can stay in this room
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Price stored in cents (e.g., 5000 = $50.00)
    // Why cents? Because floating point math with dollars causes bugs.
    // e.g., 0.1 + 0.2 !== 0.3 in JavaScript
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
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

const Room = mongoose.model<IRoom>("Room", roomSchema);
export default Room;
