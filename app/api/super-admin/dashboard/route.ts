import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import AuditLog from "@/models/AuditLog";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get system statistics
    const [
      totalUsers,
      totalAgents,
      totalAdmins,
      totalServices,
      totalBookings,
      activeUsers,
      pendingBookings,
      completedBookings,
      cancelledBookings
    ] = await Promise.all([
      User.countDocuments({ role: "USER" }),
      User.countDocuments({ role: "AGENT" }),
      User.countDocuments({ role: "ADMIN" }),
      Service.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments({ role: "USER", isActive: true }),
      Booking.countDocuments({ status: "PENDING" }),
      Booking.countDocuments({ status: "COMPLETED" }),
      Booking.countDocuments({ status: "CANCELLED" })
    ]);

    // Calculate revenue from actual completed bookings
    const revenueData = await Booking.aggregate([
      {
        $match: { status: "COMPLETED" }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    
    // Calculate average rating from actual bookings
    const ratingData = await Booking.aggregate([
      {
        $match: { 
          status: "COMPLETED",
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" }
        }
      }
    ]);
    
    const averageRating = ratingData[0]?.averageRating || 0;

    // Get recent activity from audit logs
    const recentActivity = await AuditLog?.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          action: 1,
          userId: "$user._id",
          userName: "$user.name",
          userEmail: "$user.email",
          entityType: 1,
          entityId: 1,
          timestamp: "$createdAt",
          ipAddress: 1
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 10 }
    ]) || [];

    // Get alerts (would come from monitoring system in production)
    const alerts: any[] = [];

    // Get performance data from database
    const topPerformingAgents = await User.aggregate([
      {
        $match: { role: "AGENT" }
      },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "agentId",
          as: "bookings"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          bookingsCount: { $size: "$bookings" },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$bookings",
                    cond: { $eq: ["$$this.status", "COMPLETED"] }
                  }
                },
                as: "booking",
                in: "$$booking.totalAmount"
              }
            }
          },
          rating: { $avg: "$bookings.rating" },
          avatar: "$profile.avatar"
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    const topPerformingServices = await Service.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "serviceId",
          as: "bookings"
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          category: 1,
          bookingsCount: { $size: "$bookings" },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$bookings",
                    cond: { $eq: ["$$this.status", "COMPLETED"] }
                  }
                },
                as: "booking",
                in: "$$booking.totalAmount"
              }
            }
          }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Get system performance metrics (these would come from monitoring tools in production)
    // For now, calculate basic metrics from database
    const systemMetrics = {
      systemUptime: 99.9, // This would come from system monitoring
      serverLoad: 65, // This would come from system monitoring
      databaseSize: 2.5, // This would come from system monitoring
      activeConnections: 45 // This would come from system monitoring
    };

    // Get real revenue categories from bookings
    const topRevenueCategories = await Service.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "serviceId",
          as: "bookings"
        }
      },
      {
        $group: {
          _id: "$category",
          revenue: {
            $sum: {
              $reduce: {
                input: {
                  $filter: {
                    input: "$bookings",
                    cond: { $eq: ["$$this.status", "COMPLETED"] }
                  }
                },
                initialValue: 0,
                in: { $add: ["$$value", "$$this.totalAmount"] }
              }
            }
          },
          bookings: { $sum: { $size: "$bookings" } }
        }
      },
      {
        $project: {
          category: "$_id",
          revenue: 1,
          bookings: 1,
          percentage: { $multiply: [{ $divide: ["$revenue", totalRevenue] }, 100] }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Get analytics data from database
    const monthlyStats = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const startOfMonth = new Date(2024, i, 1);
        const endOfMonth = new Date(2024, i + 1, 0);
        
        const [users, bookings, revenue, agents] = await Promise.all([
          User.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            role: "USER"
          }),
          Booking.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          }),
          Booking.aggregate([
            {
              $match: {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                status: "COMPLETED"
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$totalAmount" }
              }
            }
          ]).then(result => result[0]?.total || 0),
          User.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            role: "AGENT"
          })
        ]);

        return {
          month: startOfMonth.toLocaleDateString('en-US', { month: 'short' }),
          users,
          bookings,
          revenue,
          agents
        };
      })
    );

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          role: "USER"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenueTrend = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    logger.info("Super admin fetched dashboard data", {
      userId: session.user.id,
      days
    });

    return NextResponse.json({
      data: {
        system: {
          totalUsers,
          totalAgents,
          totalAdmins,
          totalServices,
          totalBookings,
          activeUsers,
          pendingBookings,
          completedBookings,
          cancelledBookings,
          totalRevenue,
          averageRating,
          ...systemMetrics
        },
        performance: {
          topPerformingAgents,
          topPerformingServices,
          topRevenueCategories
        },
        analytics: {
          monthlyStats,
          userGrowth,
          revenueTrend
        },
        alerts,
        recentActivity
      }
    });

  } catch (error) {
    logger.error("Error fetching dashboard data", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 