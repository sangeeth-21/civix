import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Booking, { IBooking } from '@/models/Booking';
import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';
import { sendBookingConfirmationEmail, sendAgentNotificationEmail } from '@/lib/services/email';
import { logger, createNamespaceLogger } from '@/lib/logger';

// Define types for populated documents
interface IPopulatedService {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface IPopulatedAgent {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
}

interface IPopulatedBooking {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  serviceId: IPopulatedService;
  agentId: IPopulatedAgent;
  status: string;
  scheduledDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  notifications?: {
    confirmationSent: boolean;
    confirmationSentAt?: Date;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const routeLogger = createNamespaceLogger('api:bookings:send-confirmation');
  routeLogger.info(`Processing booking confirmation request for booking ID: ${resolvedParams.id}`);
  
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      routeLogger.warn('Unauthorized attempt to send booking confirmation', { bookingId: resolvedParams.id });
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const bookingId = resolvedParams.id;
    
    // Validate ID
    if (!mongoose.isValidObjectId(bookingId)) {
      routeLogger.warn('Invalid booking ID format', { bookingId });
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID' },
        { status: 400 }
      );
    }
    
    // Get booking with service and agent info
    routeLogger.debug('Fetching booking details', { bookingId });
    const booking = await Booking.findById(bookingId)
      .populate('serviceId', 'name description price duration')
      .populate('agentId', 'name email phone')
      .lean() as unknown as IPopulatedBooking;
    
    if (!booking) {
      routeLogger.warn('Booking not found', { bookingId });
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership or admin rights
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isOwner = booking.userId.toString() === session.user.id;
    const isAgent = booking.agentId && booking.agentId._id.toString() === session.user.id;
    
    if (!isAdmin && !isOwner && !isAgent) {
      routeLogger.warn('Unauthorized access to booking confirmation', { 
        bookingId, 
        userId: session.user.id,
        userRole: session.user.role 
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get user details
    routeLogger.debug('Fetching user details', { userId: booking.userId });
    const user = await User.findById(booking.userId).lean() as unknown as IUser & { _id: mongoose.Types.ObjectId };
    
    if (!user) {
      routeLogger.warn('User not found', { userId: booking.userId });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Send confirmation email to user
    routeLogger.info('Sending confirmation email to user', { 
      userEmail: user.email,
      bookingId: booking._id 
    });
    
    const userEmailSent = await sendBookingConfirmationEmail(
      user.email,
      user.name,
      {
        _id: booking._id.toString(),
        serviceName: booking.serviceId.name,
        date: booking.scheduledDate,
        duration: booking.serviceId.duration,
        price: booking.serviceId.price,
        status: booking.status,
        agentName: booking.agentId?.name,
        notes: booking.notes
      }
    );
    
    // Send notification email to agent
    let agentEmailSent = false;
    if (booking.agentId && booking.agentId.email) {
      routeLogger.info('Sending notification email to agent', { 
        agentEmail: booking.agentId.email,
        bookingId: booking._id 
      });
      
      agentEmailSent = await sendAgentNotificationEmail(
        booking.agentId.email,
        booking.agentId.name,
        user.name,
        {
          _id: booking._id.toString(),
          serviceName: booking.serviceId.name,
          date: booking.scheduledDate,
          duration: booking.serviceId.duration,
          notes: booking.notes
        }
      );
    }
    
    // Mark booking as confirmation sent
    routeLogger.debug('Updating booking confirmation status', { bookingId });
    await Booking.findByIdAndUpdate(bookingId, {
      'notifications.confirmationSent': true,
      'notifications.confirmationSentAt': new Date()
    });
    
    routeLogger.info('Booking confirmation process completed successfully', { 
      bookingId,
      userEmailSent,
      agentEmailSent
    });
    
    return NextResponse.json({
      success: true,
      data: {
        userEmailSent,
        agentEmailSent
      },
    });
  } catch (error) {
    routeLogger.error('Error sending booking confirmation', {
      bookingId: resolvedParams.id,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
} 