// ================================
// HOME PAGE
// This is the landing page of the SaaS platform.
// It shows what our platform offers and has signup/login buttons.
// ================================

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-white">
      {/* ================================
          NAVIGATION BAR
          ================================ */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏄</span>
          <span className="text-xl font-bold text-ocean-700">SurfBook</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-ocean-700 hover:text-ocean-800 font-medium px-4 py-2"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="btn-primary"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ================================
          HERO SECTION
          The main attention-grabbing section
          ================================ */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Booking System Built for{" "}
            <span className="text-ocean-600">Surf Companies</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Manage your rooms, packages, bookings, and customers all in one
            place. Let your customers book online with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="btn-primary text-lg px-8 py-3"
            >
              Start Free Trial
            </Link>
            <Link
              href="/book/bali-surf-camp"
              className="btn-secondary text-lg px-8 py-3"
            >
              See Demo Booking
            </Link>
          </div>
        </div>

        {/* ================================
            FEATURE CARDS
            ================================ */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {/* Feature 1 */}
          <div className="card text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
            <p className="text-gray-600">
              Your customers can check availability, pick a room, choose a surf
              package, and book in minutes.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card text-center">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold mb-2">Room Management</h3>
            <p className="text-gray-600">
              Add your rooms, set prices, and our system automatically prevents
              double bookings.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
            <p className="text-gray-600">
              See all your bookings, customers, payments, and analytics in a
              clean dashboard.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card text-center">
            <div className="text-4xl mb-4">🏄</div>
            <h3 className="text-lg font-semibold mb-2">Surf Packages</h3>
            <p className="text-gray-600">
              Create surf packages with different levels and let customers add
              them to their booking.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">Team Management</h3>
            <p className="text-gray-600">
              Add team members with different roles — admin, manager, or staff —
              each with their own permissions.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-lg font-semibold mb-2">Payment Tracking</h3>
            <p className="text-gray-600">
              Record payments, track who paid and who hasn&apos;t, and see your
              revenue at a glance.
            </p>
          </div>
        </div>
      </main>

      {/* ================================
          FOOTER
          ================================ */}
      <footer className="border-t border-gray-200 py-8 text-center text-gray-500">
        <p>© 2026 SurfBook. Built for surf companies worldwide. 🌊</p>
      </footer>
    </div>
  );
}
