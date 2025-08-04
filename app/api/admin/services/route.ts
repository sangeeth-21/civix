import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import User from "@/models/User";
import { AuditActions, createAuditLog } from "@/models/AuditLog";
import { z } from "zod";
import mongoose from "mongoose";

const logger = createNamespaceLogger("api:admin:services");

// Schema for query parameters
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  category: z.string().optional(),
  agentId: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  sort: z.string().optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Schema for service update
const ServiceUpdateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  category: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

// GET handler for listing services
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to admin services API", {
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
      category,
      agentId,
      isActive,
      search,
      sort,
      order
    } = QuerySchema.parse(queryParams);
    
    // Connect to database
    await connectDB();
    
    // Build query
    const query: Record<string, unknown> = {};
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Add agentId filter if provided
    if (agentId) {
      query.agentId = agentId;
    }
    
    // Add isActive filter if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Determine sort direction
    const sortDirection = order === "asc" ? 1 : -1;
    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sort] = sortDirection as 1 | -1;
    
    // Execute query with pagination
    const [services, totalCount] = await Promise.all([
      Service.find(query)
        .populate("agentId", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(query),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    logger.info("Admin services list retrieved successfully", {
      userId: session.user.id,
      page,
      limit,
      totalCount,
      filters: { category, agentId, isActive, search },
    });
    
    return NextResponse.json({
      data: services,
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
    
    logger.error("Error fetching services list", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// PATCH handler for updating a service
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to update service", {
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
    
    // Validate serviceId parameter
    const serviceId = body.serviceId;
    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }
    
    // Validate update data
    const updateData = ServiceUpdateSchema.parse(body.data);
    
    // Connect to database
    await connectDB();
    
    // Find service to update
    const service = await Service.findById(serviceId);
    
    if (!service) {
      logger.warn("Service not found for update", {
        adminId: session.user.id,
        serviceId,
      });
      
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Track changes for audit log
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    
    // Apply updates
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] !== undefined) {
        // Record change
        const before = (service as unknown as Record<string, unknown>)[key];
        const after = updateData[key as keyof typeof updateData];
        changes[key] = { before, after };
        
        // Apply change with proper typing
        (service as unknown as Record<string, unknown>)[key] = after;
      }
    });
    
    // Save updated service
    await service.save();
    
    // Create audit log
    await createAuditLog(
      session.user.id,
      AuditActions.SERVICE_UPDATED,
      {
        entityId: serviceId,
        entityType: "Service",
        details: {
          changes,
          updatedBy: session.user.id,
        },
      }
    );
    
    logger.info("Service updated successfully by admin", {
      adminId: session.user.id,
      serviceId,
      changes: Object.keys(changes),
    });
    
    // Return updated service
    const updatedService = await Service.findById(serviceId)
      .populate("agentId", "name email");
    
    return NextResponse.json({
      message: "Service updated successfully",
      data: updatedService,
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
    
    logger.error("Error updating service", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new service
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to create service", {
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
    
    // Create schema for service creation
    const ServiceCreateSchema = z.object({
      title: z.string().min(3).max(100),
      description: z.string().min(10),
      price: z.number().positive(),
      category: z.string().min(2),
      agentId: z.string(),
      isActive: z.boolean().optional().default(true),
    });
    
    // Validate service data
    const serviceData = ServiceCreateSchema.parse(body);
    
    // Connect to database
    await connectDB();
    
    // Verify agent exists
    const agent = await User.findById(serviceData.agentId);
    if (!agent || agent.role !== "AGENT") {
      return NextResponse.json(
        { error: "Invalid agent ID or user is not an agent" },
        { status: 400 }
      );
    }
    
    // Create new service
    const newService = await Service.create(serviceData);
    
    // Create audit log
    await createAuditLog(
      session.user.id,
      AuditActions.SERVICE_CREATED,
      {
        entityId: (newService._id as mongoose.Types.ObjectId).toString(),
        entityType: "Service",
        details: {
          service: {
            title: newService.title,
            category: newService.category,
            agentId: newService.agentId,
          },
          createdBy: session.user.id,
        },
      }
    );
    
    logger.info("New service created successfully by admin", {
      adminId: session.user.id,
      serviceId: newService._id,
      title: newService.title,
    });
    
    // Return created service
    const createdService = await Service.findById(newService._id)
      .populate("agentId", "name email");
    
    return NextResponse.json({
      message: "Service created successfully",
      data: createdService,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid service data", {
        error: "Zod validation failed",
      });
      
      return NextResponse.json(
        { error: "Invalid service data" },
        { status: 400 }
      );
    }
    
    logger.error("Error creating service", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a service
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has admin role
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      logger.warn("Unauthorized access attempt to delete service", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Get service ID from URL
    const url = new URL(req.url);
    const serviceId = url.searchParams.get("id");
    
    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find service to delete
    const service = await Service.findById(serviceId);
    
    if (!service) {
      logger.warn("Service not found for deletion", {
        adminId: session.user.id,
        serviceId,
      });
      
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Store service details for audit log
    const serviceDetails = {
      title: service.title,
      category: service.category,
      agentId: service.agentId,
    };
    
    // Delete the service
    await Service.findByIdAndDelete(serviceId);
    
    // Create audit log
    await createAuditLog(
      session.user.id,
      AuditActions.SERVICE_DELETED,
      {
        entityId: serviceId,
        entityType: "Service",
        details: {
          service: serviceDetails,
          deletedBy: session.user.id,
        },
      }
    );
    
    logger.info("Service deleted successfully by admin", {
      adminId: session.user.id,
      serviceId,
      serviceTitle: serviceDetails.title,
    });
    
    return NextResponse.json({
      message: "Service deleted successfully",
    });
    
  } catch (error) {
    logger.error("Error deleting service", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
} 