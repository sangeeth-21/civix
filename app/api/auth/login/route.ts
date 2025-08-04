import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger('api:auth:login');

export async function POST(request: NextRequest) {
  try {
    logger.info('Processing login request');
    
    await connectDB();
    
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    logger.debug('Finding user by email', { email });
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      logger.warn('Login attempt for non-existent user', { email });
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login attempt for inactive account', { email });
      return NextResponse.json(
        { success: false, error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { email });
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    
    // Create JWT token (for non-NextAuth authentication)
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    // Log successful login
    logger.info('User logged in successfully', { email, userId: user._id });
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      }
    });
  } catch (error) {
    logger.error('Error during login', { 
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