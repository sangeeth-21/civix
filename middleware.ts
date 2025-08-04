import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger, createNamespaceLogger } from '@/lib/logger'

// Create namespace-specific logger for middleware
const middlewareLogger = createNamespaceLogger('middleware');

// Configuration for public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/about',
  '/contact',
  '/services',
  '/terms-and-conditions',
  '/privacy-policy',
];

// Route patterns that will allow public access to them and their children
const publicPatterns = [
  /^\/services\/[^/]+$/,
  /^\/reset-password\/[^/]+$/,
  /^\/api\/auth\/.+$/,
  /^\/favicon\.ico$/,
  /^\/\_next\/.+$/,
];

// Configuration for role-based routes
const roleRestrictedRoutes = {
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/super-admin': ['SUPER_ADMIN'],
  '/agent': ['AGENT', 'ADMIN', 'SUPER_ADMIN'],
  '/user': ['USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN'],
};

// Static resource extensions to bypass auth checks
const staticResourceExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js'];

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Skip auth check for static resources
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Log request start (only for non-static resources)
  if (!staticResourceExtensions.some(ext => pathname.endsWith(ext)) && 
      !pathname.startsWith('/_next/') && 
      !pathname.startsWith('/api/auth/')) {
    middlewareLogger.info('Request started', {
      requestId,
      method: request.method,
      pathname: pathname,
    });
  }
  
  try {
    
    if (staticResourceExtensions.some(ext => pathname.endsWith(ext))) {
      return NextResponse.next();
    }
    
    // Check if this is a public route
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    
    // For now, let all authenticated routes pass through
    // The actual auth check will happen in the page components
    // This avoids the Mongoose model import issue in middleware
    middlewareLogger.info('Route requires authentication, proceeding to page-level auth', {
      requestId,
      pathname,
    });
    
    return NextResponse.next();
  } catch (error) {
    // Log middleware error
    middlewareLogger.error('Middleware error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // In case of error, default to login page
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  } finally {
    // Log request completion (only for non-static resources)
    if (!staticResourceExtensions.some(ext => pathname.endsWith(ext)) && 
        !pathname.startsWith('/_next/') && 
        !pathname.startsWith('/api/auth/')) {
      const duration = Date.now() - startTime;
      middlewareLogger.info('Request completed', {
        requestId,
        duration: `${duration}ms`,
        pathname: pathname,
      });
    }
  }
}

// Check if the path is public
const isPublicPath = (path: string) => {
  // Check exact route matches
  if (publicRoutes.includes(path)) {
    return true;
  }
  
  // Check regex pattern matches
  for (const pattern of publicPatterns) {
    if (pattern.test(path)) {
      return true;
    }
  }
  
  return false;
};

// Get allowed roles for a path
function getAllowedRoles(path: string) {
  // Check for exact matches first
  for (const [route, roles] of Object.entries(roleRestrictedRoutes)) {
    if (path === route) {
      return roles;
    }
  }
  
  // Check for nested routes
  for (const [route, roles] of Object.entries(roleRestrictedRoutes)) {
    if (path.startsWith(`${route}/`)) {
      return roles;
    }
  }
  
  // No specific roles required (shouldn't happen with proper config)
  return null;
}

// Define which routes this middleware should be applied to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
