import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:bookings:dashboard");

/**
 * API route that returns bookings data grouped by status for dashboard displays
 * Supports real-time polling with a timestamp parameter to only return data changed since last poll
 */
export async function GET(request: NextRequest) {
  let userId: string | undefined;
  
  try {
    // Authenticate user
    const session = await auth();
    userId = session?.user?.id;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const sinceTimestamp = searchParams.get('since'); // timestamp to get only updated bookings
    
    // Build filter based on user role and permissions
    const filter: Record<string, any> = {};
    
    // Apply role-based access control
    switch(session.user.role) {
      case "USER":
        // Regular users can only see their own bookings
        filter.userId = userId;
        break;
      case "AGENT":
        // Agents can only see bookings assigned to them
        filter.agentId = userId;
        break;
      case "ADMIN":
      case "SUPER_ADMIN":
        // Admins can see all bookings
        break;
      default:
        logger.warn("Unauthorized access attempt", { userId, role: session.user.role });
        return NextResponse.json(
          { success: false, error: 'Unauthorized access' },
          { status: 403 }
        );
    }
    
    // If 'since' parameter is provided, only get bookings updated since that time
    if (sinceTimestamp) {
      try {
        const since = new Date(sinceTimestamp);
        filter.$or = [
          { updatedAt: { $gte: since } },
          { lastStatusUpdate: { $gte: since } }
        ];
      } catch (e) {
        logger.warn("Invalid timestamp format", { sinceTimestamp });
        // Ignore the parameter if it's invalid
      }
    }
    
    // Perform aggregation to group bookings by status
    const bookings = await Booking.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails"
        }
      },
      { $unwind: { path: "$serviceDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "agentId",
          foreignField: "_id",
          as: "agentDetails"
        }
      },
      { $unwind: { path: "$agentDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          status: 1,
          scheduledDate: 1,
          amount: 1,
          totalAmount: 1,
          notes: 1,
          agentNotes: 1,
          createdAt: 1,
          updatedAt: 1,
          lastStatusUpdate: 1,
          service: {
            _id: "$serviceDetails._id",
            title: "$serviceDetails.title",
            category: "$serviceDetails.category",
            price: "$serviceDetails.price"
          },
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            phone: "$userDetails.phone"
          },
          agent: {
            _id: "$agentDetails._id",
            name: "$agentDetails.name",
            email: "$agentDetails.email",
            phone: "$agentDetails.phone"
          }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          bookings: { $push: "$$ROOT" },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          status: "$_id",
          _id: 0,
          count: 1,
          totalAmount: 1,
          bookings: { $slice: ["$bookings", limit] }
        }
      }
    ]);
    
    // Calculate total statistics for all statuses
    const totalStats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } }
        }
      }
    ]);
    
    // Transform results into an object with status as keys
    const bookingsByStatus: Record<string, any> = {};
    bookings.forEach((group) => {
      bookingsByStatus[group.status] = {
        count: group.count,
        totalAmount: group.totalAmount,
        bookings: group.bookings
      };
    });
    
    // Ensure all status groups exist even if empty
    ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].forEach(status => {
      if (!bookingsByStatus[status]) {
        bookingsByStatus[status] = {
          count: 0,
          totalAmount: 0,
          bookings: []
        };
      }
    });
    
    // Format response with grouped bookings and overall stats
    const response = {
      bookingsByStatus,
      stats: totalStats.length > 0 ? {
        total: totalStats[0].total,
        totalAmount: totalStats[0].totalAmount,
        pending: totalStats[0].pending,
        confirmed: totalStats[0].confirmed,
        completed: totalStats[0].completed,
        cancelled: totalStats[0].cancelled
      } : {
        total: 0,
        totalAmount: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      },
      timestamp: new Date().toISOString()
    };
    
    logger.info("Bookings dashboard data fetched", { 
      userId, 
      role: session.user.role,
      bookingsCount: response.stats.total,
      hasSinceFilter: !!sinceTimestamp
    });
    
    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error("Error fetching dashboard bookings", {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
} 