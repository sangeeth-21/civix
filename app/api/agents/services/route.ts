import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Service from '@/models/Service';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:agent:services");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const category = searchParams.get("category");

    // Build query
    const query: any = { agentId: session.user.id };
    
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        data: services,
        pagination: {
          page: 1,
          limit: services.length,
          totalCount: services.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });

  } catch (error) {
    logger.error("Error fetching agent services", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { title, description, price, category, duration } = body;

    // Validate required fields
    if (!title || !description || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new service
    const service = new Service({
      title,
      description,
      price: parseFloat(price),
      category,
      duration: duration ? parseInt(duration) : undefined,
      agentId: session.user.id,
      isActive: true
    });

    await service.save();

    logger.info("Agent created new service", {
      userId: session.user.id,
      serviceId: service._id,
      serviceTitle: title
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: "Service created successfully"
    }, { status: 201 });

  } catch (error) {
    logger.error("Error creating service", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 