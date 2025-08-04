import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:users:settings:notifications");

export async function GET(request: NextRequest) {
  let userId: string | undefined;
  
  try {
    // Authenticate user
    const session = await auth();
    userId = session?.user?.id;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" }, 
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user by ID and get notifications settings
    const user = await User.findById(userId)
      .select('settings.notifications')
      .lean();

    if (!user) {
      logger.warn("User not found", { userId });
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get notification settings or use defaults
    const notificationSettings = user.settings?.notifications || {
      email: true,
      sms: false,
      marketing: false,
      reminders: true
    };

    // Map to client-friendly format
    const responseData = {
      emailNotifications: notificationSettings.email,
      smsNotifications: notificationSettings.sms,
      marketingEmails: notificationSettings.marketing,
      bookingReminders: notificationSettings.reminders
    };
    
    logger.info("Successfully fetched notification settings", { userId });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    logger.error("Error fetching notification settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown'
    });
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch notification settings" },
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
        { success: false, error: "Authentication required" }, 
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
    
    const { emailNotifications, smsNotifications, marketingEmails, bookingReminders } = body;

    // Prepare update data
    const updateData: any = { 'settings.updatedAt': new Date() };
    const changedFields: string[] = [];
    
    if (emailNotifications !== undefined) {
      updateData['settings.notifications.email'] = Boolean(emailNotifications);
      changedFields.push('email');
    }
    if (smsNotifications !== undefined) {
      updateData['settings.notifications.sms'] = Boolean(smsNotifications);
      changedFields.push('sms');
    }
    if (marketingEmails !== undefined) {
      updateData['settings.notifications.marketing'] = Boolean(marketingEmails);
      changedFields.push('marketing');
    }
    if (bookingReminders !== undefined) {
      updateData['settings.notifications.reminders'] = Boolean(bookingReminders);
      changedFields.push('reminders');
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
    ).select('settings.notifications').lean();

    if (!updatedUser) {
      logger.warn("User not found during settings update", { userId });
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    logger.info("Notification settings updated", {
      userId,
      updatedFields: changedFields
    });
    
    // Extract notification settings or use defaults
    const notificationSettings = updatedUser.settings?.notifications || {
      email: true,
      sms: false,
      marketing: false,
      reminders: true
    };

    // Map to client-friendly format
    const responseData = {
      emailNotifications: notificationSettings.email,
      smsNotifications: notificationSettings.sms,
      marketingEmails: notificationSettings.marketing,
      bookingReminders: notificationSettings.reminders
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: "Notification settings updated successfully"
    });

  } catch (error) {
    logger.error("Error updating notification settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { success: false, error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
} 