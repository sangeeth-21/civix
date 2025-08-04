import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createNamespaceLogger } from '@/lib/logger';
import { sendPasswordResetEmail } from '@/lib/services/email';
import crypto from 'crypto';
import AuditLog, { AuditActions } from '@/models/AuditLog';

const logger = createNamespaceLogger('api:auth:forgot-password');

// Ensure AuditLog is available
if (!AuditLog) {
  throw new Error('AuditLog model not found');
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Processing forgot password request');
    
    await connectDB();
    
    const { email } = await request.json();
    
    // Validate input
    if (!email) {
      logger.warn('Forgot password attempt with missing email');
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // For security reasons, don't reveal if the email exists
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json(
        { success: true, message: 'If your email is registered, you will receive a password reset link' },
        { status: 200 }
      );
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save token to user record
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    
    // Generate reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    
    // Log the password reset request in audit log
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    try {
      await AuditLog?.create({
        userId: user._id,
        action: AuditActions.PASSWORD_RESET_REQUESTED,
        details: { 
          timestamp: new Date().toISOString(),
          email: user.email
        },
        ipAddress,
        userAgent
      });
    } catch (auditError) {
      logger.error('Failed to create audit log entry for password reset request', 
        { userId: user._id, error: (auditError as Error).message }
      );
      // Continue with the process even if audit logging fails
    }
    
    // Send email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
      resetUrl
    );
    
    if (!emailSent) {
      logger.error('Failed to send password reset email', { email: user.email });
      
      // Revert token changes if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return NextResponse.json(
        { success: false, error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }
    
    logger.info('Password reset email sent successfully', { email: user.email });
    
    return NextResponse.json(
      { success: true, message: 'Password reset link sent to your email' },
      { status: 200 }
    );
    
  } catch (error) {
    logger.error('Error in forgot password route', { error: (error as Error).message, stack: (error as Error).stack });
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
} 