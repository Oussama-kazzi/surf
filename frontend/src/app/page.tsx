// ================================
// HOME PAGE
// This is the landing page of the SaaS platform.
// It shows what our platform offers and has signup/login buttons.
// ================================

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
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
            className="bg-sky-500 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-sky-600 transition-colors"
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
          {/* Surf lifestyle video — people surfing and enjoying the ocean,
              energetic and happy vibe to match the SaaS brand feel.
              Source: Pexels free stock video */}
          <source
            src="https://videos.pexels.com/video-files/1739010/1739010-hd_1920_1080_30fps.mp4"
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
            className="inline-block bg-sky-500 text-white font-semibold text-lg px-10 py-4 rounded-lg hover:bg-sky-600 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-6 py-24 bg-slate-50">
        <h2 className="text-3xl font-semibold text-slate-900 text-center mb-4">
          Everything you need to run your surf camp
        </h2>
        <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">
          Simple tools to manage your business. No complexity, no distractions.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Online Booking",
              desc: "Customers check availability, pick a room, choose a package, and book in minutes.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              ),
            },
            {
              title: "Room Management",
              desc: "Add rooms, set prices, and the system prevents double bookings automatically.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ),
            },
            {
              title: "Dashboard",
              desc: "See bookings, customers, payments, and occupancy in a clean overview.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              ),
            },
            {
              title: "Surf Packages",
              desc: "Create packages at different skill levels and let customers add them to bookings.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              ),
            },
            {
              title: "Team Access",
              desc: "Add team members with roles — admin, manager, or staff — each with their own permissions.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
            {
              title: "Payment Tracking",
              desc: "Record payments, track who paid and who hasn't, and see revenue at a glance.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
                  <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
                </svg>
              ),
            },
          ].map((feature) => (
            /* Feature card — white background, subtle shadow, rounded corners */
            <div
              key={feature.title}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-7 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              {/* Icon box */}
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                {feature.icon}
              </div>

              {/* Title + description */}
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>

              {/* Arrow link */}
              <div className="mt-auto pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:border-sky-500 hover:text-sky-500 transition-colors text-sm"
                >
                  →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================
          ABOUT US SECTION
          ================================ */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">

          {/* Left — text */}
          <div className="flex-1">
            <p className="text-sky-600 text-sm font-semibold uppercase tracking-widest mb-3">About SurfBook</p>
            <h2 className="text-3xl font-semibold text-slate-900 mb-6 leading-snug">
              Built for surf camps,<br />by people who love the ocean.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-4">
              SurfBook is a simple booking platform built specifically for surf camps and surf schools.
              We understand the unique challenges of running a surf business — managing rooms, scheduling
              lessons, selling packages, and keeping customers happy.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Our platform brings everything together in one clean dashboard so you can spend less time
              on admin and more time in the water.
            </p>
          </div>

          {/* Right — stat highlights */}
          <div className="flex-1 grid grid-cols-2 gap-6">
            {[
              { value: "500+", label: "Bookings managed" },
              { value: "50+", label: "Surf camps onboarded" },
              { value: "12+", label: "Countries reached" },
              { value: "98%", label: "Customer satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-3xl font-bold text-sky-600 mb-1">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================================
          TESTIMONIALS SECTION
          ================================ */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sky-600 text-sm font-semibold uppercase tracking-widest text-center mb-3">Reviews</p>
          <h2 className="text-3xl font-semibold text-slate-900 text-center mb-4">
            Loved by surf camp owners
          </h2>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">
            Here is what surf businesses are saying about SurfBook.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Carlos Mendes",
                company: "Nazaré Surf Camp, Portugal",
                review:
                  "SurfBook completely replaced our spreadsheets. Bookings, rooms, payments — all in one place. Our team saves hours every week.",
              },
              {
                name: "Sophie Laurent",
                company: "Hossegor Surf School, France",
                review:
                  "The package management alone is worth it. Our customers love how easy the booking flow is. Setup took less than a day.",
              },
              {
                name: "Jake Morrison",
                company: "Byron Bay Surf Lodge, Australia",
                review:
                  "Finally a platform that actually understands surf camps. Clean, fast, and the support team is really responsive.",
              },
              {
                name: "Ana Torres",
                company: "Tamarindo Wave House, Costa Rica",
                review:
                  "We went from messy WhatsApp bookings to a professional system overnight. Highly recommend to any surf business.",
              },
              {
                name: "Liam O'Brien",
                company: "Bundoran Surf Co., Ireland",
                review:
                  "The dashboard gives us a full picture of our occupancy and revenue. I check it every morning with my coffee.",
              },
              {
                name: "Yuki Tanaka",
                company: "Shida Surf Resort, Japan",
                review:
                  "Simple and intuitive. Our staff learned it in minutes. Best investment we made for the business this year.",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7 flex flex-col gap-4">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-sky-500">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">&ldquo;{t.review}&rdquo;</p>
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================
          TRUSTED COMPANIES SECTION
          ================================ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-slate-400 text-sm text-center uppercase tracking-widest mb-12">
            Trusted by surf camps around the world
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Nazaré Surf Camp", location: "Portugal" },
              { name: "Hossegor Surf School", location: "France" },
              { name: "Byron Bay Surf Lodge", location: "Australia" },
              { name: "Tamarindo Wave House", location: "Costa Rica" },
              { name: "Bundoran Surf Co.", location: "Ireland" },
              { name: "Shida Surf Resort", location: "Japan" },
              { name: "Uluwatu Surf Villas", location: "Bali" },
              { name: "Punta Roca Camp", location: "El Salvador" },
            ].map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 text-center hover:border-sky-200 hover:bg-sky-50 transition-colors"
              >
                <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                <p className="text-slate-400 text-xs mt-1">{c.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================
          PRICING SECTION
          ================================ */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sky-600 text-sm font-semibold uppercase tracking-widest text-center mb-3">Pricing</p>
          <h2 className="text-3xl font-semibold text-slate-900 text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">
            Choose the plan that fits your surf camp. No hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {[
              {
                name: "Basic",
                price: "$29",
                desc: "For small surf camps just getting started.",
                features: [
                  "Up to 10 rooms",
                  "Up to 3 team members",
                  "Booking management",
                  "Customer records",
                  "Email support",
                ],
                highlight: false,
              },
              {
                name: "Pro",
                price: "$69",
                desc: "For growing surf camps that need more tools.",
                features: [
                  "Unlimited rooms",
                  "Up to 10 team members",
                  "Packages & activities",
                  "Payment tracking",
                  "Calendar view",
                  "Priority support",
                ],
                highlight: true,
              },
              {
                name: "Premium",
                price: "$129",
                desc: "For large surf resorts with advanced needs.",
                features: [
                  "Everything in Pro",
                  "Unlimited team members",
                  "Multi-company support",
                  "Invoice generation",
                  "Advanced analytics",
                  "Dedicated support",
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col gap-6 ${
                  plan.highlight
                    ? "bg-sky-600 border-sky-600 shadow-xl"
                    : "bg-white border-slate-100 shadow-sm"
                }`}
              >
                {/* Plan name + price */}
                <div>
                  {plan.highlight && (
                    <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full mb-3 inline-block">
                      Most Popular
                    </span>
                  )}
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlight ? "text-sky-100" : "text-slate-500"}`}>
                    {plan.desc}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm mb-1 ${plan.highlight ? "text-sky-200" : "text-slate-400"}`}>
                      / month
                    </span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${plan.highlight ? "bg-sky-200" : "bg-sky-500"}`} />
                      <span className={`text-sm ${plan.highlight ? "text-sky-50" : "text-slate-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Link
                  href="/register"
                  className={`w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-white text-sky-600 hover:bg-sky-50"
                      : "bg-sky-500 text-white hover:bg-sky-600"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">

          {/* Left — text + button */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-slate-400 mb-8">
              Set up your surf camp in minutes. No credit card required.
            </p>
            <Link
              href="/register"
              className="inline-block bg-sky-500 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-sky-600 transition-colors"
            >
              Create Your Account
            </Link>
          </div>

          {/* Right — surf photo */}
          <div className="flex-1 w-full">
            <img
              src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=900&q=80"
              alt="Surfer riding a wave"
              className="w-full h-72 md:h-80 object-cover rounded-2xl shadow-2xl"
            />
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-slate-400 text-sm">
        <p>&copy; 2026 SurfBook. Built for surf companies worldwide.</p>
      </footer>
    </div>
  );
}
