import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { createNamespaceLogger } from '@/lib/logger';
import * as z from "zod";

const logger = createNamespaceLogger("api:support:tickets");

const ticketSchema = z.object({
  subject: z.string().min(5),
  category: z.string().min(1),
  priority: z.string().min(1),
  message: z.string().min(10).optional(),
  description: z.string().min(10).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    // Build query
    const query: any = { userId: session.user.id };
    
    if (status && status !== "all") {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = priority;
    }

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: tickets
    });

  } catch (error) {
    logger.error("Error fetching support tickets", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parseResult = ticketSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request", details: parseResult.error.issues }, { status: 400 });
    }
    const { subject, category, priority, message, description } = parseResult.data;

    // Create new support ticket
    const ticket = new SupportTicket({
      userId: session.user.id,
      subject,
      description: description || message,
      category,
      priority,
      status: "open"
    });

    await ticket.save();

    logger.info("User created support ticket", {
      userId: session.user.id,
      ticketId: ticket._id,
      subject
    });

    return NextResponse.json({
      success: true,
      data: ticket,
      message: "Support ticket created successfully"
    }, { status: 201 });

  } catch (error) {
    logger.error("Error creating support ticket", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 