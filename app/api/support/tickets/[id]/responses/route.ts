import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:support:tickets:responses");

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
    }).populate('responses.userId', 'name role').lean() as any;

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket.responses || []
    });

  } catch (error) {
    logger.error("Error fetching ticket responses", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findOne({
      _id: resolvedParams.id,
      userId: session.user.id
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Add response to ticket
    const response = {
      userId: session.user.id,
      message,
      isStaff: false,
      createdAt: new Date()
    };

    ticket.responses.push(response);
    ticket.updatedAt = new Date();
    await ticket.save();

    logger.info("User added response to ticket", {
      userId: session.user.id,
      ticketId: resolvedParams.id
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: "Response added successfully"
    }, { status: 201 });

  } catch (error) {
    logger.error("Error adding ticket response", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 