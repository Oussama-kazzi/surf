// ================================
// TYPESCRIPT INTERFACES
// These define the shape of our data on the frontend.
// They match the MongoDB models on the backend.
// ================================

// ================================
// USER
// Anyone who logs into the dashboard
// ================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "admin" | "manager" | "staff";
  companyId?: string;
}

// ================================
// COMPANY
// A surf company using our platform
// ================================
export interface Company {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  ownerId: string;
  subscription: {
    plan: "free" | "basic" | "premium";
    status: "active" | "inactive" | "cancelled";
    startDate: string;
    endDate?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================================
// ROOM
// A room that can be booked
// ================================
export interface Room {
  _id: string;
  companyId: string;
  name: string;
  description: string;
  type: "single" | "double" | "suite" | "dorm" | "bungalow";
  capacity: number;
  pricePerNight: number; // In cents
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================================
// PACKAGE
// A surf package offered by a company
// ================================
export interface SurfPackage {
  _id: string;
  companyId: string;
  name: string;
  description: string;
  durationDays: number;
  pricePerPerson: number; // In cents
  includes: string[];
  maxParticipants: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "all-levels";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================================
// BOOKING
// A reservation made by a customer
// ================================
export interface Booking {
  _id: string;
  companyId: string | Company;
  customerId: string | Customer;
  roomId: string | Room;
  packageId?: string | SurfPackage;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  roomTotal: number;
  packageTotal: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// CUSTOMER
// Someone who makes a booking
// ================================
export interface Customer {
  _id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// PAYMENT
// A payment record
// ================================
export interface Payment {
  _id: string;
  companyId: string | Company;
  bookingId: string | Booking;
  customerId: string | Customer;
  amount: number;
  method: "credit_card" | "bank_transfer" | "cash" | "other";
  status: "pending" | "completed" | "failed" | "refunded";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// TEAM MEMBER
// Same as User but used in the team context
// ================================
export interface TeamMember {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "staff";
  isActive: boolean;
  createdAt: string;
}

// ================================
// API RESPONSE TYPES
// What the API returns
// ================================
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Analytics {
  totalCompanies: number;
  totalBookings: number;
  totalCustomers: number;
  totalRevenue: number;
}
