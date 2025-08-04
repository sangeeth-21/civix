import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:admins:bulk");

export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to bulk update admins", {
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
    const { ids, action } = body;
    
    // Validate required fields
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid admin IDs" },
        { status: 400 }
      );
    }
    
    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }
    
    // Find admins to update
    const admins = await User.find({
      _id: { $in: ids },
      role: { $in: ["ADMIN", "SUPER_ADMIN"] }
    });
    
    if (admins.length === 0) {
      return NextResponse.json(
        { error: "No valid admins found" },
        { status: 404 }
      );
    }
    
    // Prevent super admin from modifying themselves
    const filteredAdmins = admins.filter(admin => (admin._id as { toString: () => string }).toString() !== session.user.id);
    
    if (filteredAdmins.length !== admins.length) {
      logger.warn("Super admin attempted to modify themselves in bulk action", {
        userId: session.user.id,
        action
      });
    }
    
    const updateData: { isActive?: boolean } = {};
    let actionDescription = "";
    
    // Handle different actions
    switch (action) {
      case "activate":
        updateData.isActive = true;
        actionDescription = "activated";
        break;
        
      case "deactivate":
        updateData.isActive = false;
        actionDescription = "deactivated";
        break;
        
      case "delete":
        // Delete admins
        const adminIds = filteredAdmins.map(admin => admin._id);
        await User.deleteMany({ _id: { $in: adminIds } });
        
        // Log the action
        await AuditLog?.create({
          userId: session.user.id,
          action: "BULK_DELETE_ADMINS",
          entityType: "ADMIN",
          details: {
            adminCount: filteredAdmins.length,
            adminEmails: filteredAdmins.map(admin => admin.email),
            action
          }
        });
        
        logger.info("Super admin bulk deleted admins", {
          userId: session.user.id,
          adminCount: filteredAdmins.length,
          adminIds: adminIds
        });
        
        return NextResponse.json({
          success: true,
          message: `${filteredAdmins.length} admins deleted successfully`,
          data: {
            deletedCount: filteredAdmins.length,
            skippedCount: admins.length - filteredAdmins.length
          }
        });
        
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
    
    // Update admins
    const adminIds = filteredAdmins.map(admin => admin._id);
    const result = await User.updateMany(
      { _id: { $in: adminIds } },
      updateData
    );
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "BULK_UPDATE_ADMINS",
      entityType: "ADMIN",
      details: {
        adminCount: filteredAdmins.length,
        adminEmails: filteredAdmins.map(admin => admin.email),
        action,
        updateData
      }
    });
    
    logger.info("Super admin bulk updated admins", {
      userId: session.user.id,
      adminCount: filteredAdmins.length,
      action,
      modifiedCount: result.modifiedCount
    });
    
    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} admins ${actionDescription} successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        skippedCount: admins.length - filteredAdmins.length
      }
    });
    
  } catch (error) {
    logger.error("Error performing bulk admin action", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 