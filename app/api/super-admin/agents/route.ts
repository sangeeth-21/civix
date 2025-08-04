import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import Booking from "@/models/Booking";

const logger = createNamespaceLogger("api:super-admin:agents");

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const performance = searchParams.get("performance") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: Record<string, unknown> = {
      role: { $in: ["AGENT", "ADMIN"] }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query
    const agents = await User.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const totalCount = await User.countDocuments(query);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Add real performance data from bookings
    const agentsWithPerformance = await Promise.all(
      agents.map(async (agent: Record<string, unknown>) => {
        const agentId = agent._id;
        
        // Get agent's booking statistics
        const bookingStats = await Booking.aggregate([
          {
            $match: { agentId: agentId }
          },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              completedBookings: {
                $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
              },
              cancelledBookings: {
                $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] }
              },
              totalRevenue: {
                $sum: {
                  $cond: [{ $eq: ["$status", "COMPLETED"] }, "$totalAmount", 0]
                }
              },
              averageRating: { $avg: "$rating" },
              avgResponseTime: {
                $avg: {
                  $subtract: ["$updatedAt", "$createdAt"]
                }
              }
            }
          }
        ]);

        const stats = bookingStats[0] || {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          avgResponseTime: 0
        };

        const completionRate = stats.totalBookings > 0 
          ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(1)
          : "0.0";

        const responseTimeHours = stats.avgResponseTime > 0 
          ? Math.round(stats.avgResponseTime / (1000 * 60 * 60))
          : 0;

        return {
          ...agent,
          performance: {
            totalBookings: stats.totalBookings,
            completedBookings: stats.completedBookings,
            cancelledBookings: stats.cancelledBookings,
            totalRevenue: stats.totalRevenue,
            averageRating: stats.averageRating.toFixed(1),
            responseTime: responseTimeHours,
            completionRate
          }
        };
      })
    );

    // Filter by performance if specified
    let filteredAgents = agentsWithPerformance;
    if (performance === "high") {
      filteredAgents = agentsWithPerformance.filter((agent: Record<string, unknown> & { performance: { averageRating: string } }) => 
        parseFloat(agent.performance.averageRating) >= 4.5
      );
    } else if (performance === "low") {
      filteredAgents = agentsWithPerformance.filter((agent: Record<string, unknown> & { performance: { averageRating: string } }) => 
        parseFloat(agent.performance.averageRating) < 3.0
      );
    }

    logger.info("Super admin fetched agents", {
      userId: session.user.id,
      count: filteredAgents.length,
      page,
      limit
    });

    return NextResponse.json({
      data: filteredAgents,
      pagination: {
        page,
        limit,
        totalCount: filteredAgents.length,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    logger.error("Error fetching agents", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { name, email, phone, role, password, isActive = true } = body;

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new agent
    const agent = new User({
      name,
      email,
      phone,
      role,
      password,
      isActive
    });

    await agent.save();

    logger.info("Super admin created agent", {
      userId: session.user.id,
      agentId: agent._id,
      agentEmail: email
    });

    return NextResponse.json({
      message: "Agent created successfully",
      data: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive
      }
    });

  } catch (error) {
    logger.error("Error creating agent", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 