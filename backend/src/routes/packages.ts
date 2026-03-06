// ================================
// PACKAGE ROUTES
// CRUD for surf packages.
// ================================

import express, { Response } from "express";
import Package from "../models/Package";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ================================
// GET PACKAGES FOR A COMPANY (PUBLIC)
// Used by the booking page so customers can choose a package.
// ================================
router.get("/company/:companyId", async (req: AuthRequest, res: Response) => {
  try {
    const packages = await Package.find({
      companyId: req.params.companyId,
      isActive: true,
    }).sort({ pricePerPerson: 1 }); // Sort by price (cheapest first)

    res.json({ packages });
  } catch (error) {
    console.error("Get packages error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET ALL PACKAGES FOR MY COMPANY (DASHBOARD)
// ================================
router.get(
  "/",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const packages = await Package.find({
        companyId: req.user!.companyId,
      }).sort({ createdAt: -1 });

      res.json({ packages });
    } catch (error) {
      console.error("Get packages error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// CREATE PACKAGE
// ================================
router.post(
  "/",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        name,
        description,
        durationDays,
        pricePerPerson,
        includes,
        maxParticipants,
        difficulty,
      } = req.body;

      const pkg = new Package({
        companyId: req.user!.companyId,
        name,
        description,
        durationDays,
        pricePerPerson,
        includes: includes || [],
        maxParticipants,
        difficulty,
      });

      await pkg.save();

      res.status(201).json({ message: "Package created!", package: pkg });
    } catch (error) {
      console.error("Create package error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE PACKAGE
// ================================
router.put(
  "/:id",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const pkg = await Package.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!pkg) {
        res.status(404).json({ message: "Package not found." });
        return;
      }

      const updates = req.body;
      Object.keys(updates).forEach((key) => {
        (pkg as any)[key] = updates[key];
      });

      await pkg.save();

      res.json({ message: "Package updated!", package: pkg });
    } catch (error) {
      console.error("Update package error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// DELETE PACKAGE (soft delete)
// ================================
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const pkg = await Package.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!pkg) {
        res.status(404).json({ message: "Package not found." });
        return;
      }

      pkg.isActive = false;
      await pkg.save();

      res.json({ message: "Package deleted." });
    } catch (error) {
      console.error("Delete package error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
