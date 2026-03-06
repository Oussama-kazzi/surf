// ================================
// AUTH MIDDLEWARE
// This middleware checks if the user is logged in.
// It verifies the JWT token sent in the request header.
// ================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

// Extend Express Request to include our user
// This way we can access req.user in our routes
export interface AuthRequest extends Request {
  user?: IUser;
}

// ================================
// VERIFY TOKEN MIDDLEWARE
// Used on routes that require authentication.
// It checks the Authorization header for a valid JWT token.
// ================================
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the token from the Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided. Please log in." });
      return;
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(" ")[1];

    // Verify the token using our secret
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as { userId: string };

    // Find the user in the database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({ message: "User not found. Token is invalid." });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ message: "Account is deactivated." });
      return;
    }

    // Attach the user to the request so routes can use it
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ================================
// ROLE CHECK MIDDLEWARE
// Used to restrict routes to specific roles.
// Example: requireRole("admin", "manager")
// ================================
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if user exists (verifyToken should be called first)
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    // Check if the user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: "You don't have permission to do this.",
      });
      return;
    }

    next();
  };
};

// ================================
// COMPANY CHECK MIDDLEWARE
// Makes sure the user belongs to a specific company.
// This prevents users from accessing other companies' data.
// ================================
export const requireCompany = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Super admin can access any company
  if (req.user.role === "super_admin") {
    next();
    return;
  }

  // Regular users must belong to a company
  if (!req.user.companyId) {
    res.status(403).json({ message: "You are not assigned to any company." });
    return;
  }

  next();
};
