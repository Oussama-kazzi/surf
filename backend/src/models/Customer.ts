// ================================
// CUSTOMER MODEL
// Represents someone who makes a booking.
// Customers are separate from Users (who manage the system).
// ================================

import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  companyId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality?: string;
  dateOfBirth?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    // Which company this customer booked with
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
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
    nationality: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
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

const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
export default Customer;
