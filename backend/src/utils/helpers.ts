// ================================
// UTILITY FUNCTIONS
// Helper functions used across the app.
// ================================

// ================================
// CALCULATE NUMBER OF NIGHTS
// Given a check-in and check-out date, returns the number of nights.
// Example: check-in Jan 1, check-out Jan 3 = 2 nights
// ================================
export function calculateNights(checkIn: Date, checkOut: Date): number {
  // Get the difference in milliseconds
  const diffTime = checkOut.getTime() - checkIn.getTime();

  // Convert milliseconds to days
  // 1000ms * 60s * 60min * 24hr = 86400000ms in a day
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// ================================
// CALCULATE BOOKING PRICE
// Calculates the total price for a booking.
// All prices are in cents to avoid floating-point issues.
// ================================
export function calculateBookingPrice(
  pricePerNight: number,
  numberOfNights: number,
  packagePricePerPerson: number,
  numberOfGuests: number
): {
  roomTotal: number;
  packageTotal: number;
  totalPrice: number;
} {
  // Room cost = price per night * number of nights
  const roomTotal = pricePerNight * numberOfNights;

  // Package cost = price per person * number of guests
  const packageTotal = packagePricePerPerson * numberOfGuests;

  // Total = room + package
  const totalPrice = roomTotal + packageTotal;

  return { roomTotal, packageTotal, totalPrice };
}

// ================================
// FORMAT PRICE
// Converts cents to a dollar string.
// Example: 15000 -> "$150.00"
// ================================
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ================================
// GENERATE SLUG
// Converts a string to a URL-friendly slug.
// Example: "Bali Surf Camp" -> "bali-surf-camp"
// ================================
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
