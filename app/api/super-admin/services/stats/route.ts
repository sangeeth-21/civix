import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:services:stats");

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to service stats", {
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
    
    // Get service statistics
    const [
      totalServices,
      activeServices,
      inactiveServices,
      featuredServices,
      totalRevenue,
      averageRating
    ] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: false }),
      Service.countDocuments({ isFeatured: true }),
      Service.aggregate([
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]).then(result => result[0]?.total || 0),
      Service.aggregate([
        { $group: { _id: null, avg: { $avg: "$rating" } } }
      ]).then(result => result[0]?.avg || 0)
    ]);
    
    // Get top categories
    const topCategories = await Service.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get top agents by service count
    const topAgents = await Service.aggregate([
      { $group: { _id: "$agentId", servicesCount: { $sum: 1 } } },
      { $sort: { servicesCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "agent"
        }
      },
      { $unwind: "$agent" },
      {
        $project: {
          _id: "$agent._id",
          name: "$agent.name",
          email: "$agent.email",
          servicesCount: 1,
          avatar: "$agent.profile.avatar"
        }
      }
    ]);
    
    // Get category breakdown with real revenue from bookings
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
          count: { $sum: 1 },
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
          count: 1,
          revenue: 1,
          percentage: { $multiply: [{ $divide: ["$count", totalServices] }, 100] }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_SERVICE_STATS",
      entityType: "SERVICE",
      details: {
        totalServices,
        activeServices,
        inactiveServices
      }
    });
    
    logger.info("Super admin viewed service statistics", {
      userId: session.user.id,
      totalServices,
      activeServices
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalServices,
        activeServices,
        inactiveServices,
        featuredServices,
        totalRevenue,
        averageRating,
        topCategories: categoryBreakdown,
        topAgents
      }
    });
    
  } catch (error) {
    logger.error("Error fetching service statistics", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 