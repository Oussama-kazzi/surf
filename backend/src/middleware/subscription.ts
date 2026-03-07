// ================================
// SUBSCRIPTION MIDDLEWARE
// Checks if the company has an active subscription.
//
// WHY WE NEED THIS:
// If a company's subscription has expired, we want to block
// certain actions (like creating new bookings).
// But we still let them VIEW their dashboard and data.
//
// HOW IT WORKS:
// 1. Get the user's company
// 2. Check the subscription status
// 3. If expired or canceled → block the action
// 4. If active or trial → allow the action
// ================================

import { Response, NextFunction } from "express";
import Company from "../models/Company";
import Subscription from "../models/Subscription";
import { AuthRequest } from "./auth";

// ================================
// REQUIRE ACTIVE SUBSCRIPTION
// Use this middleware on routes that should only work
// when the company has a valid (active or trial) subscription.
//
// Example usage:
//   router.post("/", requireActiveSubscription, async (req, res) => { ... })
// ================================
export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    // Super admins bypass subscription checks
    // They manage the platform, so they don't need a subscription
    if (!user || user.role === "super_admin") {
      next();
      return;
    }

    // If the user doesn't belong to a company, skip this check
    if (!user.companyId) {
      next();
      return;
    }

    // Find the company
    const company = await Company.findById(user.companyId);

    if (!company) {
      res.status(404).json({ message: "Company not found." });
      return;
    }

    // Check the subscription status from the company's quick-access field
    const subStatus = company.subscription?.status;

    // Also check against the actual Subscription document
    // (in case it wasn't updated via the quick-access field)
    const subscription = await Subscription.findOne({
      companyId: company._id,
      status: { $in: ["active", "trial"] },
    }).sort({ createdAt: -1 });

    // If there IS an active subscription, check if it's still valid
    if (subscription) {
      const now = new Date();

      // If the billing date has passed, mark it as expired
      if (now > subscription.nextBillingDate) {
        subscription.status = "expired";
        await subscription.save();

        // Update company's quick-access field too
        company.subscription.status = "expired";
        await company.save();

        // Block the action
        res.status(403).json({
          message: "Your subscription has expired. Please renew to continue.",
          subscriptionExpired: true,
        });
        return;
      }

      // Subscription is still valid, allow the action
      next();
      return;
    }

    // If the company's quick-access status says active/trial but no Subscription doc found,
    // still allow (for backward compatibility with existing data)
    if (subStatus === "active" || subStatus === "trial") {
      next();
      return;
    }

    // No active subscription found — block the action
    res.status(403).json({
      message: "Your subscription has expired. Please renew to continue.",
      subscriptionExpired: true,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "Something went wrong checking subscription." });
  }
};
