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
    { label: "Overview", href: "/dashboard", icon: "📊" },
    { label: "Calendar", href: "/dashboard/calendar", icon: "🗓️" },
    { label: "Bookings", href: "/dashboard/bookings", icon: "📅" },
    { label: "Rooms", href: "/dashboard/rooms", icon: "🏠" },
    { label: "Packages", href: "/dashboard/packages", icon: "🏄" },
    { label: "Activities", href: "/dashboard/activities", icon: "🏄‍♂️" },
    { label: "Sessions", href: "/dashboard/sessions", icon: "⏰" },
    { label: "Customers", href: "/dashboard/customers", icon: "👥" },
    { label: "Payments", href: "/dashboard/payments", icon: "💳" },
    { label: "Subscription", href: "/dashboard/subscription", icon: "💎" },
    { label: "Team", href: "/dashboard/team", icon: "👤" },
    { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  ];

  // Navigation items for super admin (platform owner)
  const superAdminNavItems = [
    { label: "Analytics", href: "/dashboard", icon: "📊" },
    { label: "Companies", href: "/dashboard/companies", icon: "🏢" },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: "💎" },
    { label: "All Bookings", href: "/dashboard/all-bookings", icon: "📅" },
    { label: "All Payments", href: "/dashboard/all-payments", icon: "💳" },
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

  return (
    <div className="min-h-screen flex">
      {/* ================================
          SIDEBAR
          ================================ */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🏄</span>
            <span className="text-lg font-bold text-ocean-700">SurfBook</span>
          </Link>
          {isSuperAdmin && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-2 inline-block">
              Super Admin
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => {
            // Check if this nav item is the current page
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-ocean-50 text-ocean-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user.role.replace("_", " ")}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ================================
          MAIN CONTENT
          ================================ */}
      <main className="flex-1 bg-gray-50">
        {/* Subscription expired banner */}
        {/* Shows at the top of every dashboard page when subscription is expired */}
        {subscriptionExpired && (
          <div className="bg-red-500 text-white px-8 py-3 flex items-center justify-between">
            <div>
              <span className="font-medium">⚠️ Your subscription has {subscriptionStatus === "canceled" ? "been canceled" : "expired"}.</span>
              <span className="ml-2 text-red-100">
                You cannot create new bookings until you renew.
              </span>
            </div>
            <Link
              href="/dashboard/subscription"
              className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              Renew Now
            </Link>
          </div>
        )}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
