import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Service from '@/models/Service';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:agent:dashboard");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const agentId = session.user.id;

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ agentId });
    const pendingBookings = await Booking.countDocuments({ 
      agentId, 
      status: "PENDING" 
    });
    const confirmedBookings = await Booking.countDocuments({ 
      agentId, 
      status: "CONFIRMED" 
    });
    const completedBookings = await Booking.countDocuments({ 
      agentId, 
      status: "COMPLETED" 
    });

    // Get service statistics
    const totalServices = await Service.countDocuments({ agentId });
    const activeServices = await Service.countDocuments({ 
      agentId, 
      isActive: true 
    });

    // Get recent bookings
    const recentBookings = await Booking.find({ agentId })
      .populate('userId', 'name email phone')
      .populate('serviceId', 'title price')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent services
    const recentServices = await Service.find({ agentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate earnings (simplified - in real app you'd have payment tracking)
    const completedBookingsData = await Booking.find({ 
      agentId, 
      status: "COMPLETED" 
    }).populate('serviceId', 'price').lean();
    
    const totalEarnings = completedBookingsData.reduce((sum, booking) => {
      const servicePrice = (booking.serviceId as any)?.price || 0;
      return sum + servicePrice;
    }, 0);

    const dashboardData = {
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        totalServices,
        activeServices,
        totalEarnings
      },
      recentBookings,
      recentServices
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error("Error fetching agent dashboard", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 