// ================================
// INVOICE ROUTES
// Handles invoice generation, retrieval, and PDF download.
//
// POST /api/invoices/generate   — Generate invoice after booking
// GET  /api/invoices/:bookingId — Get invoice by booking ID
// GET  /api/invoices/:id/pdf    — Download invoice as PDF
// ================================

import express, { Response } from "express";
import PDFDocument from "pdfkit";
import Invoice from "../models/Invoice";
import Booking from "../models/Booking";
import Company from "../models/Company";
import Room from "../models/Room";
import Package from "../models/Package";
import Activity from "../models/Activity";
import Session from "../models/Session";
import Customer from "../models/Customer";

const router = express.Router();

// ================================
// HELPER: Format cents to dollar string
// 15000 → "$150.00"
// ================================
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ================================
// GENERATE INVOICE (PUBLIC — called after booking)
// Creates an invoice from a booking ID + payment method.
// ================================
router.post("/generate", async (req: express.Request, res: Response) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      res.status(400).json({ message: "bookingId and paymentMethod are required." });
      return;
    }

    // Check if invoice already exists for this booking
    const existing = await Invoice.findOne({ bookingId });
    if (existing) {
      res.json({ message: "Invoice already exists.", invoice: existing });
      return;
    }

    // Load the booking with all related data
    const booking = await Booking.findById(bookingId)
      .populate("companyId")
      .populate("customerId")
      .populate("roomId")
      .populate("packageId");

    if (!booking) {
      res.status(404).json({ message: "Booking not found." });
      return;
    }

    const company = booking.companyId as any;
    const customer = booking.customerId as any;
    const room = booking.roomId as any;
    const pkg = booking.packageId as any;

    // Build sessions snapshot (activity name + date + time)
    const sessionsSnapshot: { activityName: string; date: string; time: string }[] = [];

    if (booking.activities && booking.activities.length > 0) {
      for (const act of booking.activities) {
        const activity = await Activity.findById(act.activityId);
        const session = await Session.findById(act.sessionId);
        if (activity && session) {
          sessionsSnapshot.push({
            activityName: activity.name,
            date: session.date.toISOString().split("T")[0],
            time: `${session.startTime} – ${session.endTime}`,
          });
        }
      }
    }

    // Build price breakdown
    const priceBreakdown = {
      roomName: room.name,
      roomPricePerNight: room.pricePerNight,
      numberOfNights: booking.numberOfNights,
      roomTotal: booking.roomTotal,
      packageName: pkg?.name || null,
      packagePricePerPerson: pkg?.pricePerPerson || 0,
      numberOfGuests: booking.numberOfGuests,
      packageTotal: booking.packageTotal,
      activities: [] as { name: string; price: number }[],
      activitiesTotal: booking.activitiesTotal,
    };

    // Resolve activity names for the breakdown
    if (booking.activities && booking.activities.length > 0) {
      for (const act of booking.activities) {
        const activity = await Activity.findById(act.activityId);
        if (activity) {
          priceBreakdown.activities.push({
            name: activity.name,
            price: act.price,
          });
        }
      }
    }

    // Generate the invoice number (INV-0001, INV-0002, ...)
    const invoiceNumber = await (Invoice as any).generateInvoiceNumber();

    // Determine payment status based on method
    const paymentStatus = paymentMethod === "pay_on_arrival" ? "unpaid" : "paid";

    // Create the invoice
    const invoice = new Invoice({
      invoiceNumber,
      bookingId: booking._id,
      companyId: company._id,
      companyName: company.name,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      roomName: room.name,
      packageName: pkg?.name || null,
      sessions: sessionsSnapshot,
      numberOfNights: booking.numberOfNights,
      numberOfGuests: booking.numberOfGuests,
      priceBreakdown,
      totalAmount: booking.totalPrice,
      paymentMethod,
      paymentStatus,
      bookingDate: booking.createdAt,
    });

    await invoice.save();

    res.status(201).json({
      message: "Invoice generated successfully!",
      invoice,
    });
  } catch (error) {
    console.error("Generate invoice error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET INVOICE BY BOOKING ID (PUBLIC)
// Used on the confirmation page to display invoice details.
// ================================
router.get("/:bookingId", async (req: express.Request, res: Response) => {
  try {
    const invoice = await Invoice.findOne({ bookingId: req.params.bookingId });

    if (!invoice) {
      res.status(404).json({ message: "Invoice not found." });
      return;
    }

    res.json({ invoice });
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// DOWNLOAD INVOICE PDF
// Generates a PDF on the fly and streams it to the client.
// ================================
router.get("/:id/pdf", async (req: express.Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({ message: "Invoice not found." });
      return;
    }

    // Create PDF document
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // ================================
    // PDF CONTENT
    // ================================

    // --- Header ---
    doc
      .fontSize(24)
      .fillColor("#0369a1")
      .text("INVOICE", 50, 50);

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(invoice.invoiceNumber, 50, 80);

    // --- Company info (top right) ---
    doc
      .fontSize(14)
      .fillColor("#111827")
      .text(invoice.companyName, 350, 50, { align: "right" });

    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(`Date: ${invoice.bookingDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 350, 70, { align: "right" });

    // --- Divider ---
    doc
      .moveTo(50, 110)
      .lineTo(545, 110)
      .strokeColor("#e5e7eb")
      .stroke();

    // --- Bill To ---
    let y = 130;
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("BILL TO", 50, y);

    y += 18;
    doc
      .fontSize(11)
      .fillColor("#111827")
      .text(invoice.customerName, 50, y);

    y += 16;
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(invoice.customerEmail, 50, y);

    // --- Invoice details (right column) ---
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("INVOICE DETAILS", 350, 130);

    doc.fontSize(9).fillColor("#374151");
    doc.text(`Payment Method: ${invoice.paymentMethod.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, 350, 148);
    doc.text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`, 350, 162);
    doc.text(`Guests: ${invoice.numberOfGuests}`, 350, 176);
    doc.text(`Nights: ${invoice.numberOfNights}`, 350, 190);

    // --- Table Header ---
    y = 230;
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#0369a1")
      .lineWidth(1)
      .stroke();

    y += 8;
    doc.fontSize(9).fillColor("#0369a1");
    doc.text("ITEM", 50, y);
    doc.text("DETAILS", 250, y);
    doc.text("AMOUNT", 460, y, { align: "right" });

    y += 16;
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .stroke();

    // --- Room row ---
    y += 10;
    doc.fontSize(10).fillColor("#111827");
    doc.text("Room", 50, y);
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        `${invoice.priceBreakdown.roomName} — ${invoice.priceBreakdown.numberOfNights} night${invoice.priceBreakdown.numberOfNights !== 1 ? "s" : ""} × ${formatPrice(invoice.priceBreakdown.roomPricePerNight)}/night`,
        250,
        y
      );
    doc
      .fontSize(10)
      .fillColor("#111827")
      .text(formatPrice(invoice.priceBreakdown.roomTotal), 460, y, { align: "right" });

    // --- Package row ---
    if (invoice.priceBreakdown.packageName) {
      y += 24;
      doc
        .moveTo(50, y - 4)
        .lineTo(545, y - 4)
        .strokeColor("#f3f4f6")
        .stroke();

      doc.fontSize(10).fillColor("#111827");
      doc.text("Package", 50, y);
      doc
        .fontSize(9)
        .fillColor("#6b7280")
        .text(
          `${invoice.priceBreakdown.packageName} — ${invoice.priceBreakdown.numberOfGuests} guest${invoice.priceBreakdown.numberOfGuests !== 1 ? "s" : ""} × ${formatPrice(invoice.priceBreakdown.packagePricePerPerson || 0)}/person`,
          250,
          y
        );
      doc
        .fontSize(10)
        .fillColor("#111827")
        .text(formatPrice(invoice.priceBreakdown.packageTotal), 460, y, { align: "right" });
    }

    // --- Activity rows ---
    if (invoice.priceBreakdown.activities.length > 0) {
      for (const act of invoice.priceBreakdown.activities) {
        y += 24;
        doc
          .moveTo(50, y - 4)
          .lineTo(545, y - 4)
          .strokeColor("#f3f4f6")
          .stroke();

        doc.fontSize(10).fillColor("#111827");
        doc.text("Activity", 50, y);
        doc.fontSize(9).fillColor("#6b7280").text(act.name, 250, y);
        doc
          .fontSize(10)
          .fillColor("#111827")
          .text(formatPrice(act.price), 460, y, { align: "right" });
      }
    }

    // --- Sessions ---
    if (invoice.sessions.length > 0) {
      y += 30;
      doc.fontSize(9).fillColor("#6b7280").text("SESSIONS", 50, y);
      for (const sess of invoice.sessions) {
        y += 16;
        doc
          .fontSize(9)
          .fillColor("#374151")
          .text(`• ${sess.activityName} — ${sess.date} ${sess.time}`, 60, y);
      }
    }

    // --- Total ---
    y += 36;
    doc
      .moveTo(350, y)
      .lineTo(545, y)
      .strokeColor("#0369a1")
      .lineWidth(1)
      .stroke();

    y += 12;
    doc.fontSize(14).fillColor("#0369a1").text("TOTAL", 350, y);
    doc
      .fontSize(14)
      .fillColor("#0369a1")
      .text(formatPrice(invoice.totalAmount), 460, y, { align: "right" });

    // --- Footer ---
    const footerY = 750;
    doc
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(
        `Generated by SurfBook • ${invoice.invoiceNumber}`,
        50,
        footerY + 10,
        { align: "center" }
      );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

export default router;
