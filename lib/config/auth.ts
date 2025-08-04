import { NextAuthConfig } from "next-auth";

// This file should only contain middleware auth config
// The main NextAuth configuration is in app/api/auth/[...nextauth]/route.ts

export const authConfig: NextAuthConfig = {
  providers: [], // Required by NextAuthConfig type, but actual providers are in route.ts
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute = 
        nextUrl.pathname.startsWith("/user") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/agent") ||
        nextUrl.pathname.startsWith("/super-admin");

      // Public routes are accessible to everyone
      if (!isOnProtectedRoute) return true;

      // Protected routes require authentication
      if (isOnProtectedRoute && !isLoggedIn) return false;
      
      // Role-based access checks
      const userRole = auth?.user?.role;
      if (nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") return false;
      if (nextUrl.pathname.startsWith("/agent") && userRole !== "AGENT" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") return false;
      if (nextUrl.pathname.startsWith("/super-admin") && userRole !== "SUPER_ADMIN") return false;
      if (nextUrl.pathname.startsWith("/user") && userRole !== "USER" && userRole !== "AGENT" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") return false;
      
      // If we get here, allow access
      return true;
    }
  }
}; 