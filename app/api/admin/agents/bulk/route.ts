import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createNamespaceLogger } from "@/lib/logger";

const logger = createNamespaceLogger("api:admin:agents:bulk");

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { ids, isActive } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid agent IDs provided" },
        { status: 400 }
      );
    }

    const result = await User.updateMany(
      { _id: { $in: ids }, role: "agent" },
      { $set: { isActive } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No agents found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} agents updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error("Error updating agents in bulk", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid agent IDs provided" },
        { status: 400 }
      );
    }

    const result = await User.deleteMany({ _id: { $in: ids }, role: "agent" });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No agents found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} agents deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    logger.error("Error deleting agents in bulk", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 