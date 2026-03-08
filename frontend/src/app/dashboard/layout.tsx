// ================================
// DASHBOARD LAYOUT
// This layout wraps all dashboard pages.
// It provides the sidebar navigation.
//
// It also checks if the user is logged in.
// If not, it redirects to the login page.
// ================================

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { subscriptionApi } from "@/lib/api";
import { Subscription } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  // ================================
  // SUBSCRIPTION EXPIRY CHECK
  // We check if the company's subscription is expired.
  // If so, we show a warning banner at the top of every dashboard page.
  // ================================
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Only check subscription for company users (not super admin)
    if (user && !isSuperAdmin && user.companyId) {
      checkSubscription();
    }
  }, [user, isSuperAdmin]);

  async function checkSubscription() {
    try {
      const data = await subscriptionApi.getMine();
      if (data.subscription) {
        setSubscriptionStatus(data.subscription.status);
        if (
          data.subscription.status === "expired" ||
          data.subscription.status === "canceled"
        ) {
          setSubscriptionExpired(true);
        }
      } else {
        setSubscriptionExpired(true);
        setSubscriptionStatus("expired");
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Don't render if not logged in
  if (!user) return null;

  // ================================
  // NAVIGATION ITEMS
  // Different items based on user role.
  // Super admin sees platform management options.
  // Company users see their company management options.
  // ================================

  // Navigation items for company users (admin, manager, staff)
  const companyNavItems = [
    { label: "Overview", href: "/dashboard", icon: "📊", section: "" },
    { label: "Calendar", href: "/dashboard/calendar", icon: "🗓️", section: "" },
    { label: "Bookings", href: "/dashboard/bookings", icon: "📅", section: "manage" },
    { label: "Rooms", href: "/dashboard/rooms", icon: "🏠", section: "manage" },
    { label: "Packages", href: "/dashboard/packages", icon: "🏄", section: "manage" },
    { label: "Activities", href: "/dashboard/activities", icon: "🏄‍♂️", section: "manage" },
    { label: "Sessions", href: "/dashboard/sessions", icon: "⏰", section: "manage" },
    { label: "Customers", href: "/dashboard/customers", icon: "👥", section: "people" },
    { label: "Team", href: "/dashboard/team", icon: "👤", section: "people" },
    { label: "Subscription", href: "/dashboard/subscription", icon: "💎", section: "billing" },
    { label: "Settings", href: "/dashboard/settings", icon: "⚙️", section: "billing" },
  ];

  // Navigation items for super admin (platform owner)
  const superAdminNavItems = [
    { label: "Analytics", href: "/dashboard", icon: "📊", section: "" },
    { label: "Companies", href: "/dashboard/companies", icon: "🏢", section: "platform" },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: "💎", section: "platform" },
    { label: "All Bookings", href: "/dashboard/all-bookings", icon: "📅", section: "platform" },
    { label: "All Payments", href: "/dashboard/all-payments", icon: "💳", section: "platform" },
  ];

  // Choose which nav items to show based on role
  const navItems = isSuperAdmin ? superAdminNavItems : companyNavItems;

  // Filter nav items based on role permissions
  // Staff can only see bookings and customers
  const filteredNavItems = navItems.filter((item) => {
    if (user.role === "staff") {
      return [
        "/dashboard",
        "/dashboard/calendar",
        "/dashboard/bookings",
        "/dashboard/customers",
        "/dashboard/sessions",
      ].includes(item.href);
    }
    // Manager can't see team, settings, or subscription
    if (user.role === "manager") {
      return (
        item.href !== "/dashboard/team" &&
        item.href !== "/dashboard/settings" &&
        item.href !== "/dashboard/subscription"
      );
    }
    return true;
  });

  // Group nav items by section for visual separators
  const sectionLabels: Record<string, string> = {
    manage: "Manage",
    people: "People",
    billing: "Billing",
    platform: "Platform",
  };

  // Build sections from filtered items
  let currentSection = "";
  const navWithSections = filteredNavItems.map((item) => {
    const showSection = item.section && item.section !== currentSection;
    if (item.section) currentSection = item.section;
    return { ...item, showSectionLabel: showSection ? sectionLabels[item.section] : null };
  });

  return (
    <div className="min-h-screen flex bg-sand-50">
      {/* ================================
          SIDEBAR
          ================================ */}
      <aside className="w-64 bg-white border-r border-gray-100 shadow-sidebar flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-ocean flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              SurfBook
            </span>
          </Link>
          {isSuperAdmin && (
            <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-2.5 inline-block uppercase tracking-wider">
              Super Admin
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navWithSections.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <div key={item.href}>
                {item.showSectionLabel && (
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pt-5 pb-2">
                    {item.showSectionLabel}
                  </p>
                )}
                <Link
                  href={item.href}
                  className={`nav-item ${
                    isActive ? "nav-item-active" : "nav-item-inactive"
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-700 flex items-center justify-center text-sm font-bold">
              {user.firstName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-gray-400 capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs font-medium text-gray-400 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ================================
          MAIN CONTENT
          ================================ */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Subscription expired banner */}
        {subscriptionExpired && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <span className="font-medium">
                  Your subscription has {subscriptionStatus === "canceled" ? "been canceled" : "expired"}.
                </span>
                <span className="ml-2 text-red-100 text-sm">
                  You cannot create new bookings until you renew.
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/subscription"
              className="bg-white text-red-600 px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors shadow-sm"
            >
              Renew Now
            </Link>
          </div>
        )}
        <div className="p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
