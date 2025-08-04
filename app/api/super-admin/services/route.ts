import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:services");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to super admin services", {
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
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const agentId = searchParams.get("agentId") || "";
    const priceRange = searchParams.get("priceRange") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Build query
    const query: Record<string, unknown> = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add status filter
    if (status) {
      query.isActive = status === "active";
    }
    
    // Add agent filter
    if (agentId) {
      query.agentId = agentId;
    }
    
    // Add price range filter
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      if (max) {
        query.price = { $gte: min, $lte: max };
      } else {
        query.price = { $gte: min };
      }
    }
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [services, totalCount] = await Promise.all([
      Service.find(query)
        .populate("agentId", "name email profile.avatar")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(query)
    ]);
    
    // Transform services data
    const transformedServices = services.map((service) => ({
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
    }));
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_SERVICES",
      entityType: "SERVICE",
      details: {
        page,
        limit,
        search,
        category,
        status,
        totalCount
      }
    });
    
    logger.info("Super admin viewed services list", {
      userId: session.user.id,
      page,
      limit,
      totalCount
    });
    
    return NextResponse.json({
      success: true,
      data: transformedServices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    logger.error("Error fetching services", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to create service", {
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
      isActive = true,
      isFeatured = false
    } = body;
    
    // Validate required fields
    if (!title || !description || !category || !price || !duration || !agentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Verify agent exists and is an agent
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== "AGENT") {
      return NextResponse.json(
        { error: "Invalid agent ID" },
        { status: 400 }
      );
    }
    
    // Create service
    const service = await Service.create({
      title,
      description,
      category,
      price: parseFloat(price),
      duration: parseInt(duration),
      agentId,
      tags: tags || [],
      requirements: requirements || [],
      included: included || [],
      excluded: excluded || [],
      isActive,
      isFeatured,
      rating: 0,
      totalBookings: 0,
      totalRevenue: 0
    });
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "CREATE_SERVICE",
      entityType: "SERVICE",
      entityId: service._id,
      details: {
        title,
        category,
        price,
        agentId
      }
    });
    
    logger.info("Super admin created service", {
      userId: session.user.id,
      serviceId: service._id,
      title
    });
    
    return NextResponse.json({
      success: true,
      data: service,
      message: "Service created successfully"
    });
    
  } catch (error) {
    logger.error("Error creating service", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 