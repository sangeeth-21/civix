import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
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
    const { action, userIds } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Prevent bulk operations on self
    if (userIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: "Cannot perform bulk operations on your own account" },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let message = "";

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        message = "Users activated successfully";
        break;
      
      case "deactivate":
        updateData = { isActive: false };
        message = "Users deactivated successfully";
        break;
      
      case "delete":
        // Delete users
        const deleteResult = await User.deleteMany({
          _id: { $in: userIds },
          role: "USER" // Only allow deletion of regular users
        });
        
        logger.info("Super admin bulk deleted users", {
          userId: session.user.id,
          userIds,
          deletedCount: deleteResult.deletedCount
        });
        
        return NextResponse.json({
          message: `${deleteResult.deletedCount} users deleted successfully`,
          deletedCount: deleteResult.deletedCount
        });
      
      case "promote_to_agent":
        updateData = { role: "AGENT" };
        message = "Users promoted to agent successfully";
        break;
      
      case "demote_to_user":
        updateData = { role: "USER" };
        message = "Users demoted to regular user successfully";
        break;
      
      case "reset_password":
        // Generate random password
        const randomPassword = Math.random().toString(36).slice(-8);
        updateData = { password: randomPassword };
        message = "User passwords reset successfully";
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update users
    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    logger.info("Super admin bulk updated users", {
      userId: session.user.id,
      action,
      userIds,
      updatedCount: updateResult.modifiedCount
    });

    return NextResponse.json({
      message,
      updatedCount: updateResult.modifiedCount
    });

  } catch (error) {
    logger.error("Error performing bulk user operations", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 