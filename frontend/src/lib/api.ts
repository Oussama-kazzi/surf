// ================================
// API HELPER
// This file contains functions to call our backend API.
// Instead of writing fetch() everywhere, we use these helpers.
// ================================

// Base URL for API calls
// In development, Next.js rewrites /api/* to our backend (see next.config.js)
const API_URL = "/api";

// ================================
// HELPER: Make an API request
// This function handles:
// - Adding the auth token to requests
// - Parsing JSON responses
// - Handling errors
// ================================
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // Get the auth token from localStorage (if logged in)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Set up headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add auth token if we have one
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse the response
  const data = await response.json();

  // If the response is not OK, throw an error
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// ================================
// AUTH API
// ================================
export const authApi = {
  // Register a new account
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
  }) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  // Login
  login: (data: { email: string; password: string }) =>
    apiRequest("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  // Get current user
  getMe: () => apiRequest("/auth/me"),
};

// ================================
// COMPANY API
// ================================
export const companyApi = {
  // Get company by slug (public)
  getBySlug: (slug: string) => apiRequest(`/companies/slug/${slug}`),

  // Get my company
  getMine: () => apiRequest("/companies/mine"),

  // Update my company
  updateMine: (data: any) =>
    apiRequest("/companies/mine", { method: "PUT", body: JSON.stringify(data) }),
};

// ================================
// ROOM API
// ================================
export const roomApi = {
  // Get available rooms (public)
  getAvailable: (companyId: string, checkIn: string, checkOut: string) =>
    apiRequest(
      `/rooms/available?companyId=${companyId}&checkIn=${checkIn}&checkOut=${checkOut}`
    ),

  // Get all rooms for my company
  getAll: () => apiRequest("/rooms"),

  // Get single room
  getOne: (id: string) => apiRequest(`/rooms/${id}`),

  // Create room
  create: (data: any) =>
    apiRequest("/rooms", { method: "POST", body: JSON.stringify(data) }),

  // Update room
  update: (id: string, data: any) =>
    apiRequest(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Delete room
  delete: (id: string) => apiRequest(`/rooms/${id}`, { method: "DELETE" }),
};

// ================================
// PACKAGE API
// ================================
export const packageApi = {
  // Get packages for a company (public)
  getForCompany: (companyId: string) =>
    apiRequest(`/packages/company/${companyId}`),

  // Get all packages for my company
  getAll: () => apiRequest("/packages"),

  // Create package
  create: (data: any) =>
    apiRequest("/packages", { method: "POST", body: JSON.stringify(data) }),

  // Update package
  update: (id: string, data: any) =>
    apiRequest(`/packages/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Delete package
  delete: (id: string) => apiRequest(`/packages/${id}`, { method: "DELETE" }),
};

// ================================
// BOOKING API
// ================================
export const bookingApi = {
  // Create booking (public)
  create: (data: any) =>
    apiRequest("/bookings", { method: "POST", body: JSON.stringify(data) }),

  // Get all bookings for my company
  getAll: (params?: string) => apiRequest(`/bookings${params ? `?${params}` : ""}`),

  // Get single booking
  getOne: (id: string) => apiRequest(`/bookings/${id}`),

  // Update booking status
  updateStatus: (id: string, status: string) =>
    apiRequest(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ================================
// CUSTOMER API
// ================================
export const customerApi = {
  // Get all customers
  getAll: () => apiRequest("/customers"),

  // Get single customer
  getOne: (id: string) => apiRequest(`/customers/${id}`),

  // Update customer
  update: (id: string, data: any) =>
    apiRequest(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// ================================
// TEAM API
// ================================
export const teamApi = {
  // Get all team members
  getAll: () => apiRequest("/team"),

  // Add team member
  add: (data: any) =>
    apiRequest("/team", { method: "POST", body: JSON.stringify(data) }),

  // Update role
  updateRole: (id: string, role: string) =>
    apiRequest(`/team/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  // Toggle active status
  toggleActive: (id: string) =>
    apiRequest(`/team/${id}/deactivate`, { method: "PATCH" }),
};

// ================================
// PAYMENT API
// ================================
export const paymentApi = {
  // Get all payments
  getAll: () => apiRequest("/payments"),

  // Record a payment
  create: (data: any) =>
    apiRequest("/payments", { method: "POST", body: JSON.stringify(data) }),
};

// ================================
// ACTIVITY API
// ================================
export const activityApi = {
  // Get activities for a company (public)
  getForCompany: (companyId: string) =>
    apiRequest(`/activities/company/${companyId}`),

  // Get all activities for my company (dashboard)
  getAll: () => apiRequest("/activities"),

  // Create activity
  create: (data: any) =>
    apiRequest("/activities", { method: "POST", body: JSON.stringify(data) }),

  // Update activity
  update: (id: string, data: any) =>
    apiRequest(`/activities/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Delete (soft-delete) activity
  delete: (id: string) => apiRequest(`/activities/${id}`, { method: "DELETE" }),
};

// ================================
// SESSION API
// ================================
export const sessionApi = {
  // Get sessions (public, filter by activityId / date / companyId)
  get: (params?: string) =>
    apiRequest(`/sessions${params ? `?${params}` : ""}`),

  // Get sessions for my company (dashboard)
  getMine: (params?: string) =>
    apiRequest(`/sessions/mine${params ? `?${params}` : ""}`),

  // Create session
  create: (data: any) =>
    apiRequest("/sessions", { method: "POST", body: JSON.stringify(data) }),

  // Update session
  update: (id: string, data: any) =>
    apiRequest(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Delete session
  delete: (id: string) => apiRequest(`/sessions/${id}`, { method: "DELETE" }),
};

// ================================
// ADMIN API (Super Admin)
// ================================
export const adminApi = {
  // Get analytics
  getAnalytics: () => apiRequest("/admin/analytics"),

  // Get all companies
  getCompanies: () => apiRequest("/admin/companies"),

  // Get single company
  getCompany: (id: string) => apiRequest(`/admin/companies/${id}`),

  // Update company
  updateCompany: (id: string, data: any) =>
    apiRequest(`/admin/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Toggle company active status
  toggleCompany: (id: string) =>
    apiRequest(`/admin/companies/${id}/toggle`, { method: "PATCH" }),

  // Get all bookings
  getBookings: (params?: string) =>
    apiRequest(`/admin/bookings${params ? `?${params}` : ""}`),

  // Get all payments
  getPayments: () => apiRequest("/admin/payments"),

  // Get all subscriptions
  getSubscriptions: () => apiRequest("/admin/subscriptions"),

  // Get all subscription payments (real revenue records)
  getSubscriptionPayments: () => apiRequest("/admin/subscription-payments"),

  // Update a company's subscription (plan, status, add days)
  updateSubscription: (companyId: string, data: any) =>
    apiRequest(`/admin/companies/${companyId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ================================
// SUBSCRIPTION API
// For company owners to manage their subscription.
// ================================
export const subscriptionApi = {
  // Get available plans
  getPlans: () => apiRequest("/subscriptions/plans"),

  // Get my company's current subscription
  getMine: () => apiRequest("/subscriptions/mine"),

  // Subscribe to a plan (simulated payment)
  subscribe: (plan: string) =>
    apiRequest("/subscriptions/subscribe", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),

  // Renew an expired subscription
  renew: () =>
    apiRequest("/subscriptions/renew", { method: "POST" }),

  // Cancel subscription
  cancel: () =>
    apiRequest("/subscriptions/cancel", { method: "POST" }),
};
