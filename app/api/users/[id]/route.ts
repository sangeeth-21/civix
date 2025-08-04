import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const userId = resolvedParams.id;
    
    // Validate ID
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Get user by ID (exclude password)
    const user = await User.findById(userId, { password: 0 }).lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check privacy settings for non-admins/staff
    // If the requested user is not the current user and the current user is not admin/staff
    if (
      userId !== session.user.id &&
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      // If the user is an agent, we allow viewing basic info
      if (user.role === 'AGENT') {
        // Get bookings between the current user and this agent
        const bookingsWithAgent = await Booking.find({
          userId: session.user.id,
          agentId: userId
        }).lean();
        
        // If no bookings, check if the agent's profile is public
        if (bookingsWithAgent.length === 0 && 
            user.settings?.privacy?.profileVisibility !== 'public') {
          return NextResponse.json(
            { success: false, error: 'Unauthorized to view this profile' },
            { status: 403 }
          );
        }
        
        // For agents, return only public information
        return NextResponse.json({
          success: true,
          data: {
            id: user._id,
            name: user.name,
            role: user.role,
            // Only return contact info if privacy settings allow or has bookings
            ...(user.settings?.privacy?.shareContactInfo || bookingsWithAgent.length > 0 
              ? { phone: user.phone, email: user.email } 
              : {}),
            // Additional agent-specific fields could be added here
          }
        });
      } else {
        // For regular users, check privacy settings more strictly
        if (user.settings?.privacy?.profileVisibility === 'private') {
          return NextResponse.json(
            { success: false, error: 'Profile is private' },
            { status: 403 }
          );
        }
        
        // Return limited info based on privacy settings
        return NextResponse.json({
          success: true,
          data: {
            id: user._id,
            name: user.name,
            role: user.role,
            ...(user.settings?.privacy?.shareContactInfo ? { email: user.email } : {})
          }
        });
      }
    }
    
    // For admins or users viewing their own profile, return full info
    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    const resolvedParams = await params;
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const id = resolvedParams.id;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID format',
        },
        { status: 400 }
      );
    }
    
    // Users can update their own profile, admins can update any profile
    const isSelfUpdate = session.user.id === id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    
    if (!isSelfUpdate && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this user' },
        { status: 403 }
      );
    }
    
    // Find user first to check if exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { email, role, password, ...otherData } = body;
    
    // Build update object
    const updateData: Record<string, unknown> = { ...otherData };
    
    // Only admins can change roles
    if (role && isAdmin) {
      // Super admins can assign any role
      if (session.user.role === 'SUPER_ADMIN') {
        updateData.role = role;
      } 
      // Admins can't promote to SUPER_ADMIN
      else if (session.user.role === 'ADMIN' && role !== 'SUPER_ADMIN') {
        updateData.role = role;
      }
      else {
        return NextResponse.json(
          { success: false, error: 'Not authorized to assign this role' },
          { status: 403 }
        );
      }
    }
    
    // Handle password change separately (will be hashed by mongoose pre-save)
    if (password) {
      // Only allow password change for self or by admin
      if (isSelfUpdate || isAdmin) {
        existingUser.password = password;
        await existingUser.save();
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    const resolvedParams = await params;
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const id = resolvedParams.id;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID format',
        },
        { status: 400 }
      );
    }
    
    // Only admins can delete users
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete users' },
        { status: 403 }
      );
    }
    
    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Find user first to check if exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }
    
    // Soft delete user (set isActive to false)
    const deletedUser = await User.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    
    return NextResponse.json({
      success: true,
      data: deletedUser,
    });
  } catch (error) {
    const resolvedParams = await params;
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
} 