// ================================
// PAYMENT ROUTES
// Record and manage payments for bookings.
// ================================

import express, { Response } from "express";
import Payment from "../models/Payment";
import Booking from "../models/Booking";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ================================
// GET ALL PAYMENTS FOR MY COMPANY
// ================================
router.get(
  "/",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const payments = await Payment.find({
        companyId: req.user!.companyId,
      })
        .populate("bookingId", "checkIn checkOut totalPrice status")
        .populate("customerId", "firstName lastName email")
        .sort({ createdAt: -1 });

      res.json({ payments });
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// RECORD A PAYMENT
// When a customer pays, we record the payment
// and update the booking's payment status.
// ================================
router.post(
  "/",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { bookingId, amount, method, type, notes } = req.body;

      // Find the booking
      const booking = await Booking.findOne({
        _id: bookingId,
        companyId: req.user!.companyId,
      });

      if (!booking) {
        res.status(404).json({ message: "Booking not found." });
        return;
      }

      // Create the payment record
      const payment = new Payment({
        companyId: req.user!.companyId,
        bookingId: booking._id,
        customerId: booking.customerId,
        amount,
        method,
        type: type || "full",
        paidAt: new Date(),
        status: "completed",
        notes,
      });

      await payment.save();

      // ================================
      // UPDATE BOOKING PAYMENT STATUS
      // Check total payments for this booking
      // If total paid >= booking total, mark as "paid"
      // Otherwise, mark as "partial"
      // ================================
      const allPayments = await Payment.find({
        bookingId: booking._id,
        status: "completed",
      });

      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid >= booking.totalPrice) {
        booking.paymentStatus = "paid";
      } else {
        booking.paymentStatus = "partial";
      }

      await booking.save();

      res.status(201).json({
        message: "Payment recorded!",
        payment,
        totalPaid,
        remaining: booking.totalPrice - totalPaid,
      });
    } catch (error) {
      console.error("Record payment error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
