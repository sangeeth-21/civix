import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:users:settings:privacy");

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
    
    // Find user by ID and get privacy settings
    const user = await User.findById(userId).select('settings.privacy').lean();
    
    if (!user) {
      logger.warn("User not found", { userId });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return privacy settings or default values
    const privacySettings = user.settings?.privacy || {
      profileVisibility: 'public',
      shareBookingHistory: false,
      shareContactInfo: false,
      allowDataCollection: true
    };
    
    logger.info("Successfully fetched privacy settings", { userId });
    
    return NextResponse.json({
      success: true,
      data: privacySettings,
    });
  } catch (error) {
    logger.error("Error fetching privacy settings", { 
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch privacy settings',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    const { profileVisibility, shareBookingHistory, shareContactInfo, allowDataCollection } = body;
    
    // Validate inputs
    if (profileVisibility && !['public', 'contacts', 'private'].includes(profileVisibility)) {
      logger.warn("Invalid profile visibility option", { userId, profileVisibility });
      return NextResponse.json(
        { success: false, error: 'Invalid profile visibility option' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = { 'settings.updatedAt': new Date() };
    const changedFields: string[] = [];
    
    if (profileVisibility !== undefined) {
      updateData['settings.privacy.profileVisibility'] = profileVisibility;
      changedFields.push('profileVisibility');
    }
    if (shareBookingHistory !== undefined) {
      updateData['settings.privacy.shareBookingHistory'] = Boolean(shareBookingHistory);
      changedFields.push('shareBookingHistory');
    }
    if (shareContactInfo !== undefined) {
      updateData['settings.privacy.shareContactInfo'] = Boolean(shareContactInfo);
      changedFields.push('shareContactInfo');
    }
    if (allowDataCollection !== undefined) {
      updateData['settings.privacy.allowDataCollection'] = Boolean(allowDataCollection);
      changedFields.push('allowDataCollection');
    }
    
    // If no fields were provided, return error
    if (changedFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid settings provided" },
        { status: 400 }
      );
    }
    
    // Update user settings
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('settings.privacy').lean();
    
    if (!updatedUser) {
      logger.warn("User not found during settings update", { userId });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    logger.info("Privacy settings updated", { 
      userId, 
      updatedFields: changedFields 
    });
    
    // Get updated privacy settings
    const updatedPrivacySettings = updatedUser?.settings?.privacy || {
      profileVisibility: 'public',
      shareBookingHistory: false,
      shareContactInfo: false,
      allowDataCollection: true
    };
    
    return NextResponse.json({
      success: true,
      data: updatedPrivacySettings,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    logger.error("Error updating privacy settings", { 
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update privacy settings',
      },
      { status: 500 }
    );
  }
} 