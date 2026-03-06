// ================================
// COMPANY MODEL
// Represents a Surf Company using our SaaS platform.
// Each company has their own rooms, packages, and bookings.
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  slug: string; // URL-friendly name (e.g., "bali-surf-camp")
  description: string;
  logo?: string;
  coverImage?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  ownerId: mongoose.Types.ObjectId; // The admin user who owns this company
  subscription: {
    plan: "free" | "basic" | "premium";
    status: "active" | "inactive" | "cancelled";
    startDate: Date;
    endDate?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Slug is used in URLs: /book/bali-surf-camp
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    // The user who created/owns this company
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Subscription info for the SaaS billing
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "cancelled"],
        default: "active",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: null,
      },
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

const Company = mongoose.model<ICompany>("Company", companySchema);
export default Company;
