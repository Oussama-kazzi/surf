// ================================
// AUTH ROUTES
// Handles user registration and login.
// POST /api/auth/register - Create a new account
// POST /api/auth/login    - Log in and get a JWT token
// GET  /api/auth/me       - Get current logged-in user
// ================================

import express, { Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Company from "../models/Company";
import { verifyToken, AuthRequest } from "../middleware/auth";
import { generateSlug } from "../utils/helpers";

const router = express.Router();

// ================================
// REGISTER
// Creates a new user account.
// If the user is a company owner, also creates their company.
// ================================
router.post("/register", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Check if email is already taken
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: "Email already registered." });
      return;
    }

    // Create the user with "admin" role (company owner)
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: "admin", // The person registering is always the company admin
    });

    await user.save();

    // If they provided a company name, create the company too
    if (companyName) {
      const company = new Company({
        name: companyName,
        slug: generateSlug(companyName),
        email: email,
        ownerId: user._id,
      });

      await company.save();

      // Link the user to the company
      user.companyId = company._id as any;
      await user.save();
    }

    // Create a JWT token for the new user
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Send back the token and user info (without password)
    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Something went wrong. Try again." });
  }
});

// ================================
// LOGIN
// Checks email and password, returns a JWT token.
// ================================
router.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(400).json({ message: "Invalid email or password." });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(400).json({ message: "Account is deactivated." });
      return;
    }

    // Compare the provided password with the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid email or password." });
      return;
    }

    // Create a JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong. Try again." });
  }
});

// ================================
// GET CURRENT USER
// Returns the currently logged-in user's info.
// Requires authentication (verifyToken middleware).
// ================================
router.get("/me", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // req.user is set by the verifyToken middleware
    const user = req.user;

    res.json({
      user: {
        id: user!._id,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        role: user!.role,
        companyId: user!.companyId,
      },
    });
  } catch (error: any) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

export default router;
