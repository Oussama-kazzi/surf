// ================================
// INVOICE MODEL
// Automatically generated after a booking is confirmed.
// Stores all billing details for the customer.
// ================================

import mongoose, { Schema, Document } from "mongoose";

// Price breakdown stored on the invoice
export interface IPriceBreakdown {
  roomName: string;
  roomPricePerNight: number; // cents
  numberOfNights: number;
  roomTotal: number; // cents
  packageName?: string;
  packagePricePerPerson?: number; // cents
  numberOfGuests: number;
  packageTotal: number; // cents
  activities: { name: string; price: number }[];
  activitiesTotal: number; // cents
}

export interface IInvoice extends Document {
  invoiceNumber: string; // e.g. INV-0001
  bookingId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  companyName: string;
  customerName: string;
  customerEmail: string;
  roomName: string;
  packageName?: string;
  sessions: { activityName: string; date: string; time: string }[];
  numberOfNights: number;
  numberOfGuests: number;
  priceBreakdown: IPriceBreakdown;
  totalAmount: number; // cents
  paymentMethod: "pay_on_arrival" | "stripe" | "paypal";
  paymentStatus: "unpaid" | "paid";
  bookingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    // Auto-generated invoice number like INV-0001
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    // Link back to the booking
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    packageName: {
      type: String,
      default: null,
    },
    // Surf sessions booked (snapshot at invoice time)
    sessions: [
      {
        activityName: String,
        date: String,
        time: String,
      },
    ],
    numberOfNights: {
      type: Number,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
    },
    // Full price breakdown for the PDF
    priceBreakdown: {
      roomName: String,
      roomPricePerNight: Number,
      numberOfNights: Number,
      roomTotal: Number,
      packageName: String,
      packagePricePerPerson: Number,
      numberOfGuests: Number,
      packageTotal: Number,
      activities: [
        {
          name: String,
          price: Number,
        },
      ],
      activitiesTotal: Number,
    },
    // Total in cents
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["pay_on_arrival", "stripe", "paypal"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    bookingDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ================================
// STATIC: Generate next invoice number
// Finds the last invoice and increments the counter.
// Returns "INV-0001", "INV-0002", etc.
// ================================
invoiceSchema.statics.generateInvoiceNumber = async function (): Promise<string> {
  const lastInvoice = await this.findOne().sort({ createdAt: -1 });

  if (!lastInvoice) {
    return "INV-0001";
  }

  // Extract the number from "INV-0042" → 42
  const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[1], 10);
  const nextNumber = lastNumber + 1;

  // Pad to 4 digits: 42 → "0042"
  return `INV-${String(nextNumber).padStart(4, "0")}`;
};

const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);
export default Invoice;
