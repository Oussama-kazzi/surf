// Super Admin Layout � sidebar navigation + main content area

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const isSuperAdmin = user?.role === "super_admin";
  const isLoginPage = pathname === "/super-admin/login";

  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        router.push("/login");
      } else if (!isSuperAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, isSuperAdmin, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  const superAdminNavItems = [
    { label: "Overview", href: "/super-admin", section: "" },
    { label: "Companies", href: "/super-admin/companies", section: "platform" },
    {
      label: "Subscriptions",
      href: "/super-admin/subscriptions",
      section: "platform",
    },
    {
      label: "All Bookings",
      href: "/super-admin/bookings",
      section: "platform",
    },
    {
      label: "All Payments",
      href: "/super-admin/payments",
      section: "platform",
    },
    {
      label: "Platform Analytics",
      href: "/super-admin/analytics",
      section: "platform",
    },
  ];

  const sectionLabels: Record<string, string> = {
    platform: "Platform",
  };

  let currentSection = "";
  const navWithSections = superAdminNavItems.map((item) => {
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
          <Link href="/super-admin" className="block">
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              SurfBook
            </span>
          </Link>
          <span className="text-[10px] font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider">
            Super Admin
          </span>
        </div>

        {/* Nav links � text only */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navWithSections.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/super-admin" && pathname.startsWith(item.href));

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
        <div className="p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
