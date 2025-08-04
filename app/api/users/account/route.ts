import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import SupportTicket from '@/models/SupportTicket';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Find user by ID (exclude password)
    const user = await User.findById(session.user.id, { password: 0 }).lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get account stats
    const bookingsCount = await Booking.countDocuments({ userId: session.user.id });
    const activeBookingsCount = await Booking.countDocuments({ 
      userId: session.user.id,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });
    const supportTicketsCount = await SupportTicket.countDocuments({ userId: session.user.id });
    
    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          totalBookings: bookingsCount,
          activeBookings: activeBookingsCount,
          supportTickets: supportTicketsCount,
          memberSince: user.createdAt,
        }
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const confirmation = searchParams.get('confirm');
    
    // Require confirmation parameter
    if (confirmation !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Confirmation required to delete account' },
        { status: 400 }
      );
    }
    
    // Check for active bookings
    const activeBookingsCount = await Booking.countDocuments({ 
      userId: session.user.id,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });
    
    if (activeBookingsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete account with active bookings. Please cancel all active bookings first.',
          activeBookings: activeBookingsCount
        },
        { status: 400 }
      );
    }
    
    // Optional: Get password from request body for extra verification
    let passwordVerified = false;
    
    try {
      const body = await request.json();
      if (body.password) {
        // Find user with password
        const user = await User.findById(session.user.id);
        if (user) {
          passwordVerified = await bcrypt.compare(body.password, user.password);
          
          if (!passwordVerified) {
            return NextResponse.json(
              { success: false, error: 'Incorrect password' },
              { status: 400 }
            );
          }
        }
      }
    } catch (e) {
      // If no body or password is provided, proceed without password verification
    }
    
    // Delete user
    const deletedUser = await User.findByIdAndDelete(session.user.id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Optional: Mark user data in related collections as deleted or anonymized instead of deleting
    await Booking.updateMany(
      { userId: session.user.id },
      { $set: { userDeleted: true } }
    );
    
    await SupportTicket.updateMany(
      { userId: session.user.id },
      { $set: { userDeleted: true } }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
} 