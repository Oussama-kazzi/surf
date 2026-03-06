// ================================
// USER MODEL
// This represents anyone who can log into the system:
// - Surf company owners
// - Team members (admin, manager, staff)
// - Super admin (platform owner)
// ================================

import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// TypeScript interface for the User document
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "admin" | "manager" | "staff";
  companyId?: mongoose.Types.ObjectId; // Which surf company they belong to (null for super_admin)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Always store emails in lowercase
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    // Role determines what the user can do
    // super_admin = platform owner (you)
    // admin = surf company owner
    // manager = can manage most things
    // staff = limited access
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "staff"],
      default: "staff",
    },
    // Which company this user belongs to
    // Super admin doesn't belong to any company
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// ================================
// PASSWORD HASHING
// Before saving a user, we hash their password.
// This way we never store plain text passwords.
// ================================
userSchema.pre("save", async function (next) {
  // Only hash the password if it was changed (or is new)
  if (!this.isModified("password")) return next();

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ================================
// PASSWORD COMPARISON
// This method checks if a given password matches the stored hash.
// We use it during login.
// ================================
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
