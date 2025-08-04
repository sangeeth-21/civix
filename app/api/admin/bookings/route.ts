import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import User from "@/models/User";
import { AuditActions, createAuditLog } from "@/models/AuditLog";
import { z } from "zod";
import mongoose from "mongoose";

const logger = createNamespaceLogger("api:admin:bookings");

// Schema for query parameters
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  userId: z.string().optional(),
  agentId: z.string().optional(),
  serviceId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sort: z.string().optional().default("scheduledDate"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Schema for booking update
const BookingUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

// GET handler for listing bookings
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to admin bookings API", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const {
      page,
      limit,
      status,
      userId,
      agentId,
      serviceId,
      fromDate,
      toDate,
      sort,
      order
    } = QuerySchema.parse(queryParams);
    
    // Connect to database
    await connectDB();
    
    // Build query
    const query: Record<string, unknown> = {};
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add userId filter if provided
    if (userId) {
      query.userId = userId;
    }
    
    // Add agentId filter if provided
    if (agentId) {
      query.agentId = agentId;
    }
    
    // Add serviceId filter if provided
    if (serviceId) {
      query.serviceId = serviceId;
    }
    
    // Add date range filter if provided
    if (fromDate || toDate) {
      query.scheduledDate = {};
      
      if (fromDate) {
        (query.scheduledDate as Record<string, unknown>).$gte = new Date(fromDate);
      }
      
      if (toDate) {
        (query.scheduledDate as Record<string, unknown>).$lte = new Date(toDate);
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Determine sort direction
    const sortDirection = order === "asc" ? 1 : -1;
    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sort] = sortDirection as 1 | -1;
    
    // Execute query with pagination
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("userId", "name email phone")
        .populate("agentId", "name email phone")
        .populate("serviceId", "title price category")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    logger.info("Admin bookings list retrieved successfully", {
      userId: session.user.id,
      page,
      limit,
      totalCount,
      filters: { status, userId, agentId, serviceId, fromDate, toDate },
    });
    
    return NextResponse.json({
      data: bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid query parameters", {
        error: "Zod validation failed",
      });
      
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }
    
    logger.error("Error fetching bookings list", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// PATCH handler for updating a booking
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to update booking", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate bookingId parameter
    const bookingId = body.bookingId;
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }
    
    // Validate update data
    const updateData = BookingUpdateSchema.parse(body.data);
    
    // Connect to database
    await connectDB();
    
    // Find booking to update
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      logger.warn("Booking not found for update", {
        adminId: session.user.id,
        bookingId,
      });
      
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Track changes for audit log
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    
    // Apply updates
    if (updateData.status !== undefined) {
      changes.status = {
        before: booking.status,
        after: updateData.status
      };
      booking.status = updateData.status;
    }
    
    if (updateData.scheduledDate !== undefined) {
      changes.scheduledDate = {
        before: booking.scheduledDate,
        after: new Date(updateData.scheduledDate)
      };
      booking.scheduledDate = new Date(updateData.scheduledDate);
    }
    
    if (updateData.notes !== undefined) {
      changes.notes = {
        before: booking.notes,
        after: updateData.notes
      };
      booking.notes = updateData.notes || undefined;
    }
    
    // Save updated booking
    await booking.save();
    
    // Determine appropriate audit action based on status change
    let auditAction = AuditActions.BOOKING_UPDATED;
    
    if (updateData.status === "CANCELLED" && booking.status !== "CANCELLED") {
      auditAction = AuditActions.BOOKING_CANCELLED;
    } else if (updateData.status === "COMPLETED" && booking.status !== "COMPLETED") {
      auditAction = AuditActions.BOOKING_COMPLETED;
    }
    
    // Create audit log
    await createAuditLog(
      session.user.id,
      auditAction,
      {
        entityId: bookingId,
        entityType: "Booking",
        details: {
          changes,
          updatedBy: session.user.id,
        },
      }
    );
    
    logger.info("Booking updated successfully by admin", {
      adminId: session.user.id,
      bookingId,
      changes: Object.keys(changes),
    });
    
    // Return updated booking
    const updatedBooking = await Booking.findById(bookingId)
      .populate("userId", "name email")
      .populate("agentId", "name email")
      .populate("serviceId", "title price category");
    
    return NextResponse.json({
      message: "Booking updated successfully",
      data: updatedBooking,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid update data", {
        error: "Zod validation failed",
      });
      
      return NextResponse.json(
        { error: "Invalid update data" },
        { status: 400 }
      );
    }
    
    logger.error("Error updating booking", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new booking
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to create booking", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Create schema for booking creation
    const BookingCreateSchema = z.object({
      userId: z.string(),
      serviceId: z.string(),
      scheduledDate: z.string(),
      status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional().default("PENDING"),
      notes: z.string().optional(),
    });
    
    // Validate booking data
    const bookingData = BookingCreateSchema.parse(body);
    
    // Connect to database
    await connectDB();
    
    // Verify user exists
    const user = await User.findById(bookingData.userId);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // Verify service exists and get agent ID
    const service = await Service.findById(bookingData.serviceId);
    if (!service) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }
    
    // Add agent ID from service
    const bookingWithAgentId = {
      ...bookingData,
      agentId: service.agentId,
      amount: service.price,
      totalAmount: service.price,
      scheduledDate: new Date(bookingData.scheduledDate)
    };
    
    // Create new booking
    const newBooking = await Booking.create(bookingWithAgentId);
    
    // Create audit log
    await createAuditLog(
      session.user.id,
      AuditActions.BOOKING_CREATED,
      {
        entityId: (newBooking._id as mongoose.Types.ObjectId).toString(),
        entityType: "Booking",
        details: {
          booking: {
            userId: newBooking.userId,
            serviceId: newBooking.serviceId,
            agentId: newBooking.agentId,
            scheduledDate: newBooking.scheduledDate,
            status: newBooking.status,
          },
          createdBy: session.user.id,
        },
      }
    );
    
    logger.info("New booking created successfully by admin", {
      adminId: session.user.id,
      bookingId: newBooking._id,
      userId: newBooking.userId,
      serviceId: newBooking.serviceId,
    });
    
    // Return created booking
    const createdBooking = await Booking.findById(newBooking._id)
      .populate("userId", "name email")
      .populate("agentId", "name email")
      .populate("serviceId", "title price category");
    
    return NextResponse.json({
      message: "Booking created successfully",
      data: createdBooking,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid booking data", {
        error: "Zod validation failed",
      });
      
      return NextResponse.json(
        { error: "Invalid booking data" },
        { status: 400 }
      );
    }
    
    logger.error("Error creating booking", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
} 