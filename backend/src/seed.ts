// ================================
// SEED SCRIPT
// Run this to create the first super admin account.
// Usage: npx ts-node src/seed.ts
//
// This creates:
// 1. A super admin user (platform owner)
// 2. A sample surf company
// 3. Sample rooms and packages
// ================================

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User";
import Company from "./models/Company";
import Room from "./models/Room";
import Package from "./models/Package";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/surf-booking";

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ================================
    // CREATE SUPER ADMIN
    // This is YOUR account (the platform owner)
    // ================================
    const existingAdmin = await User.findOne({ role: "super_admin" });

    if (!existingAdmin) {
      const superAdmin = new User({
        email: "admin@surfbooking.com",
        password: "admin123", // Change this in production!
        firstName: "Platform",
        lastName: "Admin",
        role: "super_admin",
      });
      await superAdmin.save();
      console.log("✅ Super admin created: admin@surfbooking.com / admin123");
    } else {
      console.log("ℹ️  Super admin already exists");
    }

    // ================================
    // CREATE SAMPLE COMPANY
    // ================================
    let company = await Company.findOne({ slug: "bali-surf-camp" });

    if (!company) {
      // First create the company owner
      const owner = new User({
        email: "owner@balisurfcamp.com",
        password: "owner123", // Change this in production!
        firstName: "John",
        lastName: "Surfer",
        role: "admin",
      });
      await owner.save();

      company = new Company({
        name: "Bali Surf Camp",
        slug: "bali-surf-camp",
        description:
          "The best surf camp in Bali! Learn to surf with our experienced instructors.",
        email: "info@balisurfcamp.com",
        phone: "+62 812 3456 789",
        address: "Jl. Pantai Kuta No. 1",
        city: "Kuta",
        country: "Indonesia",
        website: "https://balisurfcamp.com",
        ownerId: owner._id as any,
      });
      await company.save();

      // Link owner to company
      owner.companyId = company._id as any;
      await owner.save();

      console.log("✅ Sample company created: Bali Surf Camp");
      console.log("   Owner: owner@balisurfcamp.com / owner123");

      // ================================
      // CREATE SAMPLE ROOMS
      // ================================
      const rooms = [
        {
          companyId: company._id,
          name: "Ocean View Single",
          description: "Cozy single room with ocean view",
          type: "single",
          capacity: 1,
          pricePerNight: 5000, // $50
          amenities: ["wifi", "ac", "ocean-view"],
        },
        {
          companyId: company._id,
          name: "Beach Double Room",
          description: "Spacious double room steps from the beach",
          type: "double",
          capacity: 2,
          pricePerNight: 8000, // $80
          amenities: ["wifi", "ac", "ocean-view", "balcony"],
        },
        {
          companyId: company._id,
          name: "Surfer Suite",
          description: "Premium suite with board storage and private bathroom",
          type: "suite",
          capacity: 3,
          pricePerNight: 15000, // $150
          amenities: ["wifi", "ac", "ocean-view", "balcony", "board-storage", "private-bath"],
        },
        {
          companyId: company._id,
          name: "Backpacker Dorm",
          description: "Budget-friendly shared dorm for solo travelers",
          type: "dorm",
          capacity: 6,
          pricePerNight: 2000, // $20
          amenities: ["wifi", "shared-bath"],
        },
        {
          companyId: company._id,
          name: "Tropical Bungalow",
          description: "Private bungalow surrounded by tropical gardens",
          type: "bungalow",
          capacity: 4,
          pricePerNight: 20000, // $200
          amenities: ["wifi", "ac", "ocean-view", "kitchen", "private-pool"],
        },
      ];

      await Room.insertMany(rooms);
      console.log("✅ Sample rooms created (5 rooms)");

      // ================================
      // CREATE SAMPLE PACKAGES
      // ================================
      const packages = [
        {
          companyId: company._id,
          name: "Beginner Surf Week",
          description:
            "Perfect for first-timers! 7 days of surf lessons with expert instructors.",
          durationDays: 7,
          pricePerPerson: 35000, // $350
          includes: [
            "Daily surf lessons",
            "Board rental",
            "Rash guard",
            "Breakfast",
            "Airport transfer",
          ],
          maxParticipants: 8,
          difficulty: "beginner",
        },
        {
          companyId: company._id,
          name: "Weekend Surf Getaway",
          description: "Quick weekend escape with surf sessions both days.",
          durationDays: 3,
          pricePerPerson: 15000, // $150
          includes: [
            "2 surf lessons",
            "Board rental",
            "Breakfast",
          ],
          maxParticipants: 10,
          difficulty: "all-levels",
        },
        {
          companyId: company._id,
          name: "Advanced Surf Camp",
          description:
            "10-day intensive program for intermediate to advanced surfers.",
          durationDays: 10,
          pricePerPerson: 60000, // $600
          includes: [
            "Daily coaching",
            "Video analysis",
            "Board rental",
            "All meals",
            "Yoga sessions",
            "Airport transfer",
          ],
          maxParticipants: 6,
          difficulty: "advanced",
        },
        {
          companyId: company._id,
          name: "Surf & Stay (No Lessons)",
          description: "Just need a room near the beach? This is for you.",
          durationDays: 1,
          pricePerPerson: 0, // Free — room only
          includes: ["Breakfast"],
          maxParticipants: 20,
          difficulty: "all-levels",
        },
      ];

      await Package.insertMany(packages);
      console.log("✅ Sample packages created (4 packages)");
    } else {
      console.log("ℹ️  Sample company already exists");
    }

    console.log("\n🎉 Seed completed! You can now start the server.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
