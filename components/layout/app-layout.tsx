"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

// Role-specific colors and labels
const roleMappings = {
  USER: {
    color: "bg-blue-600",
    label: "User",
  },
  AGENT: {
    color: "bg-green-600",
    label: "Agent",
  },
  ADMIN: {
    color: "bg-purple-600",
    label: "Admin",
  },
  SUPER_ADMIN: {
    color: "bg-red-600",
    label: "Super Admin",
  },
};

// Role-specific navigation links
const roleLinks = {
  USER: [
    { href: "/user/dashboard", label: "Dashboard" },
    { href: "/user/bookings", label: "My Bookings" },
    { href: "/user/services", label: "Services" },
    { href: "/user/profile", label: "Profile" },
    { href: "/user/settings", label: "Settings" },
    { href: "/user/support", label: "Support" },
  ],
  AGENT: [
    { href: "/agent/dashboard", label: "Dashboard" },
    { href: "/agent/bookings", label: "Bookings" },
    { href: "/agent/services", label: "My Services" },
    { href: "/agent/services/create", label: "Create Service" },
    { href: "/agent/profile", label: "Profile" },
    { href: "/agent/settings", label: "Settings" },
    { href: "/agent/support", label: "Support" },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/agents", label: "Agents" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/profile", label: "Profile" },
  ],
  SUPER_ADMIN: [
    { href: "/super-admin/dashboard", label: "Dashboard" },
    { href: "/super-admin/users", label: "Users" },
    { href: "/super-admin/admins", label: "Admins" },
    { href: "/super-admin/agents", label: "Agents" },
    { href: "/super-admin/services", label: "Services" },
    { href: "/super-admin/bookings", label: "Bookings" },
    { href: "/super-admin/reports", label: "Reports" },
    { href: "/super-admin/email-logs", label: "Email Logs" },
    { href: "/super-admin/settings", label: "Settings" },
    { href: "/super-admin/profile", label: "Profile" },
  ],
};

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showNavbar?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  navbarProps?: React.ComponentProps<typeof Navbar>;
  footerProps?: React.ComponentProps<typeof Footer>;
  // Allow passing user directly to avoid dependency on useSession
  user?: Partial<User> | null | undefined;
  role?: string;
}

export function AppLayout({
  children,
  className,
  showNavbar = true,
  showFooter = true,
  showSidebar = false,
  navbarProps,
  footerProps,
  user: propUser,
  role: propRole,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Always call useSession to follow React hooks rules
  const { data: session } = useSession();
  const sessionUser = session?.user;

  // Use either session user or prop user
  const user = propUser || sessionUser;

  // Determine if we're in a dashboard section based on the path
  const isDashboard =
    pathname?.startsWith('/user/') ||
    pathname?.startsWith('/agent/') ||
    pathname?.startsWith('/admin/') ||
    pathname?.startsWith('/super-admin/');

  // Determine user role from path or props if not provided by session
  let effectiveRole = propRole || user?.role || "USER";
  if (!propRole && !user?.role) {
    if (pathname?.startsWith('/agent/')) effectiveRole = "AGENT";
    else if (pathname?.startsWith('/admin/')) effectiveRole = "ADMIN";
    else if (pathname?.startsWith('/super-admin/')) effectiveRole = "SUPER_ADMIN";
  }

  // Get role-specific links and styles
  const roleInfo = roleMappings[effectiveRole as keyof typeof roleMappings] || roleMappings.USER;
  const links = roleLinks[effectiveRole as keyof typeof roleLinks] || roleLinks.USER;

  // Only show sidebar in dashboard sections if showSidebar is true
  const displaySidebar = showSidebar && isDashboard;

  // Convert user to the correct type or undefined for Sidebar component
  const sidebarUser: Partial<User> | undefined = user ? {
    _id: (user as Record<string, unknown>)._id as string || (user as Record<string, unknown>).id as string || '',
    name: user.name || '',
    email: user.email || '',
    role: (user.role as "USER" | "AGENT" | "ADMIN" | "SUPER_ADMIN") || 'USER',
    phone: (user as Record<string, unknown>).phone as string | undefined,
    address: (user as Record<string, unknown>).address as string | undefined,
    isActive: (user as Record<string, unknown>).isActive as boolean ?? true,
    createdAt: (user as Record<string, unknown>).createdAt ? new Date((user as Record<string, unknown>).createdAt as string) : undefined,
    updatedAt: (user as Record<string, unknown>).updatedAt ? new Date((user as Record<string, unknown>).updatedAt as string) : undefined,
  } : undefined;

  return (
    <div className="flex min-h-screen">
      {displaySidebar && (
        <Sidebar
          links={links}
          user={sidebarUser}
          roleLabel={roleInfo.label}
          roleColor={roleInfo.color}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <div className={cn("flex flex-1 flex-col", displaySidebar && "ml-0")}>
        {showNavbar && <Navbar showAuth={!displaySidebar} {...navbarProps} />}

        <main className={cn("flex-1", className)}>
          {children}
        </main>

        {showFooter && <Footer {...footerProps} />}
      </div>
    </div>
  );
} 