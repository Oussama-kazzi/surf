// ================================
// COMPANY ROUTES
// Manage surf companies.
// Most routes require authentication.
// ================================

import express, { Response } from "express";
import Company from "../models/Company";
import { verifyToken, requireRole, AuthRequest } from "../middleware/auth";
import { generateSlug } from "../utils/helpers";

const router = express.Router();

// ================================
// GET COMPANY BY SLUG (PUBLIC)
// Used by the booking page to load company info.
// No authentication needed — customers use this.
// ================================
router.get("/slug/:slug", async (req: AuthRequest, res: Response) => {
  try {
    const company = await Company.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!company) {
      res.status(404).json({ message: "Company not found." });
      return;
    }

    res.json({ company });
  } catch (error) {
    console.error("Get company error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ================================
// GET MY COMPANY
// Returns the company the logged-in user belongs to.
// ================================
router.get(
  "/mine",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const company = await Company.findById(req.user!.companyId);

      if (!company) {
        res.status(404).json({ message: "Company not found." });
        return;
      }

      res.json({ company });
    } catch (error) {
      console.error("Get my company error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// ================================
// UPDATE MY COMPANY
// Only admin (company owner) can update company details.
// ================================
router.put(
  "/mine",
  verifyToken,
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        name,
        description,
        logo,
        coverImage,
        email,
        phone,
        address,
        city,
        country,
        website,
        paymentSettings,
      } = req.body;

      const company = await Company.findById(req.user!.companyId);
      if (!company) {
        res.status(404).json({ message: "Company not found." });
        return;
      }

      // Update fields if provided
      if (name) {
        company.name = name;
        company.slug = generateSlug(name);
      }
      if (description !== undefined) company.description = description;
      if (logo !== undefined) company.logo = logo;
      if (coverImage !== undefined) company.coverImage = coverImage;
      if (email) company.email = email;
      if (phone !== undefined) company.phone = phone;
      if (address !== undefined) company.address = address;
      if (city !== undefined) company.city = city;
      if (country !== undefined) company.country = country;
      if (website !== undefined) company.website = website;
      if (paymentSettings !== undefined) (company as any).paymentSettings = paymentSettings;

      await company.save();

      res.json({ message: "Company updated!", company });
    } catch (error) {
      console.error("Update company error:", error);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

export default router;
