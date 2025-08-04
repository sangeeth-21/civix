import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Check if we can access auth without throwing errors
    const session = await auth();
    
    // Return diagnostic information (without sensitive data)
    return NextResponse.json({
      status: "ok",
      session: session ? "exists" : "none",
      auth_configured: true,
      environment: process.env.NODE_ENV || "unknown",
      host: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "not_set",
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    // Return error details to help diagnose the issue
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : null,
      environment: process.env.NODE_ENV || "unknown",
      host: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "not_set",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 