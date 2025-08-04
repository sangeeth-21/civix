import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:users:profile");

export async function GET(request: NextRequest) {
  let userId: string | undefined;
  
  try {
    // Authenticate user
    const session = await auth();
    userId = session?.user?.id;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find user by ID (exclude password)
    const user = await User.findById(userId, { password: 0 }).lean();
    
    if (!user) {
      logger.warn("User not found", { userId });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get user's bookings statistics
    const bookingsStats = await Booking.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: { 
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } 
          },
          pendingBookings: { 
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } 
          },
          cancelledBookings: { 
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } 
          },
          totalAmount: { 
            $sum: { 
              $cond: [
                { $eq: ["$status", "COMPLETED"] }, 
                "$totalAmount", 
                0
              ] 
            } 
          }
        }
      }
    ]);
    
    // Enrich user object with statistics
    const userWithStats = {
      ...user,
      stats: bookingsStats.length > 0 ? {
        totalBookings: bookingsStats[0].totalBookings,
        completedBookings: bookingsStats[0].completedBookings,
        pendingBookings: bookingsStats[0].pendingBookings,
        cancelledBookings: bookingsStats[0].cancelledBookings,
        totalSpent: bookingsStats[0].totalAmount,
      } : {
        totalBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0
      }
    };
    
    logger.info("Successfully fetched user profile", { userId });
    
    return NextResponse.json({
      success: true,
      data: userWithStats,
    });
  } catch (error) {
    logger.error("Error fetching user profile", {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user profile',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  let userId: string | undefined;
  
  try {
    // Authenticate user
    const session = await auth();
    userId = session?.user?.id;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn("Invalid JSON in request body", { 
        userId,
        error: parseError instanceof Error ? parseError.message : String(parseError)
      });
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    const { name, phone, address, bio, avatar } = body;
    
    // Validate data
    if (name !== undefined && name.trim().length < 2) {
      logger.warn("Invalid name value", { userId, nameLength: name?.trim().length });
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = { updatedAt: new Date() };
    const changedFields: string[] = [];
    
    if (name !== undefined) {
      updateData.name = name.trim();
      changedFields.push('name');
    }
    if (phone !== undefined) {
      updateData.phone = phone;
      changedFields.push('phone');
    }
    if (address !== undefined) {
      updateData.address = address;
      changedFields.push('address');
    }
    if (bio !== undefined) {
      updateData.bio = bio;
      changedFields.push('bio');
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
      changedFields.push('avatar');
    }
    
    // If no fields were provided, return error
    if (changedFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided to update" },
        { status: 400 }
      );
    }
    
    // Find user and update profile fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      logger.warn("User not found during profile update", { userId });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    logger.info("User profile updated", { 
      userId, 
      updatedFields: changedFields 
    });
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error("Error updating user profile", {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user profile',
      },
      { status: 500 }
    );
  }
} 