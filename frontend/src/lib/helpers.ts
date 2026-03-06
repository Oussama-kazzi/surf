// ================================
// HELPER FUNCTIONS (Frontend)
// Utility functions used across the frontend.
// ================================

// Format cents to a readable price string
// Example: 15000 -> "$150.00"
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Format a date string to a readable format
// Example: "2024-01-15T00:00:00.000Z" -> "Jan 15, 2024"
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get a status badge color based on booking status
export function getStatusColor(status: string): string {
  switch (status) {
    case "confirmed":
    case "completed":
    case "paid":
    case "active":
      return "bg-green-100 text-green-800";
    case "pending":
    case "partial":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
    case "refunded":
    case "inactive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Calculate number of nights between two dates
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
