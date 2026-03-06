// ================================
// CUSTOMER ROUTES
// Manage customers for a company.
// ================================

import express, { Response } from "express";
import Customer from "../models/Customer";
import Booking from "../models/Booking";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ================================
// GET ALL CUSTOMERS FOR MY COMPANY
// ================================
router.get(
  "/",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const customers = await Customer.find({
        companyId: req.user!.companyId,
      }).sort({ createdAt: -1 });

      res.json({ customers });
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// GET SINGLE CUSTOMER WITH THEIR BOOKINGS
// ================================
router.get(
  "/:id",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const customer = await Customer.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!customer) {
        res.status(404).json({ message: "Customer not found." });
        return;
      }

      // Also fetch their bookings
      const bookings = await Booking.find({
        customerId: customer._id,
      })
        .populate("roomId", "name type")
        .populate("packageId", "name")
        .sort({ createdAt: -1 });

      res.json({ customer, bookings });
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE CUSTOMER
// ================================
router.put(
  "/:id",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const customer = await Customer.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!customer) {
        res.status(404).json({ message: "Customer not found." });
        return;
      }

      const updates = req.body;
      Object.keys(updates).forEach((key) => {
        (customer as any)[key] = updates[key];
      });

      await customer.save();

      res.json({ message: "Customer updated!", customer });
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
