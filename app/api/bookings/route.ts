import { NextRequest } from 'next/server';
import { Booking } from '@/models/Booking';
import { Service } from '@/models/Service';
import { User } from '@/models/User';
import { createApiResponse, requireAuth, handleApiError, getPaginationParams, createPaginationResponse } from '@/lib/api-utils';
import { sendBookingConfirmationEmail, sendAgentNotificationEmail } from '@/lib/services/email';
import { createNamespaceLogger } from '@/lib/logger';
import { createAuditLog, AuditActions } from '@/models/AuditLog';

const logger = createNamespaceLogger('api:bookings');

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { session, error } = await requireAuth(request, ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
    // Get pagination and filter parameters
    const { page, limit, sort, order } = getPaginationParams(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // Build filters based on user role
    const filters: any = {};
    
    // Regular user can only see their own bookings
    if (session!.user.role === 'USER') {
      filters.userId = parseInt(session!.user.id);
    }
    // Agent can see bookings assigned to them
    else if (session!.user.role === 'AGENT') {
      filters.agentId = parseInt(session!.user.id);
    }
    // Admin and Super Admin can see all bookings or filter as needed
    
    // Add status filter if provided
    if (status) {
      filters.status = status;
    }

    // Find bookings with details
    const { bookings, total } = await Booking.findWithDetails(filters, {
      page,
      limit,
      sort: `b.${sort}`,
      order
    });
    
    logger.info('Bookings retrieved successfully', {
      userId: session!.user.id,
      role: session!.user.role,
      total,
      filters
    });
    
    return createApiResponse(
      true,
      createPaginationResponse(bookings, total, page, limit)
    );
  } catch (error) {
    return handleApiError(error, 'Failed to fetch bookings');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { session, error } = await requireAuth(request, ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.serviceId || !body.scheduledDate) {
      return createApiResponse(
        false,
        undefined,
        'Service ID and scheduled date are required',
        400
      );
    }
    
    // Find service to get agent ID and verify it's active
    const service = await Service.findById(parseInt(body.serviceId));
    if (!service || !service.isActive) {
      return createApiResponse(
        false,
        undefined,
        'Service not found or inactive',
        404
      );
    }
    
    // Get user details for email
    const user = await User.findById(parseInt(session!.user.id));
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
    const bookingData = {
      userId: parseInt(session!.user.id),
      serviceId: service.id,
      agentId: service.agentId,
      scheduledDate: new Date(body.scheduledDate),
      amount: service.price,
      totalAmount: service.price,
      notes: body.notes || '',
      status: 'PENDING' as const,
      paymentStatus: 'PENDING' as const
    };
    
    const newBooking = await Booking.create(bookingData);
    
    // Create audit log
    await createAuditLog(parseInt(session!.user.id), AuditActions.BOOKING_CREATED, {
      entityId: newBooking.id,
      entityType: 'Booking',
      details: {
        serviceId: service.id,
        serviceName: service.title,
        amount: service.price,
        scheduledDate: body.scheduledDate
      }
    });
    
    // Send confirmation emails asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        logger.info('Sending booking confirmation emails', { 
          bookingId: newBooking.id,
          userId: session!.user.id,
          agentId: service.agentId 
        });
        
        // Send confirmation email to user
        if (user.email) {
          await sendBookingConfirmationEmail(
            user.email,
            user.name,
            {
              _id: newBooking.id.toString(),
              serviceName: service.title,
              date: new Date(body.scheduledDate),
              duration: 60, // Default duration of 60 minutes
              price: service.price,
              status: 'PENDING',
              agentName: agent?.name,
              notes: body.notes
            }
          );
        }
        
        // Send notification email to agent
        if (agent && agent.email) {
          await sendAgentNotificationEmail(
            agent.email,
            agent.name,
            user.name,
            {
              _id: newBooking.id.toString(),
              serviceName: service.title,
              date: new Date(body.scheduledDate),
              duration: 60,
              notes: body.notes
            }
          );
        }
        
        // Update booking with email confirmation status
        await Booking.update(newBooking.id, {
          notifications: JSON.stringify({
            confirmationSent: true,
            confirmationSentAt: new Date(),
            statusUpdateSent: false,
            notificationHistory: [{
              type: 'booking_confirmation',
              sentAt: new Date(),
              success: true
            }]
          })
        });
        
        logger.info('Booking confirmation emails sent successfully', { 
          bookingId: newBooking.id
        });
        
      } catch (emailError) {
        logger.error('Error sending booking confirmation emails', {
          bookingId: newBooking.id,
          error: emailError instanceof Error ? emailError.message : String(emailError)
        });
      }
    });
    
    // Get booking with details for response
    const { bookings } = await Booking.findWithDetails({ userId: newBooking.userId }, { limit: 1 });
    const bookingWithDetails = bookings.find(b => b.id === newBooking.id);
    
    logger.info('Booking created successfully', {
      bookingId: newBooking.id,
      userId: session!.user.id,
      serviceId: service.id
    });
    
    return createApiResponse(
      true,
      bookingWithDetails || newBooking,
      'Booking created successfully',
      201
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create booking');
  }
}