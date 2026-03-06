// ================================
// PACKAGE MODEL
// Represents a surf package that a company offers.
// Example: "7-day Beginner Surf Package", "Weekend Surf Trip"
// A package has a price and includes certain things.
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface IPackage extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  durationDays: number; // How many days the package lasts
  pricePerPerson: number; // Price in cents per person
  includes: string[]; // What's included, e.g., ["surf lessons", "board rental", "breakfast"]
  maxParticipants: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "all-levels";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>(
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
    // How many days the package lasts
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    // Price in cents per person
    pricePerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    // List of things included in the package
    includes: {
      type: [String],
      default: [],
    },
    maxParticipants: {
      type: Number,
      default: 10,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all-levels"],
      default: "all-levels",
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

const Package = mongoose.model<IPackage>("Package", packageSchema);
export default Package;
