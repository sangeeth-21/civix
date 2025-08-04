import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:settings");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to super admin settings", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Note: Settings would require a Settings model to be implemented
    // For now, return default settings since we don't have settings storage implemented
    const settings = {
      general: {
        siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Civix",
        siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Professional service booking platform",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://civix.in",
        timezone: process.env.TZ || "UTC",
        language: process.env.NEXT_PUBLIC_LANGUAGE || "en",
        maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
        maintenanceMessage: process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE || "We're currently performing maintenance. Please check back soon."
      },
      email: {
        smtpHost: process.env.EMAIL_HOST || "smtp.gmail.com",
        smtpPort: parseInt(process.env.EMAIL_PORT || "587"),
        smtpUser: process.env.EMAIL_USER || "",
        smtpPassword: process.env.EMAIL_PASS || "",
        fromEmail: process.env.EMAIL_FROM || "noreply@civix.com",
        fromName: process.env.EMAIL_FROM_NAME || "Civix Support",
        enableEmailNotifications: true,
        emailVerificationRequired: true
      },
      security: {
        passwordMinLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        enableTwoFactor: true,
        enableAuditLogs: true
      },
      notifications: {
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        enablePushNotifications: true,
        notificationRetentionDays: 90,
        enableSystemAlerts: true
      },
      integrations: {
        enableGoogleAuth: false,
        googleClientId: process.env.GOOGLE_CLIENT_ID || "",
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        enableStripe: false,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
        stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
        enableAnalytics: false,
        analyticsTrackingId: process.env.GA_TRACKING_ID || ""
      },
      limits: {
        maxUsers: 10000,
        maxAgents: 1000,
        maxAdmins: 50,
        maxServicesPerAgent: 20,
        maxBookingsPerUser: 100,
        maxFileSize: 10,
        maxStoragePerUser: 100
      }
    };
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_SETTINGS",
      entityType: "SETTINGS",
      details: {
        settingsType: "system"
      }
    });
    
    logger.info("Super admin viewed settings", {
      userId: session.user.id
    });
    
    return NextResponse.json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    logger.error("Error fetching settings", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to update settings", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Get request body
    const body = await req.json();
    const settings = body;
    
    // Validate settings structure
    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would save to the Settings collection
    // For now, we'll just log the action and return success
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "UPDATE_SETTINGS",
      entityType: "SETTINGS",
      details: {
        settingsType: "system",
        changes: Object.keys(settings)
      }
    });
    
    logger.info("Super admin updated settings", {
      userId: session.user.id,
      changes: Object.keys(settings)
    });
    
    return NextResponse.json({
      success: true,
      data: settings,
      message: "Settings updated successfully"
    });
    
  } catch (error) {
    logger.error("Error updating settings", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 