// ================================
// BOOKING ROUTES
// The most important routes in the system!
// Handles creating bookings, checking availability,
// and managing existing bookings.
// ================================

import express, { Response } from "express";
import Booking from "../models/Booking";
import Room from "../models/Room";
import Package from "../models/Package";
import Customer from "../models/Customer";
import Company from "../models/Company";
import Activity from "../models/Activity";
import Session from "../models/Session";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";
import { requireActiveSubscription } from "../middleware/subscription";
import { calculateNights, calculateBookingPrice } from "../utils/helpers";

const router = express.Router();

// ================================
// CREATE BOOKING (PUBLIC)
// This is the main booking endpoint.
// Called when a customer fills out the booking form.
//
// FLOW:
// 1. Create or find the customer
// 2. Verify the room is still available
// 3. Calculate the price
// 4. Create the booking
//
// NOTE: We check if the company's subscription is active.
// If expired, the booking is blocked and the customer sees an error.
// ================================
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyId,
      roomId,
      packageId,
      checkIn,
      checkOut,
      numberOfGuests,
      // Customer info
      firstName,
      lastName,
      email,
      phone,
      notes,
      // Activities (optional array of { activityId, sessionId })
      activities,
    } = req.body;

    // ================================
    // STEP 0: Check company subscription
    // If the company's subscription is expired, block booking creation.
    // This protects the platform — only paying companies can receive bookings.
    // ================================
    const company = await Company.findById(companyId);
    if (!company || !company.isActive) {
      res.status(404).json({ message: "Company not found or inactive." });
      return;
    }

    const subStatus = company.subscription?.status;
    if (subStatus === "expired" || subStatus === "canceled") {
      res.status(403).json({
        message: "This company's booking system is temporarily unavailable. Please contact them directly.",
      });
      return;
    }

    // ================================
    // STEP 1: Validate dates
    // ================================
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      res.status(400).json({
        message: "Check-in must be before check-out.",
      });
      return;
    }

    const numberOfNights = calculateNights(checkInDate, checkOutDate);

    // ================================
    // STEP 2: Check if room exists and is active
    // ================================
    const room = await Room.findOne({
      _id: roomId,
      companyId: companyId,
      isActive: true,
    });

    if (!room) {
      res.status(404).json({ message: "Room not found." });
      return;
    }

    // Check if number of guests fits the room
    if (numberOfGuests > room.capacity) {
      res.status(400).json({
        message: `This room fits max ${room.capacity} guests. You requested ${numberOfGuests}.`,
      });
      return;
    }

    // ================================
    // STEP 3: DOUBLE-BOOKING PREVENTION
    // Check if the room is available for the requested dates.
    // This is CRITICAL — we must prevent two people from booking
    // the same room for overlapping dates.
    // ================================
    const existingBooking = await Booking.findOne({
      roomId: roomId,
      status: { $ne: "cancelled" },
      // Date overlap check (same logic as in rooms route)
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (existingBooking) {
      res.status(400).json({
        message: "Sorry, this room is already booked for those dates.",
      });
      return;
    }

    // ================================
    // STEP 4: Get package price (if a package was selected)
    // ================================
    let packagePricePerPerson = 0;

    if (packageId) {
      const pkg = await Package.findOne({
        _id: packageId,
        companyId: companyId,
        isActive: true,
      });

      if (!pkg) {
        res.status(404).json({ message: "Package not found." });
        return;
      }

      packagePricePerPerson = pkg.pricePerPerson;
    }

    // ================================
    // STEP 5: Calculate total price
    // ================================
    const { roomTotal, packageTotal, totalPrice: baseTotalPrice } = calculateBookingPrice(
      room.pricePerNight,
      numberOfNights,
      packagePricePerPerson,
      numberOfGuests
    );

    // ================================
    // STEP 5b: Validate & price activities
    // If the customer selected activities+sessions, validate them
    // and accumulate their prices.
    // ================================
    let activitiesTotal = 0;
    const bookingActivities: { activityId: string; sessionId: string; price: number }[] = [];

    if (activities && Array.isArray(activities) && activities.length > 0) {
      for (const act of activities) {
        const { activityId, sessionId } = act;

        // Verify the activity belongs to this company
        const activity = await Activity.findOne({
          _id: activityId,
          companyId,
          isActive: true,
        });
        if (!activity) {
          res.status(404).json({ message: `Activity ${activityId} not found.` });
          return;
        }

        // Verify the session exists, belongs to the activity, and has capacity
        const session = await Session.findOne({
          _id: sessionId,
          activityId,
          companyId,
        });
        if (!session) {
          res.status(404).json({ message: `Session ${sessionId} not found.` });
          return;
        }

        if (session.bookedCount >= session.capacity) {
          res.status(400).json({
            message: `Session for "${activity.name}" on ${session.date.toISOString().split("T")[0]} at ${session.startTime} is fully booked.`,
          });
          return;
        }

        bookingActivities.push({
          activityId,
          sessionId,
          price: activity.price,
        });
        activitiesTotal += activity.price;
      }
    }

    const totalPrice = baseTotalPrice + activitiesTotal;

    // ================================
    // STEP 6: Create or find the customer
    // If a customer with this email already exists for this company,
    // we reuse their record. Otherwise, we create a new one.
    // ================================
    let customer = await Customer.findOne({
      email: email.toLowerCase(),
      companyId: companyId,
    });

    if (!customer) {
      customer = new Customer({
        companyId,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
      });
      await customer.save();
    }

    // ================================
    // STEP 7: Create the booking
    // ================================
    const booking = new Booking({
      companyId,
      customerId: customer._id,
      roomId,
      packageId: packageId || null,
      activities: bookingActivities,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfGuests,
      numberOfNights,
      roomTotal,
      packageTotal,
      activitiesTotal,
      totalPrice,
      status: "pending",
      paymentStatus: "unpaid",
      notes,
    });

    await booking.save();

    // ================================
    // STEP 7b: Increment bookedCount on sessions
    // Now that the booking is saved, mark those session seats as taken.
    // ================================
    for (const act of bookingActivities) {
      await Session.updateOne(
        { _id: act.sessionId },
        { $inc: { bookedCount: 1 } }
      );
    }

    res.status(201).json({
      message: "Booking created successfully!",
      booking,
      priceBreakdown: {
        roomTotal,
        packageTotal,
        activitiesTotal,
        totalPrice,
        numberOfNights,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET ALL BOOKINGS FOR MY COMPANY (DASHBOARD)
// Supports filtering by status and date range.
// ================================
router.get(
  "/",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.companyId;
      const { status, startDate, endDate } = req.query;

      // Build the filter query
      const filter: any = { companyId };

      // Filter by status if provided
      if (status) {
        filter.status = status;
      }

      // Filter by date range if provided
      if (startDate || endDate) {
        filter.checkIn = {};
        if (startDate) filter.checkIn.$gte = new Date(startDate as string);
        if (endDate) filter.checkIn.$lte = new Date(endDate as string);
      }

      const bookings = await Booking.find(filter)
        .populate("customerId", "firstName lastName email phone")
        .populate("roomId", "name type pricePerNight")
        .populate("packageId", "name pricePerPerson")
        .sort({ createdAt: -1 }); // Newest first

      res.json({ bookings });
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// GET SINGLE BOOKING
// ================================
router.get(
  "/:id",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      })
        .populate("customerId")
        .populate("roomId")
        .populate("packageId");

      if (!booking) {
        res.status(404).json({ message: "Booking not found." });
        return;
      }

      res.json({ booking });
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE BOOKING STATUS
// Used to confirm, cancel, or complete a booking.
// ================================
router.patch(
  "/:id/status",
  verifyToken,
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;

      const booking = await Booking.findOne({
        _id: req.params.id,
        companyId: req.user!.companyId,
      });

      if (!booking) {
        res.status(404).json({ message: "Booking not found." });
        return;
      }

      booking.status = status;
      await booking.save();

      res.json({ message: `Booking ${status}!`, booking });
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
