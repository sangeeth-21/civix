"use client";

import { useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";

interface UserAuthProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
}

export function UserAuth({ user }: UserAuthProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/",
      });
    } catch (error) {
      // Handle sign out error silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  // If user is authenticated, show profile and sign out button
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <p className="text-sm font-medium">{user.name || user.email}</p>
          {user.role && (
            <p className="text-xs text-muted-foreground">{user.role}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Log Out</span>
            </>
          )}
        </Button>
        {user.role === "USER" && (
          <Link href="/user/dashboard">
            <Button size="sm">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          </Link>
        )}
        {user.role === "AGENT" && (
          <Link href="/agent/dashboard">
            <Button size="sm">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          </Link>
        )}
        {user.role === "ADMIN" && (
          <Link href="/admin/dashboard">
            <Button size="sm">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          </Link>
        )}
        {user.role === "SUPER_ADMIN" && (
          <Link href="/super-admin/dashboard">
            <Button size="sm">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // If user is not authenticated, show sign in and register buttons
  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          {/* <LogIn className="mr-2 h-4 w-4" /> */}
          <span className="hidden md:inline">Log In</span>
        </Button>
      </Link>
      <Link href="/register">
        <Button size="sm">
          <span>Register</span>
        </Button>
      </Link>
    </div>
  );
} 