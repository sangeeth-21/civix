import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createNamespaceLogger } from '@/lib/logger';
import { sendWelcomeEmail } from '@/lib/services/email';

const logger = createNamespaceLogger('api:auth:register');

export async function POST(request: NextRequest) {
  try {
    logger.info('Processing registration request');
    
    await connectDB();
    
    const { name, email, password, phone } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      logger.warn('Registration attempt with missing required fields');
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if email is already in use
    logger.debug('Checking if email exists', { email });
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      return NextResponse.json(
        { success: false, error: 'Email is already in use' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 8) {
      logger.warn('Registration attempt with weak password', { email });
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Create new user (password will be hashed by the User model pre-save hook)
    const newUser = new User({
      name,
      email,
      password: password,
      role: 'USER',
      phone,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        notifications: {
          email: true,
          sms: false,
          marketing: false,
          reminders: true,
        },
        appearance: {
          theme: 'system',
          fontSize: 'medium',
          reduceAnimations: false,
          highContrast: false,
        },
        privacy: {
          profileVisibility: 'public',
          shareBookingHistory: false,
          shareContactInfo: false,
          allowDataCollection: true,
        },
      },
    });
    
    await newUser.save();
    
    logger.info('User registered successfully', { userId: newUser._id, email });
    
    // Send welcome email
    try {
      const emailSent = await sendWelcomeEmail(email, name);
      if (emailSent) {
        logger.info('Welcome email sent successfully', { email });
      } else {
        logger.warn('Failed to send welcome email', { email });
      }
    } catch (emailError) {
      logger.error('Error sending welcome email', { 
        email,
        error: emailError instanceof Error ? emailError.message : String(emailError)
      });
      // Continue with registration even if email fails
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        data: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error during registration', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
} 