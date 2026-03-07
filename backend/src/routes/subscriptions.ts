// ================================
// SUBSCRIPTION ROUTES
// Handles everything related to subscriptions:
// - Get available plans
// - Get my company's current subscription
// - Subscribe to a plan (create/update subscription)
// - Cancel subscription
// - Renew an expired subscription
//
// HOW SUBSCRIPTIONS WORK:
// 1. Company registers -> gets a 15-day free trial on "basic" plan
// 2. Before trial ends, they pick a plan and "pay" (simulated)
// 3. Subscription is active for 30 days from payment
// 4. If nextBillingDate passes -> status becomes "expired"
// 5. Expired companies can't create new bookings
// 6. They must renew to keep using the platform
// ================================

import express, { Response } from "express";
import Subscription, {
  SUBSCRIPTION_PLANS,
  PlanType,
} from "../models/Subscription";
import SubscriptionPayment from "../models/SubscriptionPayment";
import Company from "../models/Company";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";

const router = express.Router();

// All subscription routes require authentication
router.use(verifyToken);

// ================================
// GET AVAILABLE PLANS
// Returns the list of plans with prices and features.
// Any logged-in user can see the plans.
// ================================
router.get("/plans", async (_req: AuthRequest, res: Response) => {
  try {
    // Return the plan config as an array (easier to loop in frontend)
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
    }));

    res.json({ plans });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET MY SUBSCRIPTION
// Returns the current subscription for the logged-in user's company.
// ================================
router.get("/mine", async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Super admins don't have subscriptions
    if (user.role === "super_admin") {
      res.status(400).json({ message: "Super admins don't have subscriptions." });
      return;
    }

    // Find the company
    const company = await Company.findById(user.companyId);
    if (!company) {
      res.status(404).json({ message: "Company not found." });
      return;
    }

    // Find the active subscription for this company
    const subscription = await Subscription.findOne({
      companyId: company._id,
      status: { $in: ["active", "trial", "expired"] }, // Not canceled ones
    }).sort({ createdAt: -1 }); // Get the most recent one

    // Check if the subscription has expired
    // We check this on every request so the status is always up-to-date
    if (subscription && subscription.status !== "canceled") {
      const now = new Date();
      if (now > subscription.nextBillingDate && subscription.status !== "expired") {
        // The billing date has passed — mark as expired
        subscription.status = "expired";
        await subscription.save();

        // Also update the company's quick-access subscription field
        company.subscription.status = "expired";
        await company.save();
      }
    }

    res.json({ subscription, company });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// SUBSCRIBE TO A PLAN
// Creates or updates a subscription.
// This simulates payment — in production, you'd integrate Stripe here.
//
// WHAT HAPPENS:
// 1. Validate the plan name
// 2. Look up the plan price
// 3. Create a new Subscription document
// 4. Set nextBillingDate to 30 days from now
// 5. Update the Company's subscription info
// ================================
router.post(
  "/subscribe",
  requireRole("admin"), // Only company owners can subscribe
  async (req: AuthRequest, res: Response) => {
    try {
      const { plan } = req.body as { plan: PlanType };
      const user = req.user!;

      // Step 1: Validate the plan
      if (!plan || !SUBSCRIPTION_PLANS[plan]) {
        res.status(400).json({
          message: "Invalid plan. Choose: basic, pro, or premium.",
        });
        return;
      }

      // Step 2: Get the plan details
      const planDetails = SUBSCRIPTION_PLANS[plan];

      // Step 3: Find the company
      const company = await Company.findById(user.companyId);
      if (!company) {
        res.status(404).json({ message: "Company not found." });
        return;
      }

      // Step 4: Deactivate any existing active subscription
      // (a company can only have ONE active subscription at a time)
      await Subscription.updateMany(
        { companyId: company._id, status: { $in: ["active", "trial"] } },
        { status: "canceled", canceledAt: new Date() }
      );

      // Step 5: Calculate the next billing date (30 days from now)
      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      // Step 6: Create the new subscription
      const subscription = new Subscription({
        companyId: company._id,
        plan,
        status: "active",
        pricePerMonth: planDetails.pricePerMonth,
        startDate: now,
        nextBillingDate,
      });

      await subscription.save();

      // Step 7: Record the subscription payment
      // This creates an actual payment record so the super admin
      // can see real revenue, not just projected.
      const payment = new SubscriptionPayment({
        companyId: company._id,
        subscriptionId: subscription._id,
        amount: planDetails.pricePerMonth,
        plan,
        type: "new",
        status: "completed",
      });
      await payment.save();

      // Step 8: Update the company's quick-access subscription info
      // We keep this denormalized for easy access in other parts of the app
      company.subscriptionId = subscription._id as any;
      company.subscription = {
        plan,
        status: "active",
        startDate: now,
        endDate: nextBillingDate,
      };
      await company.save();

      res.status(201).json({
        message: `Subscribed to ${planDetails.name} plan! Next billing: ${nextBillingDate.toLocaleDateString()}.`,
        subscription,
      });
    } catch (error) {
      console.error("Subscribe error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// RENEW SUBSCRIPTION
// For expired subscriptions — renews the same plan for another 30 days.
// In production, this would charge the customer again via Stripe.
// ================================
router.post(
  "/renew",
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      // Find the company
      const company = await Company.findById(user.companyId);
      if (!company) {
        res.status(404).json({ message: "Company not found." });
        return;
      }

      // Find the most recent subscription (could be expired)
      const subscription = await Subscription.findOne({
        companyId: company._id,
      }).sort({ createdAt: -1 });

      if (!subscription) {
        res.status(404).json({
          message: "No subscription found. Please subscribe to a plan first.",
        });
        return;
      }

      // Calculate 30 more days from now
      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      // Renew the subscription
      subscription.status = "active";
      subscription.nextBillingDate = nextBillingDate;
      await subscription.save();

      // Record the renewal payment
      const planDetails = SUBSCRIPTION_PLANS[subscription.plan];
      const payment = new SubscriptionPayment({
        companyId: company._id,
        subscriptionId: subscription._id,
        amount: planDetails.pricePerMonth,
        plan: subscription.plan,
        type: "renewal",
        status: "completed",
      });
      await payment.save();

      // Update the company's quick-access subscription info
      company.subscription.status = "active";
      company.subscription.endDate = nextBillingDate;
      await company.save();

      res.json({
        message: `Subscription renewed! Next billing: ${nextBillingDate.toLocaleDateString()}.`,
        subscription,
      });
    } catch (error) {
      console.error("Renew error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// CANCEL SUBSCRIPTION
// Marks the subscription as canceled.
// The company can still use the platform until the billing date.
// ================================
router.post(
  "/cancel",
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      const company = await Company.findById(user.companyId);
      if (!company) {
        res.status(404).json({ message: "Company not found." });
        return;
      }

      // Find the active subscription
      const subscription = await Subscription.findOne({
        companyId: company._id,
        status: { $in: ["active", "trial"] },
      });

      if (!subscription) {
        res.status(404).json({ message: "No active subscription to cancel." });
        return;
      }

      // Mark as canceled
      subscription.status = "canceled";
      subscription.canceledAt = new Date();
      await subscription.save();

      // Update company's quick-access info
      company.subscription.status = "canceled";
      await company.save();

      res.json({
        message: "Subscription canceled. You can still use the platform until your billing period ends.",
        subscription,
      });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
