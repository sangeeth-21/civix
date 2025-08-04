import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:agent:bookings");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build query
    const query: any = { agentId: session.user.id };
    
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('serviceId', 'title description price category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    logger.error("Error fetching agent bookings", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 