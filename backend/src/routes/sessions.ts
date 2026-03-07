// ================================
// SESSION ROUTES
// Manage time slots for activities.
// Public: GET sessions for an activity on a date
// Dashboard: full CRUD (admin/manager only)
// ================================

import express, { Response } from "express";
import Session from "../models/Session";
import Activity from "../models/Activity";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ================================
// GET SESSIONS (PUBLIC)
// Filter by activityId, date, or companyId.
// Used on the booking page to show available time slots.
// ================================
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { activityId, date, companyId } = req.query;

    const filter: any = {};
    if (activityId) filter.activityId = activityId;
    if (companyId) filter.companyId = companyId;
    if (date) {
      // Match the entire day (start of day to end of day)
      const dayStart = new Date(date as string);
      const dayEnd = new Date(date as string);
      dayEnd.setDate(dayEnd.getDate() + 1);
      filter.date = { $gte: dayStart, $lt: dayEnd };
    }

    const sessions = await Session.find(filter)
      .populate("activityId", "name price duration capacity")
      .sort({ date: 1, startTime: 1 });

    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET SESSIONS FOR DASHBOARD
// Returns all sessions for the logged-in user's company.
// ================================
router.get(
  "/mine",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { activityId, startDate, endDate } = req.query;

      const filter: any = { companyId: req.user!.companyId };
      if (activityId) filter.activityId = activityId;

      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }

      const sessions = await Session.find(filter)
        .populate("activityId", "name price duration capacity")
        .sort({ date: 1, startTime: 1 });

      res.json({ sessions });
    } catch (error) {
      console.error("Get my sessions error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// CREATE SESSION
// Creates a new time slot for an activity.
// ================================
router.post(
  "/",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { activityId, date, startTime, endTime, capacity } = req.body;

      if (!activityId || !date || !startTime || !endTime) {
        res.status(400).json({
          message: "Activity, date, start time, and end time are required.",
        });
        return;
      }

      // Verify the activity exists and belongs to this company
      const activity = await Activity.findOne({
        _id: activityId,
        companyId: req.user!.companyId,
      });

      if (!activity) {
        res.status(404).json({ message: "Activity not found." });
        return;
      }

      const session = new Session({
        activityId,
        companyId: req.user!.companyId,
        date: new Date(date),
        startTime,
        endTime,
        // Use provided capacity or fall back to the activity's default
        capacity: capacity || activity.capacity,
        bookedCount: 0,
      });

      await session.save();

      res.status(201).json({ message: "Session created!", session });
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE SESSION
// ================================
router.patch(
  "/:id",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const session = await Session.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!session) {
        res.status(404).json({ message: "Session not found." });
        return;
      }

      const { date, startTime, endTime, capacity } = req.body;

      if (date !== undefined) session.date = new Date(date);
      if (startTime !== undefined) session.startTime = startTime;
      if (endTime !== undefined) session.endTime = endTime;
      if (capacity !== undefined) session.capacity = capacity;

      await session.save();

      res.json({ message: "Session updated!", session });
    } catch (error) {
      console.error("Update session error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// DELETE SESSION
// ================================
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const session = await Session.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!session) {
        res.status(404).json({ message: "Session not found." });
        return;
      }

      await Session.deleteOne({ _id: session._id });

      res.json({ message: "Session deleted." });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
