import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Service from '@/models/Service';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid service ID format',
        },
        { status: 400 }
      );
    }
    
    // Find service by ID
    const service = await Service.findById(id).lean();
    
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: service,
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication and authorization
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid service ID format',
        },
        { status: 400 }
      );
    }
    
    // Find service by ID
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found',
        },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to update this service
    const isOwner = service.agentId.toString() === session.user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this service' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Update service
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedService,
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication and authorization
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid service ID format',
        },
        { status: 400 }
      );
    }
    
    // Find service by ID
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found',
        },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to delete this service
    const isOwner = service.agentId.toString() === session.user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this service' },
        { status: 403 }
      );
    }
    
    // Delete service (soft delete)
    await Service.findByIdAndUpdate(id, { isActive: false });
    
    return NextResponse.json({
      success: true,
      message: `Service ${id} deleted successfully`,
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