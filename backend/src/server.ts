// ================================
// MAIN SERVER FILE
// This is where our Express server starts.
// It connects to MongoDB and sets up all routes.
// ================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import all route files
import authRoutes from "./routes/auth";
import companyRoutes from "./routes/companies";
import roomRoutes from "./routes/rooms";
import packageRoutes from "./routes/packages";
import bookingRoutes from "./routes/bookings";
import customerRoutes from "./routes/customers";
import teamRoutes from "./routes/team";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";
import subscriptionRoutes from "./routes/subscriptions";
import activityRoutes from "./routes/activities";
import sessionRoutes from "./routes/sessions";
import invoiceRoutes from "./routes/invoices";

// Load environment variables from .env file
dotenv.config();

// Create the Express app
const app = express();

// ================================
// MIDDLEWARE
// Middleware runs before every request.
// ================================

// Allow requests from our frontend (CORS)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Parse JSON request bodies (so we can read req.body)
app.use(express.json());

// ================================
// ROUTES
// Each route file handles a group of related endpoints.
// For example, /api/auth handles login and register.
// ================================

app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/invoices", invoiceRoutes);

// Simple health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Surf Booking API is running!" });
});

// ================================
// DATABASE CONNECTION + SERVER START
// We connect to MongoDB first, then start the server.
// ================================

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/surf-booking";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    // Start the server only after DB is connected
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
