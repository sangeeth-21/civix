import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import SupportTicket from "@/models/SupportTicket";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:admin:stats");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to admin stats", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Get current date for time-based queries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Fetch system statistics
    const [
      totalUsers,
      totalAgents,
      totalServices,
      totalBookings,
      activeUsers,
      pendingBookings,
      recentTickets,
      recentAuditLogs,
      recentSupportTickets
    ] = await Promise.all([
      // Count total users
      User.countDocuments({ role: "USER" }),
      
      // Count total agents
      User.countDocuments({ role: "AGENT" }),
      
      // Count total services
      Service.countDocuments({}),
      
      // Count total bookings
      Booking.countDocuments({}),
      
      // Count active users (logged in within the last week)
      User.countDocuments({ lastLogin: { $gte: lastWeek } }),
      
      // Count pending bookings
      Booking.countDocuments({ status: "PENDING" }),
      
      // Count open support tickets
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      
      // Get recent audit logs
      AuditLog?.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name email")
        .lean(),
      
      // Get recent support tickets
      SupportTicket.find({ status: { $in: ["open", "in_progress"] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name email")
        .lean()
    ]);
    
    // Determine system health based on metrics
    // This is a simple example - in a real system you might check more sophisticated metrics
    let systemHealth = "good";
    
    if (pendingBookings > 50 || recentTickets > 20) {
      systemHealth = "warning";
    }
    
    if (pendingBookings > 100 || recentTickets > 50) {
      systemHealth = "critical";
    }
    
    // Prepare response
    const responseData = {
      totalUsers,
      totalAgents,
      totalServices,
      totalBookings,
      activeUsers,
      pendingBookings,
      recentTickets,
      systemHealth,
      recentAuditLogs,
      recentSupportTickets
    };
    
    logger.info("Admin stats retrieved successfully", {
      userId: session.user.id,
      metrics: {
        totalUsers,
        totalAgents,
        totalServices,
        totalBookings,
        activeUsers,
        pendingBookings,
        recentTickets,
        systemHealth
      }
    });
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    logger.error("Error fetching admin stats", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
} 