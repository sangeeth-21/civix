import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createNamespaceLogger } from '@/lib/logger';
import { z } from 'zod';
import AuditLog, { AuditActions } from '@/models/AuditLog';

const logger = createNamespaceLogger('api:auth:reset-password');

// Validate token
export async function GET(request: NextRequest) {
  try {
    logger.info('Validating reset password token');
    
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      logger.warn('Token validation attempt without token');
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Find user with this token and ensure it's not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      logger.warn('Invalid or expired token', { token });
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    logger.info('Token validation successful', { userId: user._id });
    return NextResponse.json(
      { success: true, message: 'Token is valid' },
      { status: 200 }
    );
    
  } catch (error) {
    logger.error('Error validating token', { error: (error as Error).message, stack: (error as Error).stack });
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Password validation schema
const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  token: z.string().min(1, "Token is required")
});

// Reset password
export async function POST(request: NextRequest) {
  try {
    logger.info('Processing password reset request');
    
    await connectDB();
    
    const body = await request.json();
    
    try {
      // Validate request body against schema
      const { password, token } = passwordSchema.parse(body);
      
      // Find user with this token and ensure it's not expired
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
      
      if (!user) {
        logger.warn('Reset password attempt with invalid or expired token', { token });
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token. Please request a new password reset.' },
          { status: 400 }
        );
      }
      
      // Update user's password and clear reset token (password will be hashed by User model pre-save hook)
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      // Log the password reset action in audit log
      const ipAddress = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
                        
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      try {
        await AuditLog?.create({
          userId: user._id,
          action: AuditActions.PASSWORD_RESET_COMPLETED,
          details: { 
            timestamp: new Date().toISOString()
          },
          ipAddress,
          userAgent
        });
      } catch (auditError) {
        logger.error('Failed to create audit log entry for password reset', 
          { userId: user._id, error: (auditError as Error).message }
        );
        // We don't return an error here, as the password reset was successful
      }
      
      logger.info('Password reset successful', { userId: user._id });
      
      return NextResponse.json(
        { success: true, message: 'Your password has been successfully updated' },
        { status: 200 }
      );
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.format();
        const errorMessages = Object.values(formattedErrors)
          .filter(value => value && typeof value === 'object' && '_errors' in value)
          .flatMap(value => (value as { _errors: string[] })._errors);
        
        logger.warn('Password reset validation error', { errors: errorMessages });
        return NextResponse.json(
          { success: false, error: errorMessages.join(', ') },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
  } catch (error) {
    logger.error('Error in password reset', { error: (error as Error).message, stack: (error as Error).stack });
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
} 