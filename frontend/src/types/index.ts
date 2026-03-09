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
  subscriptionId?: string; // Reference to the active Subscription document
  subscription: {
    plan: "basic" | "pro" | "premium";
    status: "active" | "expired" | "canceled" | "trial";
    startDate: string;
    endDate?: string;
  };
  paymentSettings?: {
    method: "manual" | "stripe" | "bank_transfer";
    manualInstructions: string;
    bankName: string;
    iban: string;
    swift: string;
    accountHolder: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================================
// SUBSCRIPTION
// Tracks a company's monthly subscription
// ================================
export interface Subscription {
  _id: string;
  companyId: string | Company;
  plan: "basic" | "pro" | "premium";
  status: "active" | "expired" | "canceled" | "trial";
  pricePerMonth: number; // In cents
  startDate: string;
  nextBillingDate: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// SUBSCRIPTION PLAN
// The plan options shown to users
// ================================
export interface SubscriptionPlan {
  id: string;
  name: string;
  pricePerMonth: number; // In cents
  maxRooms: number;
  maxBookingsPerMonth: number;
  features: string[];
}

// ================================
// SUBSCRIPTION PAYMENT
// Records actual payments made for subscriptions
// ================================
export interface SubscriptionPayment {
  _id: string;
  companyId: string | Company;
  subscriptionId: string | Subscription;
  amount: number; // In cents
  plan: "basic" | "pro" | "premium";
  type: "new" | "renewal";
  status: "completed" | "failed" | "refunded";
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
// ACTIVITY
// A surf activity (e.g., Surf Lesson, Yoga, Airport Transfer)
// ================================
export interface Activity {
  _id: string;
  companyId: string;
  name: string;
  description: string;
  price: number; // In cents
  duration: number; // In minutes
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================================
// SESSION
// A time slot for an activity with capacity tracking
// ================================
export interface Session {
  _id: string;
  activityId: string | Activity;
  companyId: string;
  date: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  bookedCount: number;
  createdAt: string;
  updatedAt: string;
}

// ================================
// BOOKING ACTIVITY
// An activity+session pair attached to a booking
// ================================
export interface BookingActivity {
  activityId: string | Activity;
  sessionId: string | Session;
  price: number; // In cents at the time of booking
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
  activities: BookingActivity[];
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  roomTotal: number;
  packageTotal: number;
  activitiesTotal: number;
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
  type: "deposit" | "full" | "remaining" | "refund";
  paidAt?: string;
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
// INVOICE
// Auto-generated after booking payment
// ================================
export interface InvoicePriceBreakdown {
  roomName: string;
  roomPricePerNight: number;
  numberOfNights: number;
  roomTotal: number;
  packageName?: string;
  packagePricePerPerson?: number;
  numberOfGuests: number;
  packageTotal: number;
  activities: { name: string; price: number }[];
  activitiesTotal: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  bookingId: string;
  companyId: string;
  companyName: string;
  customerName: string;
  customerEmail: string;
  roomName: string;
  packageName?: string;
  sessions: { activityName: string; date: string; time: string }[];
  numberOfNights: number;
  numberOfGuests: number;
  priceBreakdown: InvoicePriceBreakdown;
  totalAmount: number;
  paymentMethod: "pay_on_arrival" | "stripe" | "paypal";
  paymentStatus: "unpaid" | "paid";
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
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
  // Subscription analytics for super admin (from real payments)
  activeSubscriptions: number;
  totalSubscriptionRevenue: number;
  monthlySubscriptionRevenue: number;
}
