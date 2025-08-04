import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  MessageSquare,
  Settings,
  UserCircle,
  PlusCircle
} from "lucide-react";
import type { User } from "@/types";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current user session
  const session = await auth();

  // If not authenticated or not an agent, redirect to login
  if (!session?.user || !["AGENT", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect('/login?callbackUrl=/agent/dashboard');
  }

  const sidebarLinks = [
    {
      href: "/agent/dashboard",
      label: "Dashboard",
      // icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/agent/profile",
      label: "My Profile",
      // icon: <UserCircle className="h-4 w-4" />,
    },
    {
      href: "/agent/services",
      label: "Services",
      // icon: <Package className="h-4 w-4" />,
    },
    {
      href: "/agent/services/create",
      label: "Create Service",
      // icon: <PlusCircle className="h-4 w-4" />,
    },
    {
      href: "/agent/bookings",
      label: "Bookings",
      // icon: <Calendar className="h-4 w-4" />,
    },
    {
      href: "/agent/users",
      label: "My Clients",
      // icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/agent/support",
      label: "Support",
      // icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      href: "/agent/settings",
      label: "Settings",
      // icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardLayout
      role="AGENT"
      user={session.user as Partial<User>}
      sidebarLinks={sidebarLinks}
      showFooter={false}
    >
      {children}
    </DashboardLayout>
  );
} 
