import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:profile");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to super admin profile", {
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
    
    // Find user profile
    const user = await User.findById(session.user.id)
      .select("-password")
      .lean();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_PROFILE",
      entityType: "USER",
      entityId: user._id,
      details: {
        profileType: "super_admin"
      }
    });
    
    logger.info("Super admin viewed profile", {
      userId: session.user.id
    });
    
    return NextResponse.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    logger.error("Error fetching profile", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to update super admin profile", {
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
    const {
      name,
      email,
      phone,
      profile,
      preferences
    } = body;
    
    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: session.user.id } 
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profile !== undefined) updateData.profile = profile;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "UPDATE_PROFILE",
      entityType: "USER",
      entityId: updatedUser._id,
      details: {
        profileType: "super_admin",
        changes: Object.keys(updateData)
      }
    });
    
    logger.info("Super admin updated profile", {
      userId: session.user.id,
      changes: Object.keys(updateData)
    });
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully"
    });
    
  } catch (error) {
    logger.error("Error updating profile", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 