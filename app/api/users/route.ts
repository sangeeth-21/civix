import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Only admin and super admin can access user list
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to access user data' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build the filter
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Find users with pagination - exclude password
    const users = await User.find(filter, { password: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await User.countDocuments(filter);
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // For user creation (registration), we may not require authentication
    // However, we should check for admin privileges if creating special roles
    
    const body = await request.json();
    const { name, email, password, role = 'USER' } = body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }
    
    // If creating admin or agent role, check authorization
    if (role !== 'USER') {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Only admin can create agent accounts
      if (role === 'AGENT' && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: 'Not authorized to create agent accounts' },
          { status: 403 }
        );
      }
      
      // Only super admin can create admin accounts
      if (role === 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Not authorized to create admin accounts' },
          { status: 403 }
        );
      }
      
      // Only super admin can create super admin accounts
      if (role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Not authorized to create super admin accounts' },
          { status: 403 }
        );
      }
    }
    
    await connectDB();
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already in use',
        },
        { status: 400 }
      );
    }
    
    // Create user (password will be hashed by mongoose pre-save hook)
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      isActive: true,
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    
    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
