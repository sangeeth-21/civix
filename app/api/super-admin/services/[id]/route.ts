import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:services:id");

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
      logger.warn("Unauthorized access attempt to service details", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        serviceId: resolvedParams.id,
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find service with agent details
    const service = await Service.findById(resolvedParams.id)
      .populate("agentId", "name email profile.avatar")
      .lean();
    
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Transform service data
    const transformedService = {
      _id: service._id,
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price,
      duration: (service as Record<string, unknown>).duration as number,
      agentId: (service.agentId as unknown as Record<string, unknown>)._id,
      agentName: (service.agentId as unknown as Record<string, unknown>).name as string,
      agentEmail: (service.agentId as unknown as Record<string, unknown>).email as string,
      agentAvatar: ((service.agentId as unknown as Record<string, unknown>).profile as Record<string, unknown>)?.avatar as string | undefined,
      isActive: service.isActive,
      isFeatured: (service as Record<string, unknown>).isFeatured as boolean,
      rating: (service as Record<string, unknown>).rating as number || 0,
      totalBookings: (service as Record<string, unknown>).totalBookings as number || 0,
      totalRevenue: (service as Record<string, unknown>).totalRevenue as number || 0,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      tags: (service as Record<string, unknown>).tags as string[] || [],
      images: (service as Record<string, unknown>).images as string[] || [],
      requirements: (service as Record<string, unknown>).requirements as string[] || [],
      included: (service as Record<string, unknown>).included as string[] || [],
      excluded: (service as Record<string, unknown>).excluded as string[] || [],
    };
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_SERVICE_DETAILS",
      entityType: "SERVICE",
      entityId: service._id,
      details: {
        serviceId: service._id,
        title: service.title
      }
    });
    
    logger.info("Super admin viewed service details", {
      userId: session.user.id,
      serviceId: service._id
    });
    
    return NextResponse.json({
      success: true,
      data: transformedService
    });
    
  } catch (error) {
    logger.error("Error fetching service details", { error });
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
      logger.warn("Unauthorized access attempt to update service", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        serviceId: resolvedParams.id,
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Check if service exists
    const existingService = await Service.findById(resolvedParams.id);
    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Get request body
    const body = await req.json();
    const {
      title,
      description,
      category,
      price,
      duration,
      agentId,
      tags,
      requirements,
      included,
      excluded,
      isActive,
      isFeatured
    } = body;
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (agentId !== undefined) {
      // Verify agent exists and is an agent
      const agent = await User.findById(agentId);
      if (!agent || agent.role !== "AGENT") {
        return NextResponse.json(
          { error: "Invalid agent ID" },
          { status: 400 }
        );
      }
      updateData.agentId = agentId;
    }
    if (tags !== undefined) updateData.tags = tags;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (included !== undefined) updateData.included = included;
    if (excluded !== undefined) updateData.excluded = excluded;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    
    // Update service
    const updatedService = await Service.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("agentId", "name email profile.avatar");
    
    if (!updatedService) {
      return NextResponse.json(
        { error: "Failed to update service" },
        { status: 500 }
      );
    }
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "UPDATE_SERVICE",
      entityType: "SERVICE",
      entityId: updatedService._id,
      details: {
        serviceId: updatedService._id,
        title: updatedService.title,
        changes: Object.keys(updateData)
      }
    });
    
    logger.info("Super admin updated service", {
      userId: session.user.id,
      serviceId: updatedService._id,
      changes: Object.keys(updateData)
    });
    
    return NextResponse.json({
      success: true,
      data: updatedService
    });
    
  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error updating service", { error, serviceId: resolvedParams.id });
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
      logger.warn("Unauthorized access attempt to delete service", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
        serviceId: resolvedParams.id,
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Check if service exists
    const existingService = await Service.findById(resolvedParams.id);
    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Soft delete service (set isActive to false)
    const deletedService = await Service.findByIdAndUpdate(
      resolvedParams.id,
      { isActive: false },
      { new: true }
    ).populate("agentId", "name email profile.avatar");
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "DELETE_SERVICE",
      entityType: "SERVICE",
      entityId: existingService._id,
      details: {
        serviceId: existingService._id,
        title: existingService.title
      }
    });
    
    logger.info("Super admin deleted service", {
      userId: session.user.id,
      serviceId: existingService._id,
      title: existingService.title
    });
    
    return NextResponse.json({
      success: true,
      data: deletedService
    });
    
  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error deleting service", { error, serviceId: resolvedParams.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 