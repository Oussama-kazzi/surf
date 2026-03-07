// ================================
// TEAM ROUTES
// Manage team members for a company.
// Only admin can add/remove team members.
// ================================

import express, { Response } from "express";
import User from "../models/User";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ================================
// GET ALL TEAM MEMBERS
// Returns all users belonging to the same company.
// ================================
router.get(
  "/",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const teamMembers = await User.find({
        companyId: req.user!.companyId,
      })
        .select("-password") // Don't send passwords!
        .sort({ createdAt: -1 });

      res.json({ teamMembers });
    } catch (error) {
      console.error("Get team error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// ADD TEAM MEMBER
// Creates a new user account and assigns them to the company.
// Only admin can do this.
// ================================
router.post(
  "/",
  verifyToken,
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Make sure the admin belongs to a company
      if (!req.user!.companyId) {
        res.status(400).json({
          message: "You must be associated with a company to add team members.",
        });
        return;
      }

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        res.status(400).json({ message: "All fields are required." });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters." });
        return;
      }

      // Check if email is already taken
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({ message: "Email already in use." });
        return;
      }

      // Only allow manager and staff roles
      // (Admin creates the company, there should be only one admin)
      if (!["manager", "staff"].includes(role)) {
        res.status(400).json({
          message: "Team members can only be manager or staff.",
        });
        return;
      }

      const newMember = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        companyId: req.user!.companyId,
      });

      await newMember.save();

      res.status(201).json({
        message: "Team member added!",
        member: {
          id: newMember._id,
          email: newMember.email,
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          role: newMember.role,
        },
      });
    } catch (error) {
      console.error("Add team member error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE TEAM MEMBER ROLE
// ================================
router.patch(
  "/:id/role",
  verifyToken,
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.body;

      if (!["manager", "staff"].includes(role)) {
        res.status(400).json({ message: "Invalid role." });
        return;
      }

      const member = await User.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!member) {
        res.status(404).json({ message: "Team member not found." });
        return;
      }

      member.role = role;
      await member.save();

      res.json({ message: "Role updated!" });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// DEACTIVATE TEAM MEMBER
// ================================
router.patch(
  "/:id/deactivate",
  verifyToken,
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const member = await User.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!member) {
        res.status(404).json({ message: "Team member not found." });
        return;
      }

      // Prevent admin from deactivating themselves
      if (member._id.toString() === req.user!._id.toString()) {
        res.status(400).json({ message: "You can't deactivate yourself." });
        return;
      }

      member.isActive = !member.isActive;
      await member.save();

      res.json({
        message: member.isActive ? "Member activated!" : "Member deactivated!",
      });
    } catch (error) {
      console.error("Deactivate member error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
