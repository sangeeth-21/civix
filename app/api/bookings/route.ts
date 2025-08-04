import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Service from '@/models/Service';
import User from '@/models/User';
import { createApiResponse, requireAuth, handleApiError } from '@/lib/api-utils';
import { sendBookingConfirmationEmail, sendAgentNotificationEmail } from '@/lib/services/email';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger('api:bookings');

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { session, error } = await requireAuth(request, ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
    await connectDB();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const filter: Record<string, unknown> = {};
    
    // Regular user can only see their own bookings
    if (session!.user.role === 'USER') {
      filter.userId = session!.user.id;
    }
    // Agent can see bookings assigned to them
    else if (session!.user.role === 'AGENT') {
      filter.agentId = session!.user.id;
    }
    // Admin and Super Admin can see all bookings or filter as needed
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Find bookings with pagination and populate service details
    const bookings = await Booking.find(filter)
      .populate('serviceId', 'title description price category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Booking.countDocuments(filter);
    
    return createApiResponse(
      true,
      {
        data: bookings,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { session, error } = await requireAuth(request, ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
    await connectDB();
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.serviceId || !body.scheduledDate) {
      return createApiResponse(
        false,
        undefined,
        'Missing required fields',
        400
      );
    }
    
    // Find service to get agent ID and verify it's active
    const service = await Service.findById(body.serviceId);
    if (!service || !service.isActive) {
      return createApiResponse(
        false,
        undefined,
        'Service not found or inactive',
        400
      );
    }
    
    // Get user details for email
    const user = await User.findById(session!.user.id);
    if (!user) {
      return createApiResponse(
        false,
        undefined,
        'User not found',
        404
      );
    }
    
    // Get agent details for email
    const agent = await User.findById(service.agentId);
    
    // Create new booking
    const newBooking = await Booking.create({
      ...body,
      userId: session!.user.id,
      agentId: service.agentId,
      amount: service.price,
      totalAmount: service.price,
      status: 'PENDING',
    }) as any; // Type assertion to avoid TypeScript issues
    
    // Populate service details in response
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('serviceId', 'title description price category')
      .lean();
    
    // Send confirmation emails asynchronously (don't block the response)
    try {
      logger.info('Sending booking confirmation emails', { 
        bookingId: newBooking._id.toString(),
        userId: session!.user.id,
        agentId: service.agentId 
      });
      
      // Send confirmation email to user
      const userEmailSent = await sendBookingConfirmationEmail(
        user.email,
        user.name,
        {
          _id: newBooking._id.toString(),
          serviceName: service.title,
          date: new Date(body.scheduledDate),
          duration: 60, // Default duration of 60 minutes
          price: service.price,
          status: 'PENDING',
          agentName: agent?.name,
          notes: body.notes
        }
      );
      
      // Send notification email to agent
      let agentEmailSent = false;
      if (agent && agent.email) {
        agentEmailSent = await sendAgentNotificationEmail(
          agent.email,
          agent.name,
          user.name,
          {
            _id: newBooking._id.toString(),
            serviceName: service.title,
            date: new Date(body.scheduledDate),
            duration: 60, // Default duration of 60 minutes
            notes: body.notes
          }
        );
      }
      
      // Update booking with email confirmation status
      await Booking.findByIdAndUpdate(newBooking._id, {
        'notifications.confirmationSent': true,
        'notifications.confirmationSentAt': new Date()
      });
      
      logger.info('Booking confirmation emails sent successfully', { 
        bookingId: newBooking._id.toString(),
        userEmailSent,
        agentEmailSent
      });
      
    } catch (emailError) {
      logger.error('Error sending booking confirmation emails', {
        bookingId: newBooking._id.toString(),
        error: emailError instanceof Error ? emailError.message : String(emailError)
      });
      // Don't fail the booking creation if email fails
    }
    
    return createApiResponse(
      true,
      populatedBooking,
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
} 