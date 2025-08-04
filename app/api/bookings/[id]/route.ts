import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Booking from "@/models/Booking";
import { AuditActions, createAuditLog } from "@/models/AuditLog";
import { BookingNotificationService } from "@/lib/services/booking-notification";
import { createNamespaceLogger } from "@/lib/logger";
import mongoose from "mongoose";

const logger = createNamespaceLogger("api:bookings:[id]");

// Define the route params interface
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET handler for fetching a specific booking
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    
    // Fetch booking with populated references
    const booking = await Booking.findById(bookingId)
      .populate("userId", "name email")
      .populate("agentId", "name email")
      .populate("serviceId", "title description price category")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Safe extraction of userId and agentId
    const ownerId = typeof booking.userId === 'object' && booking.userId !== null && '_id' in booking.userId
      ? (booking.userId as any)._id.toString()
      : (booking.userId as any)?.toString?.() ?? '';
    const agentId = typeof booking.agentId === 'object' && booking.agentId !== null && '_id' in booking.agentId
      ? (booking.agentId as any)._id.toString()
      : (booking.agentId as any)?.toString?.() ?? '';
    const isOwner = ownerId === session.user.id;
    const isAgent = agentId === session.user.id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error("Error fetching booking", {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PATCH handler for updating a booking
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    const body = await request.json();
    const { status, scheduledDate, notes, agentNotes } = body;

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this booking
    const isOwner = booking.userId.toString() === session.user.id;
    const isAgent = booking.agentId.toString() === session.user.id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Track if the status was changed
    const statusChanged = status && status !== booking.status;
    const oldStatus = booking.status;
    
    // Update allowed fields based on role
    if (status && (isAgent || isAdmin)) {
      booking.status = status;
      booking.lastStatusUpdate = new Date();
      
      // Add to status history
      if (!booking.statusHistory) booking.statusHistory = [];
      booking.statusHistory.push({
        status,
        updatedAt: new Date(),
        updatedBy: new mongoose.Types.ObjectId(session.user.id)
      });
    }

    if (scheduledDate && (isAgent || isAdmin)) {
      booking.scheduledDate = new Date(scheduledDate);
    }

    if (notes !== undefined) {
      booking.notes = notes;
    }
    
    if (agentNotes !== undefined && (isAgent || isAdmin)) {
      booking.agentNotes = agentNotes;
    }

    // Save updated booking
    await booking.save();

    // Create audit log
    await createAuditLog(
      session.user.id,
      AuditActions.BOOKING_UPDATED,
      {
        entityId: bookingId,
        entityType: "Booking",
        details: {
          updatedBy: session.user.id,
          changes: {
            status: status ? { before: oldStatus, after: status } : undefined,
            scheduledDate: scheduledDate ? { before: booking.scheduledDate, after: scheduledDate } : undefined,
            notes: notes !== undefined ? { before: booking.notes, after: notes } : undefined,
            agentNotes: agentNotes !== undefined ? { before: booking.agentNotes, after: agentNotes } : undefined,
          },
        },
      }
    );
    
    // Send notifications if status changed
    if (statusChanged) {
      // Trigger notification asynchronously (don't block the response)
      Promise.resolve().then(async () => {
        try {
          const { userEmailSent, agentEmailSent } = await BookingNotificationService.sendStatusUpdateNotification({
            bookingId,
            newStatus: status,
            updatedBy: session.user.id
          });
          
          logger.info("Booking status update notification sent", {
            bookingId,
            newStatus: status,
            userEmailSent,
            agentEmailSent
          });
        } catch (notificationError) {
          logger.error("Failed to send booking status notification", {
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            bookingId,
            status
          });
        }
      });
    }

    // Return updated booking
    const updatedBooking = await Booking.findById(bookingId)
      .populate("userId", "name email")
      .populate("agentId", "name email")
      .populate("serviceId", "title description price category");

    return NextResponse.json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    logger.error("Error updating booking", {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE handler for canceling a booking
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to cancel this booking
    const isOwner = booking.userId.toString() === session.user.id;
    const isAgent = booking.agentId.toString() === session.user.id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Only allow cancellation if booking is not completed
    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Cannot cancel completed booking" },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const oldStatus = booking.status;
    booking.status = "CANCELLED";
    booking.lastStatusUpdate = new Date();
    
    // Add to status history
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push({
      status: "CANCELLED",
      updatedAt: new Date(),
      updatedBy: new mongoose.Types.ObjectId(session.user.id)
    });
    
    await booking.save();

    // Create audit log
    await createAuditLog(
      session.user.id,
      AuditActions.BOOKING_CANCELLED,
      {
        entityId: bookingId,
        entityType: "Booking",
        details: {
          cancelledBy: session.user.id,
          previousStatus: oldStatus,
          reason: "User requested cancellation",
        },
      }
    );
    
    // Send cancellation notification asynchronously
    Promise.resolve().then(async () => {
      try {
        const { userEmailSent, agentEmailSent } = await BookingNotificationService.sendStatusUpdateNotification({
          bookingId,
          newStatus: "CANCELLED",
          updatedBy: session.user.id
        });
        
        logger.info("Booking cancellation notification sent", {
          bookingId,
          userEmailSent,
          agentEmailSent
        });
      } catch (notificationError) {
        logger.error("Failed to send booking cancellation notification", {
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
          bookingId
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    logger.error("Error cancelling booking", {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
} 