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
    const { action, agentIds } = body;

    if (!action || !agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Prevent bulk operations on self
    if (agentIds.includes(session.user.id)) {
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
        message = "Agents activated successfully";
        break;
      
      case "deactivate":
        updateData = { isActive: false };
        message = "Agents deactivated successfully";
        break;
      
      case "delete":
        // Delete agents
        const deleteResult = await User.deleteMany({
          _id: { $in: agentIds },
          role: { $in: ["AGENT", "ADMIN"] }
        });
        
        logger.info("Super admin bulk deleted agents", {
          userId: session.user.id,
          agentIds,
          deletedCount: deleteResult.deletedCount
        });
        
        return NextResponse.json({
          message: `${deleteResult.deletedCount} agents deleted successfully`,
          deletedCount: deleteResult.deletedCount
        });
      
      case "promote_to_admin":
        updateData = { role: "ADMIN" };
        message = "Agents promoted to admin successfully";
        break;
      
      case "demote_to_agent":
        updateData = { role: "AGENT" };
        message = "Admins demoted to agent successfully";
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update agents
    const updateResult = await User.updateMany(
      {
        _id: { $in: agentIds },
        role: { $in: ["AGENT", "ADMIN"] }
      },
      updateData
    );

    logger.info("Super admin bulk updated agents", {
      userId: session.user.id,
      action,
      agentIds,
      updatedCount: updateResult.modifiedCount
    });

    return NextResponse.json({
      message,
      updatedCount: updateResult.modifiedCount
    });

  } catch (error) {
    logger.error("Error performing bulk agent operations", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 