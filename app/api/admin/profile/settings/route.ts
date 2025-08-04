import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { createNamespaceLogger } from "@/lib/logger";
import User from "@/models/User";

const logger = createNamespaceLogger("api:admin:settings");

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences are required" },
        { status: 400 }
      );
    }

    // Update user preferences
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { 
        $set: { 
          preferences: {
            emailNotifications: preferences.emailNotifications ?? true,
            pushNotifications: preferences.pushNotifications ?? true,
            smsNotifications: preferences.smsNotifications ?? false,
            marketingEmails: preferences.marketingEmails ?? false,
            language: preferences.language ?? "en",
            timezone: preferences.timezone ?? "UTC"
          }
        } 
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    logger.info("Admin settings updated successfully", {
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "Settings updated successfully"
    });

  } catch (error) {
    logger.error("Error updating admin settings", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 