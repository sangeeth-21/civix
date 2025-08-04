import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { createNamespaceLogger } from "@/lib/logger";

const logger = createNamespaceLogger("api:admin:reports");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic counts
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAgents = await User.countDocuments({ role: "agent" });
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Get active users (logged in within last 30 days)
    const activeUsersDate = new Date();
    activeUsersDate.setDate(activeUsersDate.getDate() - 30);
    const activeUsers = await User.countDocuments({
      role: "user",
      lastLogin: { $gte: activeUsersDate }
    });

    // Get booking statistics
    const pendingBookings = await Booking.countDocuments({ status: "PENDING" });
    const completedBookings = await Booking.countDocuments({ status: "COMPLETED" });
    const cancelledBookings = await Booking.countDocuments({ status: "CANCELLED" });

    // Get total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Get average rating
    const ratingResult = await Booking.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } }
    ]);
    const averageRating = ratingResult[0]?.averageRating || 0;

    // Get top performing agents
    const topPerformingAgents = await Booking.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { 
        _id: "$agentId", 
        bookingsCount: { $sum: 1 },
        totalRevenue: { $sum: "$amount" },
        averageRating: { $avg: "$rating" }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
      { $unwind: "$agent" },
      { $project: {
        _id: "$agent._id",
        name: "$agent.name",
        bookingsCount: 1,
        totalRevenue: 1,
        rating: { $round: ["$averageRating", 1] }
      }}
    ]);

    // Get popular services
    const popularServices = await Booking.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { 
        _id: "$serviceId", 
        bookingsCount: { $sum: 1 },
        totalRevenue: { $sum: "$amount" }
      }},
      { $sort: { bookingsCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } },
      { $unwind: "$service" },
      { $project: {
        _id: "$service._id",
        title: "$service.title",
        bookingsCount: 1,
        totalRevenue: 1
      }}
    ]);

    // Get monthly statistics for the specified period
    const monthlyStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        bookings: { $sum: 1 },
        revenue: { $sum: "$amount" }
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $project: {
        month: { 
          $concat: [
            { $toString: "$_id.year" },
            "-",
            { $cond: { if: { $lt: ["$_id.month", 10] }, then: "0", else: "" } },
            { $toString: "$_id.month" }
          ]
        },
        bookings: 1,
        revenue: 1
      }}
    ]);

    // Get category breakdown
    const categoryBreakdown = await Service.aggregate([
      { $group: {
        _id: "$category",
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $project: {
        category: "$_id",
        count: 1,
        revenue: 0 // This would need to be calculated from bookings
      }}
    ]);

    // Calculate revenue for each category
    const categoryRevenue = await Booking.aggregate([
      { $match: { status: "COMPLETED" } },
      { $lookup: { from: "services", localField: "serviceId", foreignField: "_id", as: "service" } },
      { $unwind: "$service" },
      { $group: {
        _id: "$service.category",
        revenue: { $sum: "$amount" }
      }}
    ]);

    // Merge category breakdown with revenue
    const categoryBreakdownWithRevenue = categoryBreakdown.map(cat => {
      const revenue = categoryRevenue.find(r => r._id === cat.category);
      return {
        ...cat,
        revenue: revenue?.revenue || 0
      };
    });

    const reportData = {
      totalUsers,
      totalAgents,
      totalServices,
      totalBookings,
      activeUsers,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      topPerformingAgents,
      popularServices,
      monthlyStats,
      categoryBreakdown: categoryBreakdownWithRevenue
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    logger.error("Error fetching report data", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 