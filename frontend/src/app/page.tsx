// ================================
// HOME PAGE
// This is the landing page of the SaaS platform.
// It shows what our platform offers and has signup/login buttons.
// ================================

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-white">
      {/* NAVIGATION BAR */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-ocean rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-ocean-700 tracking-tight">SurfBook</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/login"
            className="text-ocean-700 hover:text-ocean-800 font-medium px-4 py-2 transition-colors"
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

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative">
        {/* Decorative wave background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" fill="none">
            <path fill="#0369a1" d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,149.3C672,128,768,128,864,149.3C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,320L0,320Z"/>
          </svg>
        </div>

        <div className="text-center max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-ocean-50 text-ocean-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-ocean-100">
            <span>🌊</span> Built for surf companies worldwide
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            The Booking System Built for{" "}
            <span className="text-ocean-600">Surf Companies</span>
          </h1>
          <p className="text-xl text-gray-500 mb-8 leading-relaxed">
            Manage your rooms, packages, bookings, and customers all in one
            place. Let your customers book online with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="btn-primary text-lg px-8 py-3 shadow-lg shadow-ocean-200"
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

        {/* FEATURE CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            { icon: "📅", title: "Easy Booking", desc: "Your customers can check availability, pick a room, choose a surf package, and book in minutes." },
            { icon: "🏠", title: "Room Management", desc: "Add your rooms, set prices, and our system automatically prevents double bookings." },
            { icon: "📊", title: "Dashboard", desc: "See all your bookings, customers, payments, and analytics in a clean dashboard." },
            { icon: "🏄", title: "Surf Packages", desc: "Create surf packages with different levels and let customers add them to their booking." },
            { icon: "👥", title: "Team Management", desc: "Add team members with different roles — admin, manager, or staff — each with their own permissions." },
            { icon: "💳", title: "Payment Tracking", desc: "Record payments, track who paid and who hasn't, and see your revenue at a glance." },
          ].map((feature) => (
            <div key={feature.title} className="card text-center group hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 bg-ocean-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        <p>© 2026 SurfBook. Built for surf companies worldwide. 🌊</p>
      </footer>
    </div>
  );
}
