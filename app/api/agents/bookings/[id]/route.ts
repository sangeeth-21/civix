import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import { createNamespaceLogger } from '@/lib/logger';
import * as z from 'zod';
import { checkAgentOwnership } from '@/lib/api-utils';
import { BookingNotificationService } from '@/lib/services/booking-notification';

const logger = createNamespaceLogger("api:agents:bookings:id");

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  agentNotes: z.string().max(2000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user || !["AGENT", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    if (!id) return NextResponse.json({ message: "Missing booking id" }, { status: 400 });
    const booking = await Booking.findById(id).populate("serviceId userId agentId");
    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    // DEBUG: Temporarily allow all agents to access any booking
    // if (session.user.role === "AGENT" && !checkAgentOwnership(booking.agentId?.toString(), session.user.id)) {
    //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    // }
    return NextResponse.json({ data: booking });
  } catch (error) {
    logger.error("Error fetching booking", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user || !["AGENT", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    if (!id) return NextResponse.json({ message: "Missing booking id" }, { status: 400 });
    const body = await request.json();
    const parseResult = patchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ message: "Invalid request", details: parseResult.error.issues }, { status: 400 });
    }
    const { status, agentNotes } = parseResult.data;
    
    // Get the current booking to check for status change
    const currentBooking = await Booking.findById(id);
    if (!currentBooking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    
    // Check if status is being updated
    const statusChanged = status && status !== currentBooking.status;
    
    let query: any = { _id: id };
    // AGENT can only update their own bookings
    if (session.user.role === "AGENT") {
      query.agentId = session.user.id;
    }
    
    const update: any = { $set: { updatedAt: new Date() } };
    if (status) update.$set.status = status;
    if (typeof agentNotes === "string") update.$set.agentNotes = agentNotes;
    
    // Add status history if status changed
    if (statusChanged) {
      update.$push = {
        statusHistory: {
          status: status,
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      };
      update.$set.lastStatusUpdate = new Date();
    }
    
    const booking = await Booking.findOneAndUpdate(
      query,
      update,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone')
     .populate('serviceId', 'title description price category');
    
    if (!booking) {
      return NextResponse.json({ message: "Booking not found or forbidden" }, { status: 404 });
    }
    
    logger.info("Booking updated", {
      userId: session.user.id,
      bookingId: id,
      updatedFields: Object.keys(parseResult.data),
      role: session.user.role
    });
    
    // Send email notifications if status changed
    if (statusChanged) {
      // Trigger notification asynchronously (don't block the response)
      Promise.resolve().then(async () => {
        try {
          const { userEmailSent, agentEmailSent } = await BookingNotificationService.sendStatusUpdateNotification({
            bookingId: id,
            newStatus: status,
            updatedBy: session.user.id
          });
          
          logger.info("Booking status update notification sent", {
            bookingId: id,
            newStatus: status,
            userEmailSent,
            agentEmailSent
          });
        } catch (notificationError) {
          logger.error("Failed to send booking status notification", {
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            bookingId: id,
            status
          });
        }
      });
    }
    
    return NextResponse.json({ data: booking, message: "Booking updated" });
  } catch (error) {
    logger.error("Error updating booking", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user || !["AGENT", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    if (!id) return NextResponse.json({ message: "Missing booking id" }, { status: 400 });
    let query: any = { _id: id };
    if (session.user.role === "AGENT") {
      query.agentId = session.user.id;
    }
    const booking = await Booking.findOneAndDelete(query);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found or forbidden" }, { status: 404 });
    }
    logger.info("Booking deleted", {
      userId: session.user.id,
      bookingId: id,
      role: session.user.role
    });
    return NextResponse.json({ message: "Booking deleted" });
  } catch (error) {
    logger.error("Error deleting booking", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}