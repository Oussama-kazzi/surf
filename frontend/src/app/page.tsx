// ================================
// HOME PAGE
// This is the landing page of the SaaS platform.
// It shows what our platform offers and has signup/login buttons.
// ================================

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <span className="text-xl font-bold text-white tracking-tight">
          SurfBook
        </span>
        <div className="flex gap-3 items-center">
          <Link
            href="/login"
            className="text-white/90 hover:text-white font-medium px-4 py-2 transition-colors text-sm"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="bg-white text-gray-900 font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ================================
          HERO SECTION
          - Full-width background video of surfing (autoplay, muted, loop)
          - Dark gradient overlay for text readability
          - Centered headline, description, and CTA button
          ================================ */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">

        {/* Background Video
            - Covers the entire section using absolute positioning + object-cover
            - autoPlay, muted, loop ensure continuous silent playback
            - playsInline prevents fullscreen on mobile devices */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          {/* Cinematic slow-motion wave footage — publicly hosted on Mixkit */}
          <source
            src="https://assets.mixkit.co/videos/1222/1222-720.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark Overlay
            - Gradient overlay darkens from top and bottom for depth
            - Ensures white text remains readable over any video frame */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Hero Content
            - Centered text with constrained max-width for readability
            - z-10 places content above the video and overlay layers */}
        <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            The Booking Platform for Surf Camps
          </h1>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            Manage rooms, packages, bookings, and customers — all in one place.
          </p>

          {/* CTA Button — high contrast white on dark background */}
          <Link
            href="/register"
            className="inline-block bg-white text-gray-900 font-semibold text-lg px-10 py-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-semibold text-gray-900 text-center mb-4">
          Everything you need to run your surf camp
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
          Simple tools to manage your business. No complexity, no distractions.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Online Booking",
              desc: "Customers check availability, pick a room, choose a package, and book in minutes.",
            },
            {
              title: "Room Management",
              desc: "Add rooms, set prices, and the system prevents double bookings automatically.",
            },
            {
              title: "Dashboard",
              desc: "See bookings, customers, payments, and occupancy in a clean overview.",
            },
            {
              title: "Surf Packages",
              desc: "Create packages at different skill levels and let customers add them to bookings.",
            },
            {
              title: "Team Access",
              desc: "Add team members with roles — admin, manager, or staff — each with their own permissions.",
            },
            {
              title: "Payment Tracking",
              desc: "Record payments, track who paid and who hasn't, and see revenue at a glance.",
            },
          ].map((feature) => (
            <div key={feature.title} className="py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8">
            Set up your surf camp in minutes. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-gray-900 font-semibold px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-gray-400 text-sm">
        <p>&copy; 2026 SurfBook. Built for surf companies worldwide.</p>
      </footer>
    </div>
  );
}
