import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { AuditActions, createAuditLog } from "@/models/AuditLog";
import { z } from "zod";

const logger = createNamespaceLogger("api:admin:users");

// Schema for query parameters
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  role: z.enum(["USER", "AGENT", "ADMIN", "SUPER_ADMIN"]).optional(),
  search: z.string().optional(),
  sort: z.string().optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Schema for user update
const UserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["USER", "AGENT", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

// GET handler for listing users
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to admin users API", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const {
      page,
      limit,
      role,
      search,
      sort,
      order
    } = QuerySchema.parse(queryParams);
    
    // Connect to database
    await connectDB();
    
    // Build query
    const query: Record<string, unknown> = {};
    
    // Add role filter if provided
    if (role) {
      query.role = role;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Determine sort direction
    const sortDirection = order === "asc" ? 1 : -1;
    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sort] = sortDirection as 1 | -1;
    
    // Execute query with pagination
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    logger.info("Admin users list retrieved successfully", {
      userId: session.user.id,
      page,
      limit,
      totalCount,
      filters: { role, search },
    });
    
    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid query parameters", {
        error: "Zod validation failed",
      });
      
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }
    
    logger.error("Error fetching users list", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PATCH handler for updating a user
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to update user", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate userId parameter
    const userId = body.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Validate update data
    const updateData = UserUpdateSchema.parse(body.data);
    
    // Connect to database
    await connectDB();
    
    // Find user to update
    const user = await User.findById(userId);
    
    if (!user) {
      logger.warn("User not found for update", {
        adminId: session.user.id,
        targetUserId: userId,
      });
      
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Special case: Prevent changing role of SUPER_ADMIN unless by another SUPER_ADMIN
    if (
      user.role === "SUPER_ADMIN" &&
      updateData.role && 
      updateData.role !== "SUPER_ADMIN" && 
      session.user.role !== "SUPER_ADMIN"
    ) {
      logger.warn("Attempt to downgrade SUPER_ADMIN by non-SUPER_ADMIN", {
        adminId: session.user.id,
        adminRole: session.user.role,
        targetUserId: userId,
      });
      
      return NextResponse.json(
        { error: "Cannot change role of SUPER_ADMIN" },
        { status: 403 }
      );
    }
    
    // Track changes for audit log
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    
    // Apply updates
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] !== undefined) {
        // Record change
        const before = (user as unknown as Record<string, unknown>)[key];
        const after = updateData[key as keyof typeof updateData];
        changes[key] = { before, after };
        
        // Apply change with proper typing
        (user as unknown as Record<string, unknown>)[key] = after;
      }
    });
    
    // Save updated user
    await user.save();
    
    // Create audit log
    await createAuditLog(
      session.user.id,
      AuditActions.USER_UPDATED,
      {
        entityId: userId,
        entityType: "User",
        details: {
          changes,
          updatedBy: session.user.id,
        },
      }
    );
    
    logger.info("User updated successfully by admin", {
      adminId: session.user.id,
      targetUserId: userId,
      changes: Object.keys(changes),
    });
    
    // Return updated user without password
    const updatedUser = await User.findById(userId).select("-password");
    
    return NextResponse.json({
      message: "User updated successfully",
      data: updatedUser,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid update data", {
        error: "Zod validation failed",
      });
      
      return NextResponse.json(
        { error: "Invalid update data" },
        { status: 400 }
      );
    }
    
    logger.error("Error updating user", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
} 