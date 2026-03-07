// ================================
// ACTIVITY ROUTES
// CRUD for surf activities.
// Public: GET activities by company
// Dashboard: full CRUD (admin/manager only)
// ================================

import express, { Response } from "express";
import Activity from "../models/Activity";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ================================
// GET ACTIVITIES FOR A COMPANY (PUBLIC)
// Used on the public booking page so customers can see
// what activities the company offers.
// ================================
router.get("/company/:companyId", async (req: AuthRequest, res: Response) => {
  try {
    const activities = await Activity.find({
      companyId: req.params.companyId,
      isActive: true,
    }).sort({ name: 1 });

    res.json({ activities });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET ALL ACTIVITIES FOR MY COMPANY (DASHBOARD)
// ================================
router.get(
  "/",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const activities = await Activity.find({
        companyId: req.user!.companyId,
      }).sort({ createdAt: -1 });

      res.json({ activities });
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// CREATE ACTIVITY
// ================================
router.post(
  "/",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, price, duration, capacity } = req.body;

      if (!name || price == null || !duration || !capacity) {
        res.status(400).json({ message: "Name, price, duration, and capacity are required." });
        return;
      }

      const activity = new Activity({
        companyId: req.user!.companyId,
        name,
        description: description || "",
        price,
        duration,
        capacity,
      });

      await activity.save();

      res.status(201).json({ message: "Activity created!", activity });
    } catch (error) {
      console.error("Create activity error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE ACTIVITY
// ================================
router.put(
  "/:id",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const activity = await Activity.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!activity) {
        res.status(404).json({ message: "Activity not found." });
        return;
      }

      const { name, description, price, duration, capacity, isActive } = req.body;

      if (name !== undefined) activity.name = name;
      if (description !== undefined) activity.description = description;
      if (price !== undefined) activity.price = price;
      if (duration !== undefined) activity.duration = duration;
      if (capacity !== undefined) activity.capacity = capacity;
      if (isActive !== undefined) activity.isActive = isActive;

      await activity.save();

      res.json({ message: "Activity updated!", activity });
    } catch (error) {
      console.error("Update activity error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// DELETE ACTIVITY (SOFT DELETE)
// We don't actually delete — just mark as inactive.
// ================================
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const activity = await Activity.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!activity) {
        res.status(404).json({ message: "Activity not found." });
        return;
      }

      activity.isActive = false;
      await activity.save();

      res.json({ message: "Activity deleted." });
    } catch (error) {
      console.error("Delete activity error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
