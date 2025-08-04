import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:admins:[id]");

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
      logger.warn("Unauthorized access attempt to view admin", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        adminId: resolvedParams.id,
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find admin by ID
    const admin = await User.findOne({
      _id: resolvedParams.id,
      role: { $in: ["ADMIN", "SUPER_ADMIN"] }
    }).select("-password");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_ADMIN_DETAILS",
      entityType: "ADMIN",
      entityId: admin._id,
      details: {
        adminName: admin.name,
        adminEmail: admin.email
      }
    });
    
    logger.info("Super admin viewed admin details", {
      userId: session.user.id,
      adminId: admin._id,
      adminEmail: admin.email
    });
    
    return NextResponse.json({
      success: true,
      data: admin
    });
    
  } catch (error) {
    logger.error("Error fetching admin", { error });
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
      logger.warn("Unauthorized access attempt to update admin", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        adminId: resolvedParams.id,
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
    const { name, email, phone, role, isActive } = body;
    
    // Find admin by ID
    const admin = await User.findOne({
      _id: resolvedParams.id,
      role: { $in: ["ADMIN", "SUPER_ADMIN"] }
    });
    
    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }
    
    // Prevent super admin from modifying themselves
    if ((admin._id as { toString: () => string }).toString() === session.user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account" },
        { status: 400 }
      );
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Validate role if provided
    if (role && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }
    
    // Check if email already exists (if email is being updated)
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }
    
    // Update admin
    const updatedAdmin = await User.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { new: true }
    ).select("-password");
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "UPDATE_ADMIN",
      entityType: "ADMIN",
      entityId: admin._id,
      details: {
        adminName: admin.name,
        adminEmail: admin.email,
        changes: updateData
      }
    });
    
    logger.info("Super admin updated admin", {
      userId: session.user.id,
      adminId: admin._id,
      adminEmail: admin.email,
      changes: Object.keys(updateData)
    });
    
    return NextResponse.json({
      success: true,
      data: updatedAdmin
    });
    
  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error updating admin", { error, adminId: resolvedParams.id });
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
      logger.warn("Unauthorized access attempt to delete admin", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        adminId: resolvedParams.id,
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find admin by ID
    const admin = await User.findOne({
      _id: resolvedParams.id,
      role: { $in: ["ADMIN", "SUPER_ADMIN"] }
    });
    
    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }
    
    // Prevent super admin from deleting themselves
    if ((admin._id as { toString: () => string }).toString() === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }
    
    // Soft delete admin (set isActive to false)
    const deletedAdmin = await User.findByIdAndUpdate(
      resolvedParams.id,
      { isActive: false },
      { new: true }
    ).select("-password");
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "DELETE_ADMIN",
      entityType: "ADMIN",
      entityId: admin._id,
      details: {
        adminName: admin.name,
        adminEmail: admin.email
      }
    });
    
    logger.info("Super admin deleted admin", {
      userId: session.user.id,
      adminId: admin._id,
      adminEmail: admin.email
    });
    
    return NextResponse.json({
      success: true,
      data: deletedAdmin
    });
    
  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error deleting admin", { error, adminId: resolvedParams.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 