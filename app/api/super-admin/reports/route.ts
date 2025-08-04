import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
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

    // Get overview statistics
    const [
      totalUsers,
      totalAgents,
      totalAdmins,
      totalServices,
      totalBookings,
      totalRevenue,
      averageRating,
      systemUptime
    ] = await Promise.all([
      User.countDocuments({ role: "USER" }),
      User.countDocuments({ role: "AGENT" }),
      User.countDocuments({ role: "ADMIN" }),
      Service.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).then(result => result[0]?.total || 0),
      Booking.aggregate([
        { $match: { rating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } }
      ]).then(result => result[0]?.avg || 0),
      Promise.resolve(99.9) // System uptime would come from monitoring tools in production
    ]);

    // Get trends data from database
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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

    const revenueGrowth = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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

    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get performance data from database
    const topAgents = await User.aggregate([
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
          averageRating: { $avg: "$bookings.rating" },
          completionRate: {
            $multiply: [
              {
                $divide: [
                  { $size: { $filter: { input: "$bookings", cond: { $eq: ["$$this.status", "COMPLETED"] } } } },
                  { $size: "$bookings" }
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    const topServices = await Service.aggregate([
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
          },
          averageRating: { $avg: "$bookings.rating" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    const categoryBreakdown = await Service.aggregate([
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
          bookings: { $sum: { $size: "$bookings" } },
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
          }
        }
      },
      {
        $project: {
          category: "$_id",
          bookings: 1,
          revenue: 1,
          percentage: { $multiply: [{ $divide: ["$revenue", totalRevenue] }, 100] }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Calculate analytics data from database
    const userRetention = await User.aggregate([
      {
        $match: { role: "USER" }
      },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "userId",
          as: "bookings"
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          usersWithBookings: {
            $sum: { $cond: [{ $gt: [{ $size: "$bookings" }, 0] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          userRetention: { $multiply: [{ $divide: ["$usersWithBookings", "$totalUsers"] }, 100] }
        }
      }
    ]).then(result => result[0]?.userRetention || 0);

    const bookingConversion = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          bookingConversion: { $multiply: [{ $divide: ["$completedBookings", "$totalBookings"] }, 100] }
        }
      }
    ]).then(result => result[0]?.bookingConversion || 0);

    const averageResponseTime = await Booking.aggregate([
      {
        $match: { status: "COMPLETED" }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageResponseTime: { $avg: "$responseTime" }
        }
      }
    ]).then(result => result[0]?.averageResponseTime || 0);

    const customerSatisfaction = await Booking.aggregate([
      {
        $match: { rating: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: null,
          customerSatisfaction: { $avg: "$rating" }
        }
      }
    ]).then(result => result[0]?.customerSatisfaction || 0);

    // System performance metrics (these would come from monitoring tools in production)
    const systemPerformance = {
      cpu: 0, // Would be fetched from system monitoring
      memory: 0, // Would be fetched from system monitoring
      disk: 0, // Would be fetched from system monitoring
      network: 0 // Would be fetched from system monitoring
    };

    logger.info("Super admin fetched reports data", {
      userId: session.user.id,
      days
    });

    return NextResponse.json({
      data: {
        overview: {
          totalUsers,
          totalAgents,
          totalAdmins,
          totalServices,
          totalBookings,
          totalRevenue,
          averageRating,
          systemUptime
        },
        trends: {
          userGrowth,
          revenueGrowth,
          bookingTrends
        },
        performance: {
          topAgents,
          topServices,
          categoryBreakdown
        },
        analytics: {
          userRetention,
          bookingConversion,
          averageResponseTime,
          customerSatisfaction,
          systemPerformance
        }
      }
    });

  } catch (error) {
    logger.error("Error fetching reports data", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 