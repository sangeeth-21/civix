import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { createNamespaceLogger } from "@/lib/logger";
import { User } from "@/models/User";
import { AuditActions, createAuditLog } from "@/models/AuditLog";
import { createApiResponse, requireAuth, handleApiError, getPaginationParams, createPaginationResponse, sanitizeUser } from "@/lib/api-utils";
import { z } from "zod";

const logger = createNamespaceLogger("api:admin:users");

// Schema for query parameters
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  role: z.enum(["USER", "AGENT", "ADMIN", "SUPER_ADMIN"]).optional(),
  search: z.string().optional(),
  sort: z.string().optional().default("createdAt"),
  order: z.enum(["ASC", "DESC"]).optional().default("DESC"),
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
    // Check authentication and authorization
    const { session, error } = await requireAuth(req, ["ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
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
    
    // Build filters
    const filters: any = {};
    
    // Add role filter if provided
    if (role) {
      filters.role = role;
    }
    
    // Add search filter if provided
    if (search) {
      filters.search = search;
    }
    
    // Find users with filters and pagination
    const { users, total } = await User.find(filters, {
      page,
      limit,
      sort,
      order
    });
    
    // Sanitize users (remove password and sensitive fields)
    const sanitizedUsers = users.map(sanitizeUser);
    
    logger.info("Admin users list retrieved successfully", {
      userId: session!.user.id,
      page,
      limit,
      totalCount: total,
      filters: { role, search },
    });
    
    return createApiResponse(
      true,
      createPaginationResponse(sanitizedUsers, total, page, limit)
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid query parameters", {
        error: "Zod validation failed",
        issues: error.issues
      });
      
      return createApiResponse(
        false,
        undefined,
        "Invalid query parameters",
        400
      );
    }
    
    return handleApiError(error, "Failed to fetch users");
  }
}

// PATCH handler for updating a user
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication and authorization
    const { session, error } = await requireAuth(req, ["ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
    // Parse request body
    const body = await req.json();
    
    // Validate userId parameter
    const userId = body.userId;
    if (!userId || isNaN(parseInt(userId))) {
      return createApiResponse(
        false,
        undefined,
        "Valid User ID is required",
        400
      );
    }
    
    // Validate update data
    const updateData = UserUpdateSchema.parse(body.data);
    
    // Find user to update
    const user = await User.findById(parseInt(userId));
    
    if (!user) {
      logger.warn("User not found for update", {
        adminId: session!.user.id,
        targetUserId: userId,
      });
      
      return createApiResponse(
        false,
        undefined,
        "User not found",
        404
      );
    }
    
    // Special case: Prevent changing role of SUPER_ADMIN unless by another SUPER_ADMIN
    if (
      user.role === "SUPER_ADMIN" &&
      updateData.role && 
      updateData.role !== "SUPER_ADMIN" && 
      session!.user.role !== "SUPER_ADMIN"
    ) {
      logger.warn("Attempt to downgrade SUPER_ADMIN by non-SUPER_ADMIN", {
        adminId: session!.user.id,
        adminRole: session!.user.role,
        targetUserId: userId,
      });
      
      return createApiResponse(
        false,
        undefined,
        "Cannot change role of SUPER_ADMIN",
        403
      );
    }
    
    // Track changes for audit log
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    
    // Identify changes
    Object.keys(updateData).forEach(key => {
      const newValue = updateData[key as keyof typeof updateData];
      const oldValue = user[key as keyof typeof user];
      
      if (newValue !== undefined && newValue !== oldValue) {
        changes[key] = { before: oldValue, after: newValue };
      }
    });
    
    if (Object.keys(changes).length === 0) {
      return createApiResponse(
        false,
        undefined,
        "No changes detected",
        400
      );
    }
    
    // Update user
    const updatedUser = await User.update(parseInt(userId), updateData);
    
    if (!updatedUser) {
      return createApiResponse(
        false,
        undefined,
        "Failed to update user",
        500
      );
    }
    
    // Create audit log
    await createAuditLog(
      parseInt(session!.user.id),
      AuditActions.USER_UPDATED,
      {
        entityId: parseInt(userId),
        entityType: "User",
        details: {
          changes,
          updatedBy: session!.user.id,
        },
      }
    );
    
    logger.info("User updated successfully by admin", {
      adminId: session!.user.id,
      targetUserId: userId,
      changes: Object.keys(changes),
    });
    
    // Return sanitized updated user
    return createApiResponse(
      true,
      sanitizeUser(updatedUser),
      "User updated successfully"
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid update data", {
        error: "Zod validation failed",
        issues: error.issues
      });
      
      return createApiResponse(
        false,
        undefined,
        "Invalid update data",
        400
      );
    }
    
    return handleApiError(error, "Failed to update user");
  }
}

// DELETE handler for deleting a user
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication and authorization
    const { session, error } = await requireAuth(req, ["ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
    // Get userId from query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId || isNaN(parseInt(userId))) {
      return createApiResponse(
        false,
        undefined,
        "Valid User ID is required",
        400
      );
    }
    
    // Find user to delete
    const user = await User.findById(parseInt(userId));
    
    if (!user) {
      return createApiResponse(
        false,
        undefined,
        "User not found",
        404
      );
    }
    
    // Prevent deleting SUPER_ADMIN unless by another SUPER_ADMIN
    if (user.role === "SUPER_ADMIN" && session!.user.role !== "SUPER_ADMIN") {
      return createApiResponse(
        false,
        undefined,
        "Cannot delete SUPER_ADMIN account",
        403
      );
    }
    
    // Prevent users from deleting themselves
    if (user.id === parseInt(session!.user.id)) {
      return createApiResponse(
        false,
        undefined,
        "Cannot delete your own account",
        400
      );
    }
    
    // Delete user
    const deleted = await User.delete(parseInt(userId));
    
    if (!deleted) {
      return createApiResponse(
        false,
        undefined,
        "Failed to delete user",
        500
      );
    }
    
    // Create audit log
    await createAuditLog(
      parseInt(session!.user.id),
      AuditActions.USER_DELETED,
      {
        entityId: parseInt(userId),
        entityType: "User",
        details: {
          deletedUser: sanitizeUser(user),
          deletedBy: session!.user.id,
        },
      }
    );
    
    logger.info("User deleted successfully by admin", {
      adminId: session!.user.id,
      deletedUserId: userId,
      deletedUserEmail: user.email
    });
    
    return createApiResponse(
      true,
      undefined,
      "User deleted successfully"
    );
    
  } catch (error) {
    return handleApiError(error, "Failed to delete user");
  }
}