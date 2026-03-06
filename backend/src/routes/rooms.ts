// ================================
// ROOM ROUTES
// CRUD operations for rooms.
// Rooms belong to a specific company.
// ================================

import express, { Response } from "express";
import Room from "../models/Room";
import Booking from "../models/Booking";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ================================
// GET AVAILABLE ROOMS (PUBLIC)
// This is the ROOM AVAILABILITY ALGORITHM.
// Given a company slug, check-in date, and check-out date,
// returns rooms that are NOT booked during that period.
// ================================
router.get("/available", async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, checkIn, checkOut } = req.query;

    // Validate required parameters
    if (!companyId || !checkIn || !checkOut) {
      res.status(400).json({
        message: "companyId, checkIn, and checkOut are required.",
      });
      return;
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    // Make sure check-in is before check-out
    if (checkInDate >= checkOutDate) {
      res.status(400).json({
        message: "Check-in date must be before check-out date.",
      });
      return;
    }

    // Make sure dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400).json({
        message: "Check-in date cannot be in the past.",
      });
      return;
    }

    // ================================
    // AVAILABILITY ALGORITHM
    // Step 1: Get all active rooms for this company
    // Step 2: Find all bookings that overlap with the requested dates
    // Step 3: Exclude rooms that have overlapping bookings
    //
    // Two date ranges overlap if:
    //   existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn
    //
    // Example:
    //   Existing booking: Jan 5 - Jan 10
    //   Requested dates:  Jan 8 - Jan 12
    //   These OVERLAP because Jan 5 < Jan 12 AND Jan 10 > Jan 8
    //
    //   Existing booking: Jan 5 - Jan 10
    //   Requested dates:  Jan 10 - Jan 15
    //   These DO NOT overlap because Jan 10 is check-out day (room is free)
    // ================================

    // Step 1: Get all active rooms for this company
    const allRooms = await Room.find({
      companyId: companyId,
      isActive: true,
    });

    // Step 2: Find bookings that overlap with requested dates
    // We exclude cancelled bookings (those rooms are available)
    const overlappingBookings = await Booking.find({
      companyId: companyId,
      status: { $ne: "cancelled" }, // Not cancelled
      // Date overlap check:
      checkIn: { $lt: checkOutDate },   // Existing check-in is before requested check-out
      checkOut: { $gt: checkInDate },   // Existing check-out is after requested check-in
    });

    // Step 3: Get the IDs of rooms that are already booked
    const bookedRoomIds = overlappingBookings.map((booking) =>
      booking.roomId.toString()
    );

    // Step 4: Filter out booked rooms
    const availableRooms = allRooms.filter(
      (room) => !bookedRoomIds.includes(room._id.toString())
    );

    res.json({ rooms: availableRooms });
  } catch (error) {
    console.error("Get available rooms error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET ALL ROOMS FOR MY COMPANY (DASHBOARD)
// Returns all rooms for the logged-in user's company.
// ================================
router.get(
  "/",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;

      const rooms = await Room.find({ companyId }).sort({ createdAt: -1 });

      res.json({ rooms });
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// GET SINGLE ROOM
// ================================
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404).json({ message: "Room not found." });
      return;
    }

    res.json({ room });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// CREATE ROOM
// Only admin and manager can create rooms.
// ================================
router.post(
  "/",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, type, capacity, pricePerNight, amenities, images } =
        req.body;

      const room = new Room({
        companyId: req.user!.companyId,
        name,
        description,
        type,
        capacity,
        pricePerNight,
        amenities: amenities || [],
        images: images || [],
      });

      await room.save();

      res.status(201).json({ message: "Room created!", room });
    } catch (error) {
      console.error("Create room error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE ROOM
// Only admin and manager can update rooms.
// ================================
router.put(
  "/:id",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await Room.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!room) {
        res.status(404).json({ message: "Room not found." });
        return;
      }

      // Update the room with provided fields
      const updates = req.body;
      Object.keys(updates).forEach((key) => {
        (room as any)[key] = updates[key];
      });

      await room.save();

      res.json({ message: "Room updated!", room });
    } catch (error) {
      console.error("Update room error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// DELETE ROOM (soft delete)
// Sets isActive to false instead of actually deleting.
// ================================
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await Room.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!room) {
        res.status(404).json({ message: "Room not found." });
        return;
      }

      room.isActive = false;
      await room.save();

      res.json({ message: "Room deleted." });
    } catch (error) {
      console.error("Delete room error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
