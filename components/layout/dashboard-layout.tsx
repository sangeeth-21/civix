"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { User } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: Partial<User>;
  role?: "USER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
  navbarProps?: React.ComponentProps<typeof Navbar>;
  sidebarLinks: React.ComponentProps<typeof Sidebar>["links"];
  className?: string;
  showFooter?: boolean;
}

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

export function DashboardLayout({
  children,
  user,
  role = "USER",
  sidebarLinks,
  navbarProps,
  className,
  showFooter = false,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        links={sidebarLinks}
        user={user}
        roleLabel={roleMappings[role].label}
        roleColor={roleMappings[role].color}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-1 flex-col">
        <Navbar
          showAuth={false}
          {...navbarProps}
        />
        <main className={cn("flex-1 p-6", className)}>{children}</main>
        {showFooter && <Footer />}
      </div>
    </div>
  );
} 