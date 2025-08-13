import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { User } from "@/models/User"
import { createNamespaceLogger } from "@/lib/logger"
import { createAuditLog, AuditActions } from "@/models/AuditLog"

const logger = createNamespaceLogger('auth');

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            logger.warn('Missing credentials in login attempt');
            return null;
          }

          logger.info('Login attempt', { email: credentials.email });

          const user = await User.findByEmail(credentials.email);
          if (!user) {
            logger.warn('User not found', { email: credentials.email });
            
            // Create audit log for failed login
            await createAuditLog(0, AuditActions.LOGIN_FAILED, {
              details: { email: credentials.email, reason: 'User not found' },
              ipAddress: req?.headers?.['x-forwarded-for'] as string || req?.ip,
              userAgent: req?.headers?.['user-agent'] as string
            });
            
            return null;
          }

          if (!user.isActive) {
            logger.warn('Inactive user login attempt', { email: credentials.email, userId: user.id });
            
            await createAuditLog(user.id, AuditActions.LOGIN_FAILED, {
              details: { reason: 'Account inactive' },
              ipAddress: req?.headers?.['x-forwarded-for'] as string || req?.ip,
              userAgent: req?.headers?.['user-agent'] as string
            });
            
            return null;
          }

          const isPasswordValid = await User.comparePassword(credentials.password, user.password);
          if (!isPasswordValid) {
            logger.warn('Invalid password', { email: credentials.email, userId: user.id });
            
            await createAuditLog(user.id, AuditActions.LOGIN_FAILED, {
              details: { reason: 'Invalid password' },
              ipAddress: req?.headers?.['x-forwarded-for'] as string || req?.ip,
              userAgent: req?.headers?.['user-agent'] as string
            });
            
            return null;
          }

          // Update last login
          await User.update(user.id, { lastLogin: new Date() });

          // Create successful login audit log
          await createAuditLog(user.id, AuditActions.LOGIN, {
            details: { loginMethod: 'credentials' },
            ipAddress: req?.headers?.['x-forwarded-for'] as string || req?.ip,
            userAgent: req?.headers?.['user-agent'] as string
          });

          logger.info('Successful login', { email: credentials.email, userId: user.id });

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive
          };

        } catch (error) {
          logger.error('Authentication error', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            email: credentials?.email 
          });
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        logger.info('User signed out', { userId: token.sub });
        
        await createAuditLog(parseInt(token.sub), AuditActions.LOGOUT, {
          details: { logoutMethod: 'manual' }
        });
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};