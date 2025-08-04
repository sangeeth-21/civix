import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:users:settings:appearance");

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

    // Find user by ID and get appearance settings
    const user = await User.findById(userId)
      .select('settings.appearance')
      .lean();

    if (!user) {
      logger.warn("User not found", { userId });
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get appearance settings or use defaults
    const appearanceSettings = user.settings?.appearance || {
      theme: 'system',
      fontSize: 'medium',
      reduceAnimations: false,
      highContrast: false
    };

    logger.info("Successfully fetched appearance settings", { userId });
    
    return NextResponse.json({
      success: true,
      data: appearanceSettings
    });

  } catch (error) {
    logger.error("Error fetching appearance settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown'
    });
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch appearance settings" },
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
    
    const { theme, fontSize, reduceAnimations, highContrast } = body;
    
    // Validate theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      logger.warn("Invalid theme value", { userId, theme });
      return NextResponse.json(
        { success: false, error: "Invalid theme value" },
        { status: 400 }
      );
    }
    
    // Validate fontSize
    if (fontSize && !['small', 'medium', 'large', 'x-large'].includes(fontSize)) {
      logger.warn("Invalid font size value", { userId, fontSize });
      return NextResponse.json(
        { success: false, error: "Invalid font size value" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { 'settings.updatedAt': new Date() };
    const changedFields: string[] = [];
    
    if (theme !== undefined) {
      updateData['settings.appearance.theme'] = theme;
      changedFields.push('theme');
    }
    if (fontSize !== undefined) {
      updateData['settings.appearance.fontSize'] = fontSize;
      changedFields.push('fontSize');
    }
    if (reduceAnimations !== undefined) {
      updateData['settings.appearance.reduceAnimations'] = Boolean(reduceAnimations);
      changedFields.push('reduceAnimations');
    }
    if (highContrast !== undefined) {
      updateData['settings.appearance.highContrast'] = Boolean(highContrast);
      changedFields.push('highContrast');
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
    ).select('settings.appearance').lean();

    if (!updatedUser) {
      logger.warn("User not found during settings update", { userId });
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    logger.info("Appearance settings updated", { 
      userId,
      updatedFields: changedFields
    });
    
    // Extract appearance settings or use defaults
    const appearanceSettings = updatedUser.settings?.appearance || {
      theme: 'system',
      fontSize: 'medium',
      reduceAnimations: false,
      highContrast: false
    };

    return NextResponse.json({
      success: true,
      data: appearanceSettings,
      message: "Appearance settings updated successfully"
    });

  } catch (error) {
    logger.error("Error updating appearance settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { success: false, error: "Failed to update appearance settings" },
      { status: 500 }
    );
  }
} 