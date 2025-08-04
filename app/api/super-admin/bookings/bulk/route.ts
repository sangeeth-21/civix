import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { logger } from "@/lib/logger";

export async function PATCH(request: NextRequest) {
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
    const { action, ids, value } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let message = "";

    switch (action) {
      case "confirm":
        updateData = { status: "CONFIRMED" };
        message = "Bookings confirmed successfully";
        break;
      
      case "complete":
        updateData = { status: "COMPLETED" };
        message = "Bookings marked as completed";
        break;
      
      case "cancel":
        updateData = { status: "CANCELLED" };
        message = "Bookings cancelled successfully";
        break;
      
      case "delete":
        // Delete bookings
        const deleteResult = await Booking.deleteMany({
          _id: { $in: ids }
        });
        
        logger.info("Super admin bulk deleted bookings", {
          userId: session.user.id,
          bookingIds: ids,
          deletedCount: deleteResult.deletedCount
        });
        
        return NextResponse.json({
          message: `${deleteResult.deletedCount} bookings deleted successfully`,
          deletedCount: deleteResult.deletedCount
        });
      
      case "assign_agent":
        if (!value) {
          return NextResponse.json(
            { error: "Agent ID is required for assignment" },
            { status: 400 }
          );
        }
        updateData = { agentId: value };
        message = "Agent assigned to bookings successfully";
        break;
      
      case "update_payment_status":
        if (!value) {
          return NextResponse.json(
            { error: "Payment status is required" },
            { status: 400 }
          );
        }
        updateData = { paymentStatus: value };
        message = "Payment status updated successfully";
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update bookings
    const updateResult = await Booking.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    logger.info("Super admin bulk updated bookings", {
      userId: session.user.id,
      action,
      bookingIds: ids,
      updatedCount: updateResult.modifiedCount,
      value
    });

    return NextResponse.json({
      message,
      updatedCount: updateResult.modifiedCount
    });

  } catch (error) {
    logger.error("Error performing bulk booking operations", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 