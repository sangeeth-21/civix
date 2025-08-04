import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:support:tickets:id");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const ticket = await SupportTicket.findOne({
      _id: resolvedParams.id,
      userId: session.user.id
    }).populate('userId', 'name email').lean();

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    logger.error("Error fetching support ticket", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    const ticket = await SupportTicket.findOneAndUpdate(
      {
        _id: resolvedParams.id,
        userId: session.user.id
      },
      {
        $set: {
          ...(status && { status }),
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    logger.info("User updated support ticket", {
      userId: session.user.id,
      ticketId: resolvedParams.id,
      updatedFields: Object.keys(body)
    });

    return NextResponse.json({
      success: true,
      data: ticket,
      message: "Ticket updated successfully"
    });

  } catch (error) {
    logger.error("Error updating support ticket", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 