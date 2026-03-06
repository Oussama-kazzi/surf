// ================================
// ADMIN ROUTES (SUPER ADMIN ONLY)
// These routes are for the platform owner (YOU).
// They give you access to manage all companies,
// view all bookings, and see platform analytics.
// ================================

import express, { Response } from "express";
import User from "../models/User";
import Company from "../models/Company";
import Booking from "../models/Booking";
import Payment from "../models/Payment";
import Customer from "../models/Customer";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// All routes here require super_admin role
router.use(verifyToken);
router.use(requireRole("super_admin"));

// ================================
// GET PLATFORM ANALYTICS
// Shows overall stats for the entire platform.
// ================================
router.get("/analytics", async (_req: AuthRequest, res: Response) => {
  try {
    // Count documents in each collection
    const [
      totalCompanies,
      totalBookings,
      totalCustomers,
      totalRevenue,
    ] = await Promise.all([
      Company.countDocuments(),
      Booking.countDocuments(),
      Customer.countDocuments(),
      // Sum all completed payments across all companies
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      analytics: {
        totalCompanies,
        totalBookings,
        totalCustomers,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET ALL COMPANIES
// ================================
router.get("/companies", async (_req: AuthRequest, res: Response) => {
  try {
    const companies = await Company.find()
      .populate("ownerId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ companies });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET SINGLE COMPANY WITH STATS
// ================================
router.get("/companies/:id", async (req: AuthRequest, res: Response) => {
  try {
    const company = await Company.findById(req.params.id).populate(
      "ownerId",
      "firstName lastName email"
    );

    if (!company) {
      res.status(404).json({ message: "Company not found." });
      return;
    }

    // Get stats for this company
    const [bookingCount, customerCount, revenue] = await Promise.all([
      Booking.countDocuments({ companyId: company._id }),
      Customer.countDocuments({ companyId: company._id }),
      Payment.aggregate([
        { $match: { companyId: company._id, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      company,
      stats: {
        bookingCount,
        customerCount,
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Get company error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// UPDATE COMPANY (e.g., change subscription)
// ================================
router.put("/companies/:id", async (req: AuthRequest, res: Response) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404).json({ message: "Company not found." });
      return;
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      (company as any)[key] = updates[key];
    });

    await company.save();

    res.json({ message: "Company updated!", company });
  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// DEACTIVATE/ACTIVATE COMPANY
// ================================
router.patch(
  "/companies/:id/toggle",
  async (req: AuthRequest, res: Response) => {
    try {
      const company = await Company.findById(req.params.id);

      if (!company) {
        res.status(404).json({ message: "Company not found." });
        return;
      }

      company.isActive = !company.isActive;
      await company.save();

      res.json({
        message: company.isActive
          ? "Company activated!"
          : "Company deactivated!",
      });
    } catch (error) {
      console.error("Toggle company error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// GET ALL BOOKINGS (ACROSS ALL COMPANIES)
// ================================
router.get("/bookings", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("companyId", "name slug")
      .populate("customerId", "firstName lastName email")
      .populate("roomId", "name type")
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 for performance

    res.json({ bookings });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET ALL PAYMENTS (ACROSS ALL COMPANIES)
// ================================
router.get("/payments", async (_req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find()
      .populate("companyId", "name")
      .populate("bookingId", "checkIn checkOut totalPrice")
      .populate("customerId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ payments });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// CREATE SUPER ADMIN ACCOUNT
// Special route to create the first super admin.
// Only works if no super admin exists yet.
// ================================
router.post("/setup", async (_req: AuthRequest, res: Response) => {
  // This is a special case - we remove the auth middleware temporarily
  // by placing this comment. In production, you'd want to handle this differently.
  // For now, this route is protected by the super_admin middleware above.
  res.status(400).json({
    message: "Use the seed script to create the first super admin.",
  });
});

export default router;
