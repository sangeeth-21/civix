import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createNamespaceLogger } from './logger';

const logger = createNamespaceLogger('api-utils');

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function createApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success,
    ...(data && { data }),
    ...(message && success && { message }),
    ...(message && !success && { error: message }),
  };

  return NextResponse.json(response, { status });
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{
  session: any;
  error?: NextResponse;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      logger.warn('Unauthorized access attempt - no session');
      return {
        session: null,
        error: createApiResponse(false, undefined, 'Authentication required', 401)
      };
    }

    if (!session.user.isActive) {
      logger.warn('Inactive user access attempt', { userId: session.user.id });
      return {
        session: null,
        error: createApiResponse(false, undefined, 'Account is inactive', 403)
      };
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      logger.warn('Insufficient permissions', { 
        userId: session.user.id, 
        role: session.user.role, 
        allowedRoles 
      });
      return {
        session: null,
        error: createApiResponse(false, undefined, 'Insufficient permissions', 403)
      };
    }

    return { session };

  } catch (error) {
    logger.error('Authentication check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      session: null,
      error: createApiResponse(false, undefined, 'Authentication failed', 500)
    };
  }
}

export function handleApiError(error: unknown, defaultMessage: string = 'Internal server error'): NextResponse {
  logger.error('API Error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('validation')) {
      return createApiResponse(false, undefined, 'Validation error', 400);
    }
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return createApiResponse(false, undefined, 'Resource already exists', 409);
    }
    if (error.message.includes('not found')) {
      return createApiResponse(false, undefined, 'Resource not found', 404);
    }
  }

  return createApiResponse(false, undefined, defaultMessage, 500);
}

export function validateRequiredFields(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      return `Field '${field}' is required`;
    }
  }
  return null;
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  
  const { password, resetPasswordToken, resetPasswordExpires, ...sanitized } = user;
  return sanitized;
}

export function getPaginationParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))),
    sort: searchParams.get('sort') || 'createdAt',
    order: (searchParams.get('order')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC'
  };
}

export function createPaginationResponse(
  data: any[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}