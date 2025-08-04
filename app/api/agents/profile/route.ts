import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createNamespaceLogger } from '@/lib/logger';

const logger = createNamespaceLogger("api:agent:profile");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "AGENT") {
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

    // Get agent statistics
    const stats = {
      totalBookings: 0,
      completedBookings: 0,
      averageRating: 0,
      totalEarnings: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats
      }
    });

  } catch (error) {
    logger.error("Error fetching agent profile", {
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
    
    if (!session?.user || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, email, phone, address, bio, skills, specializations, experience, certifications } = body;

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
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (experience !== undefined) updateData.experience = experience;
    if (certifications !== undefined) updateData.certifications = certifications;

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

    logger.info("Agent profile updated", {
      userId: session.user.id,
      updatedFields: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "Profile updated successfully"
    });

  } catch (error) {
    logger.error("Error updating agent profile", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 