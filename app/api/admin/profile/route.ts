import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { createNamespaceLogger } from "@/lib/logger";
import User from "@/models/User";

const logger = createNamespaceLogger("api:admin:profile");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error("Error fetching admin profile", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, email, phone, bio } = body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: session.user.id } 
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "Profile updated successfully"
    });

  } catch (error) {
    logger.error("Error updating admin profile", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 