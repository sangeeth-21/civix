"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User } from "@/types";

interface SidebarLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  links: SidebarLink[];
  user?: Partial<User>;
  roleLabel?: string;
  roleColor?: string;
  showUserInfo?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  className,
  links,
  user,
  roleLabel = "User",
  roleColor = "bg-blue-600",
  showUserInfo = true,
  collapsed = false,
  onToggleCollapse,
  ...props
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all",
        collapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {showUserInfo && (
        <div className="p-4">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-white",
                  roleColor
                )}
              >
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col">
                <p className="font-medium">{user?.name || "User Name"}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-white",
                  roleColor
                )}
              >
                {user?.name?.charAt(0) || "U"}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3">
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed && "justify-center"
                  )}
                >
                  {link.icon}
                  {!collapsed && <span>{link.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {onToggleCollapse && (
        <div className="p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onToggleCollapse}
          >
            {collapsed ? "››" : "‹‹"}
          </Button>
        </div>
      )}
    </aside>
  );
} 