// Type declarations for Next.js API routes
import { NextRequest, NextResponse } from "next/server";

// Extend NextResponse to include custom properties that might be used in route handlers
declare module "next/server" {
  interface NextResponse {
    // Add any custom properties your routes might expect
    params?: Record<string, string>;
  }
}

// Helper type for route handlers with params
export interface RouteHandlerWithParams {
  params: {
    [key: string]: string;
  };
}

// Helper type for API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 