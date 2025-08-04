import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import connectDB from "@/lib/db";
import { createNamespaceLogger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import AuditLog, { AuditActions } from "@/models/AuditLog";
import { JWT } from "next-auth/jwt";

// Extend the next-auth types to include our custom properties
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }
  
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"]
  }
}

// Extend JWT module to include our custom properties
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

// Helper to get IP address from request
function getIpAddress(req: { headers?: any; socket?: any }): string {
  return req?.headers?.['x-forwarded-for']?.toString() || 
         req?.socket?.remoteAddress?.toString() || 
         'unknown';
}

// Helper to get user agent from request
function getUserAgent(req: { headers?: any }): string {
  return req?.headers?.['user-agent']?.toString() || 'unknown';
}

// Create a logger instance
const authLogger = createNamespaceLogger('auth');

// Function to log user logout
export async function logUserLogout(userId: string): Promise<void> {
  try {
    await connectDB();
    await AuditLog?.create({
      userId,
      action: AuditActions.LOGOUT,
    });
  } catch (error) {
    // Handle logout logging error silently
  }
}

// Use AUTH_SECRET environment variable or fallback to NEXTAUTH_SECRET for compatibility
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET environment variable is not set");
}

// Determine the correct URL for authentication
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

// Define auth options
const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          authLogger.warn('Login attempt with missing credentials');
          return null;
        }
        
        try {
          // Connect to the database
          await connectDB();
          
          // Verify User model is available
          if (!User) {
            authLogger.error('User model is not available');
            return null;
          }
          
          // Find the user by email
          const user = await User.findOne({ email: (credentials.email as string).toLowerCase().trim() });
          
          if (!user) {
            authLogger.warn('Login attempt with non-existent email', { email: credentials.email });
            return null;
          }
          
          if (!user.isActive) {
            // Log failed login attempt for inactive account
            try {
              await AuditLog?.create({
                userId: user._id,
                action: AuditActions.LOGIN_FAILED,
                details: { reason: 'Inactive account' },
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
              });
            } catch (logError) {
              // Handle audit log error silently
            }
            authLogger.warn('Login attempt for inactive account', { email: credentials.email });
            return null;
          }
          
          // Verify user.password exists and is hashed
          if (!user.password) {
            authLogger.error('User found but password field is missing', { 
              email: credentials.email,
              userId: user._id 
            });
            return null;
          }
          
          // Verify password is properly hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
          if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$') && !user.password.startsWith('$2y$')) {
            authLogger.error('User password is not properly hashed', { 
              email: credentials.email,
              userId: user._id,
              passwordLength: user.password.length
            });
            return null;
          }
          
          // Compare password using bcrypt
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password as string
          );
          
          // Log password comparison for debugging (only in debug mode)
          if (process.env.NEXTAUTH_DEBUG === 'true') {
            authLogger.debug('Password comparison', {
              email: credentials.email,
              passwordProvided: credentials.password ? 'yes' : 'no',
              userPasswordHash: user.password ? 'exists' : 'missing',
              passwordHashLength: user.password.length,
              isPasswordValid
            });
          }
          
          if (!isPasswordValid) {
            // Log failed login attempt due to invalid password
            try {
              await AuditLog?.create({
                userId: user._id,
                action: AuditActions.LOGIN_FAILED,
                details: { reason: 'Invalid password' },
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
              });
            } catch (logError) {
              // Handle audit log error silently
            }
            authLogger.warn('Login attempt with invalid password', { 
              email: credentials.email,
              userId: user._id,
              passwordHashLength: user.password.length
            });
            return null;
          }
          
          // Get the ID as string safely
          const userId = user._id ? user._id.toString() : "";
          
          // Update last login time
          await User.findByIdAndUpdate(userId, { 
            lastLogin: new Date() 
          });
          
          // Log successful login
          try {
            await AuditLog?.create({
              userId: user._id,
              action: AuditActions.LOGIN,
              ipAddress: getIpAddress(req),
              userAgent: getUserAgent(req),
            });
          } catch (logError) {
            // Handle audit log error silently
          }
          
          authLogger.info('User logged in successfully', { email: credentials.email, role: user.role });
          
          // Return the user without sensitive data
          return {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          authLogger.error('Error during authorization', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            email: credentials.email 
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
    newUser: "/register",
    verifyRequest: "/verify-request",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Use AUTH_SECRET environment variable or fallback to NEXTAUTH_SECRET for compatibility
  secret: authSecret,
  // Enable debug messages only in development and when explicitly enabled
  debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
  // Trust the host setting with built-in validation
  trustHost: true,
  
  // Logger for auth events
  logger: {
    error(error) {
      authLogger.error(error.message || 'Unknown error', { 
        stack: error instanceof Error ? error.stack : undefined 
      });
    },
    warn(message) {
      authLogger.warn(message);
    },
    debug(message, metadata) {
      // Only log debug messages if explicitly enabled
      if (process.env.NEXTAUTH_DEBUG === 'true') {
        authLogger.debug(message, (metadata as Record<string, unknown>) || {});
      }
    }
  }
};

// Create and export NextAuth
export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

// Wrap the original signOut to add audit logging
const originalSignOut = signOut;
export const enhancedSignOut = async (...args: Parameters<typeof signOut>) => {
  // Get current session to extract user ID
  const session = await auth();
  
  // Log the logout if we have a user ID
  if (session?.user?.id) {
    await logUserLogout(session.user.id);
  }
  
  // Call the original signOut function
  return originalSignOut(...args);
}; 