import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { createNamespaceLogger } from "@/lib/logger";

const logger = createNamespaceLogger("api:admin:settings");

// In a real application, you'd store these in a database
// For now, we'll use a simple in-memory object
let systemSettings = {
  maintenance: {
    enabled: false,
    message: "System is under maintenance. Please try again later.",
    allowedIPs: ["127.0.0.1", "::1"]
  },
  email: {
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    fromName: "Civix Support"
  },
  security: {
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 15
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    adminAlerts: true
  },
  integrations: {
    googleAnalytics: "",
    facebookPixel: "",
    stripeEnabled: false,
    stripeKey: ""
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: systemSettings
    });

  } catch (error) {
    logger.error("Error fetching settings", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Update settings
    systemSettings = {
      ...systemSettings,
      ...body
    };

    return NextResponse.json({
      success: true,
      data: systemSettings,
      message: "Settings updated successfully"
    });

  } catch (error) {
    logger.error("Error updating settings", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 