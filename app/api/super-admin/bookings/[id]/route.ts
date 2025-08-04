import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:bookings:[id]");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to view booking", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        bookingId: resolvedParams.id,
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find booking by ID
    const booking = await Booking.findById(resolvedParams.id)
      .populate("serviceId", "title description price category")
      .populate("userId", "name email phone")
      .populate("agentId", "name email phone")
      .lean();
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_BOOKING_DETAILS",
      entityType: "BOOKING",
      entityId: booking._id,
      details: {
        serviceId: booking.serviceId._id,
        userId: booking.userId._id,
        agentId: booking.agentId._id,
        status: booking.status
      }
    });
    
    logger.info("Super admin viewed booking details", {
      userId: session.user.id,
      bookingId: booking._id,
      status: booking.status
    });
    
    return NextResponse.json({
      success: true,
      data: booking
    });
    
  } catch (error) {
    logger.error("Error fetching booking", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to update booking", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        bookingId: resolvedParams.id,
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
    const { status, scheduledDate, notes, agentNotes, totalAmount, paymentStatus } = body;
    
    // Find booking by ID
    const booking = await Booking.findById(resolvedParams.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);
    if (notes !== undefined) updateData.notes = notes;
    if (agentNotes !== undefined) updateData.agentNotes = agentNotes;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    
    // Validate status if provided
    if (status && !["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    
    // Validate payment status if provided
    if (paymentStatus && !["PENDING", "PAID", "REFUNDED"].includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 }
      );
    }
    
    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { new: true }
    )
      .populate("serviceId", "title description price category")
      .populate("userId", "name email phone")
      .populate("agentId", "name email phone")
      .lean();
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "UPDATE_BOOKING",
      entityType: "BOOKING",
      entityId: booking._id,
      details: {
        serviceId: booking.serviceId,
        userId: booking.userId,
        agentId: booking.agentId,
        changes: updateData
      }
    });
    
    logger.info("Super admin updated booking", {
      userId: session.user.id,
      bookingId: booking._id,
      changes: Object.keys(updateData)
    });
    
    return NextResponse.json({
      success: true,
      data: updatedBooking
    });
    
  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error updating booking", { error, bookingId: resolvedParams.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to delete booking", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        bookingId: resolvedParams.id,
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find booking by ID
    const booking = await Booking.findById(resolvedParams.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    // Soft delete booking (set status to CANCELLED)
    const deletedBooking = await Booking.findByIdAndUpdate(
      resolvedParams.id,
      { status: "CANCELLED" },
      { new: true }
    )
      .populate("serviceId", "title description price category")
      .populate("userId", "name email phone")
      .populate("agentId", "name email phone")
      .lean();
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "DELETE_BOOKING",
      entityType: "BOOKING",
      entityId: booking._id,
      details: {
        serviceId: booking.serviceId,
        userId: booking.userId,
        agentId: booking.agentId,
        status: booking.status
      }
    });
    
    logger.info("Super admin deleted booking", {
      userId: session.user.id,
      bookingId: booking._id,
      status: booking.status
    });
    
    return NextResponse.json({
      success: true,
      data: deletedBooking
    });
    
  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error deleting booking", { error, bookingId: resolvedParams.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 