// Re-export auth from the root auth.ts file for API routes (server-side only)
export * from '@/auth';

// Logging helpers
import { createNamespaceLogger } from './logger';
const logger = createNamespaceLogger('auth');

export const logAuthEvent = {
  signIn: (userId: string, email: string) => {
    logger.info('User sign in', { userId, email });
  },
  signOut: (userId: string) => {
    logger.info('User signed out', { userId });
  },
  createUser: (userId: string, email: string) => {
    logger.info('User created', { userId, email });
  },
  linkAccount: (userId: string, provider: string) => {
    logger.info('Account linked', { userId, provider });
  }
};

// Client-safe auth utilities
export const getAuthConfig = () => {
  return {
    providers: [],
    pages: {
      signIn: "/login",
      signOut: "/",
      error: "/error",
      newUser: "/register",
      verifyRequest: "/verify-request",
    },
    session: {
      strategy: "jwt" as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  };
}; 