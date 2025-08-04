import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:bookings");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to super admin bookings", {
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
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const dateFilter = searchParams.get("dateFilter") || "";
    const agentId = searchParams.get("agentId") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Build query
    const query: Record<string, unknown> = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { "serviceId.title": { $regex: search, $options: "i" } },
        { "userId.name": { $regex: search, $options: "i" } },
        { "userId.email": { $regex: search, $options: "i" } },
        { "agentId.name": { $regex: search, $options: "i" } },
        { "agentId.email": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add date filter
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case "today":
          query.scheduledDate = {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          };
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          query.scheduledDate = { $gte: weekAgo };
          break;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          query.scheduledDate = { $gte: monthAgo };
          break;
        case "past":
          query.scheduledDate = { $lt: today };
          break;
      }
    }
    
    // Add agent filter
    if (agentId) {
      query.agentId = agentId;
    }
    
    // Add payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("serviceId", "title description price category")
        .populate("userId", "name email phone")
        .populate("agentId", "name email phone")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_BOOKINGS",
      entityType: "BOOKING",
      details: {
        page,
        limit,
        search,
        status,
        dateFilter,
        agentId,
        paymentStatus,
        totalCount
      }
    });
    
    logger.info("Super admin viewed bookings list", {
      userId: session.user.id,
      page,
      limit,
      totalCount
    });
    
    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    logger.error("Error fetching bookings", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to create booking", {
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
    
    // Get request body
    const body = await req.json();
    const { serviceId, userId, agentId, scheduledDate, notes, totalAmount } = body;
    
    // Validate required fields
    if (!serviceId || !userId || !agentId || !scheduledDate || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create booking
    const booking = await Booking.create({
      serviceId,
      userId,
      agentId,
      scheduledDate: new Date(scheduledDate),
      notes,
      totalAmount,
      status: "PENDING",
      paymentStatus: "PENDING"
    });
    
    // Populate the booking data
    const populatedBooking = await Booking.findById(booking._id)
      .populate("serviceId", "title description price category")
      .populate("userId", "name email phone")
      .populate("agentId", "name email phone")
      .lean();
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "CREATE_BOOKING",
      entityType: "BOOKING",
      entityId: booking._id,
      details: {
        serviceId,
        userId,
        agentId,
        scheduledDate,
        totalAmount
      }
    });
    
    logger.info("Super admin created booking", {
      userId: session.user.id,
      bookingId: booking._id,
      serviceId,
      agentId
    });
    
    return NextResponse.json({
      success: true,
      data: populatedBooking
    });
    
  } catch (error) {
    logger.error("Error creating booking", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 