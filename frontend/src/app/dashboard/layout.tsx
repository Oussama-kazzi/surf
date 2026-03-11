// Dashboard Layout — sidebar navigation + main content area

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { subscriptionApi } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  // Navigation — text only, no icons
  const companyNavItems = [
    { label: "Overview", href: "/dashboard", section: "" },
    { label: "Calendar", href: "/dashboard/calendar", section: "" },
    { label: "Bookings", href: "/dashboard/bookings", section: "manage" },
    { label: "Rooms", href: "/dashboard/rooms", section: "manage" },
    { label: "Packages", href: "/dashboard/packages", section: "manage" },
    { label: "Activities", href: "/dashboard/activities", section: "manage" },
    { label: "Sessions", href: "/dashboard/sessions", section: "manage" },
    { label: "Customers", href: "/dashboard/customers", section: "people" },
    { label: "Team", href: "/dashboard/team", section: "people" },
    {
      label: "Subscription",
      href: "/dashboard/subscription",
      section: "billing",
    },
    { label: "Settings", href: "/dashboard/settings", section: "billing" },
  ];

  const superAdminNavItems = [
    { label: "Analytics", href: "/dashboard", section: "" },
    { label: "Companies", href: "/dashboard/companies", section: "platform" },
    {
      label: "Subscriptions",
      href: "/dashboard/subscriptions",
      section: "platform",
    },
    {
      label: "All Bookings",
      href: "/dashboard/all-bookings",
      section: "platform",
    },
    {
      label: "All Payments",
      href: "/dashboard/all-payments",
      section: "platform",
    },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : companyNavItems;

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
    if (user.role === "manager") {
      return (
        item.href !== "/dashboard/team" &&
        item.href !== "/dashboard/settings" &&
        item.href !== "/dashboard/subscription"
      );
    }
    return true;
  });

  const sectionLabels: Record<string, string> = {
    manage: "Manage",
    people: "People",
    billing: "Billing",
    platform: "Platform",
  };

  let currentSection = "";
  const navWithSections = filteredNavItems.map((item) => {
    const showSection = item.section && item.section !== currentSection;
    if (item.section) currentSection = item.section;
    return {
      ...item,
      showSectionLabel: showSection ? sectionLabels[item.section] : null,
    };
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-200">
          <Link href="/dashboard" className="block">
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              SurfBook
            </span>
          </Link>
          {isSuperAdmin && (
            <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider">
              Super Admin
            </span>
          )}
        </div>

        {/* Nav links — text only */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navWithSections.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <div key={item.href}>
                {item.showSectionLabel && (
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-3 pt-5 pb-2">
                    {item.showSectionLabel}
                  </p>
                )}
                <Link
                  href={item.href}
                  className={`nav-item ${
                    isActive ? "nav-item-active" : "nav-item-inactive"
                  }`}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-5 py-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-400 capitalize mb-3">
            {user.role.replace("_", " ")}
          </p>
          <button
            onClick={logout}
            className="text-xs font-medium text-gray-400 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen">
        {subscriptionExpired && (
          <div className="bg-red-600 text-white px-8 py-3 flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">
                Your subscription has{" "}
                {subscriptionStatus === "canceled"
                  ? "been canceled"
                  : "expired"}
                .
              </span>
              <span className="ml-2 text-red-200 text-sm">
                You cannot create new bookings until you renew.
              </span>
            </div>
            <Link
              href="/dashboard/subscription"
              className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
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
