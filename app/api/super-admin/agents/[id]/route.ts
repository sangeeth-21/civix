import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const agent = await User.findOne({
      _id: resolvedParams.id,
      role: { $in: ["AGENT", "ADMIN"] }
    }).select("-password");

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    logger.info("Super admin fetched agent details", {
      userId: session.user.id,
      agentId: resolvedParams.id
    });

    return NextResponse.json({ data: agent });

  } catch (error) {
    logger.error("Error fetching agent", { error });
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
    const resolvedParams = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { name, email, phone, role, isActive, profile } = body;

    const agent = await User.findOne({
      _id: resolvedParams.id,
      role: { $in: ["AGENT", "ADMIN"] }
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Update fields
    if (name) agent.name = name;
    if (email) agent.email = email;
    if (phone !== undefined) agent.phone = phone;
    if (role) agent.role = role;
    if (isActive !== undefined) agent.isActive = isActive;
    if (profile) {
      (agent as { profile?: Record<string, unknown> }).profile = { 
        ...(agent as { profile?: Record<string, unknown> }).profile, 
        ...profile 
      };
    }

    await agent.save();

    logger.info("Super admin updated agent", {
      userId: session.user.id,
      agentId: resolvedParams.id,
      updatedFields: Object.keys(body)
    });

    return NextResponse.json({
      message: "Agent updated successfully",
      data: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive
      }
    });

  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error updating agent", { error, agentId: resolvedParams.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const agent = await User.findOne({
      _id: resolvedParams.id,
      role: { $in: ["AGENT", "ADMIN"] }
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Prevent deletion of self
    if ((agent._id as { toString: () => string }).toString() === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(resolvedParams.id);

    logger.info("Super admin deleted agent", {
      userId: session.user.id,
      agentId: resolvedParams.id,
      agentEmail: agent.email
    });

    return NextResponse.json({
      message: "Agent deleted successfully"
    });

  } catch (error) {
    const resolvedParams = await params;
    logger.error("Error deleting agent", { error, agentId: resolvedParams.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 