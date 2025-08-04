import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:services:bulk");

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to bulk service actions", {
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
    const body = await request.json();
    const { action, serviceIds } = body;

    // Validate required fields
    if (!action || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: action and serviceIds array" },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let message = "";

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        message = "Services activated successfully";
        break;
      
      case "deactivate":
        updateData = { isActive: false };
        message = "Services deactivated successfully";
        break;
      
      case "delete":
        // Delete services
        const deleteResult = await Service.deleteMany({
          _id: { $in: serviceIds }
        });
        
        logger.info("Super admin bulk deleted services", {
          userId: session.user.id,
          serviceIds,
          deletedCount: deleteResult.deletedCount
        });
        
        return NextResponse.json({
          message: `${deleteResult.deletedCount} services deleted successfully`,
          deletedCount: deleteResult.deletedCount
        });
      
      case "feature":
        updateData = { isFeatured: true };
        message = "Services featured successfully";
        break;
      
      case "unfeature":
        updateData = { isFeatured: false };
        message = "Services unfeatured successfully";
        break;
      
      case "approve":
        updateData = { status: "APPROVED" };
        message = "Services approved successfully";
        break;
      
      case "reject":
        updateData = { status: "REJECTED" };
        message = "Services rejected successfully";
        break;
      
      case "update_category":
        if (!body.category) {
          return NextResponse.json(
            { error: "Category is required" },
            { status: 400 }
          );
        }
        updateData = { category: body.category };
        message = "Service categories updated successfully";
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update services
    const updateResult = await Service.updateMany(
      { _id: { $in: serviceIds } },
      updateData
    );

    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: `BULK_${action.toUpperCase()}_SERVICES`,
      entityType: "SERVICE",
      details: {
        action,
        serviceIds,
        affectedCount: updateResult.modifiedCount
      }
    });

    logger.info("Super admin performed bulk service action", {
      userId: session.user.id,
      action,
      serviceIds,
      affectedCount: updateResult.modifiedCount
    });

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        action,
        serviceIds,
        affectedCount: updateResult.modifiedCount
      }
    });

  } catch (error) {
    logger.error("Error performing bulk service operations", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 