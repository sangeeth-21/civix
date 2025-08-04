import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Service from '@/models/Service';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:agent:services:id");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const service = await Service.findOne({
      _id: resolvedParams.id,
      agentId: session.user.id
    }).lean();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service
    });

  } catch (error) {
    logger.error("Error fetching service", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const body = await request.json();
    const { title, description, price, category, duration, isActive } = body;

    const service = await Service.findOneAndUpdate(
      {
        _id: resolvedParams.id,
        agentId: session.user.id
      },
      {
        $set: {
          ...(title && { title }),
          ...(description && { description }),
          ...(price && { price: parseFloat(price) }),
          ...(category && { category }),
          ...(duration && { duration: parseInt(duration) }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    logger.info("Agent updated service", {
      userId: session.user.id,
      serviceId: resolvedParams.id,
      updatedFields: Object.keys(body)
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: "Service updated successfully"
    });

  } catch (error) {
    logger.error("Error updating service", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const service = await Service.findOneAndDelete({
      _id: resolvedParams.id,
      agentId: session.user.id
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    logger.info("Agent deleted service", {
      userId: session.user.id,
      serviceId: resolvedParams.id,
      serviceTitle: service.title
    });

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully"
    });

  } catch (error) {
    logger.error("Error deleting service", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 