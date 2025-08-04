import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiResponse } from '@/types/next-api';
import { Session } from 'next-auth';

/**
 * Utility function to create a standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  status: number = success ? 200 : 400
): NextResponse {
  const response: ApiResponse<T> = {
    success,
    ...(data !== undefined && { data }),
    ...(error !== undefined && { error }),
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Utility function to handle authentication for API routes
 */
export async function requireAuth(
  req: NextRequest,
  roles?: string[]
): Promise<{ session: Session | null; error: NextResponse | null }> {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return {
        session: null,
        error: createApiResponse(false, undefined, 'Authentication required', 401),
      };
    }
    
    // Check if user has required role
    if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
      return {
        session,
        error: createApiResponse(false, undefined, 'Insufficient permissions', 403),
      };
    }
    
    return { session, error: null };
  } catch (error) {
    return {
      session: null,
      error: createApiResponse(
        false,
        undefined,
        'Authentication error',
        500
      ),
    };
  }
}

/**
 * Utility function to handle API errors
 */
export function handleApiError(error: unknown): NextResponse {
  return createApiResponse(
    false,
    undefined,
    error instanceof Error ? error.message : 'Internal server error',
    500
  );
}

/**
 * Type-safe function to extract params from route handler
 */
export function getRouteParam<T extends string>(
  params: Record<string, string | string[]>,
  param: T
): string | null {
  const value = params[param];
  return typeof value === 'string' ? value : null;
} 

/**
 * Standardized error response helper
 */
export function apiError(message: string, status: number = 400, details?: any) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

/**
 * Ownership check utility for agent resources
 * Throws or returns false if not owner
 */
export function checkAgentOwnership(resourceAgentId: any, sessionUserId: any): boolean {
  if (!resourceAgentId || !sessionUserId) return false;
  return resourceAgentId.toString() === sessionUserId.toString();
} 