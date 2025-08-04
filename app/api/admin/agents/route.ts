import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createNamespaceLogger } from "@/lib/logger";

const logger = createNamespaceLogger("api:admin:agents");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");
    const experience = searchParams.get("experience");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { role: "agent" };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
        { specializations: { $in: [new RegExp(search, "i")] } }
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (experience && experience !== "all") {
      query.experience = parseInt(experience);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const agents = await User.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    // Get additional stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const servicesCount = await User.aggregate([
          { $match: { _id: agent._id } },
          { $lookup: { from: "services", localField: "_id", foreignField: "agentId", as: "services" } },
          { $project: { servicesCount: { $size: "$services" } } }
        ]);

        const bookingsCount = await User.aggregate([
          { $match: { _id: agent._id } },
          { $lookup: { from: "bookings", localField: "_id", foreignField: "agentId", as: "bookings" } },
          { $project: { bookingsCount: { $size: "$bookings" } } }
        ]);

        const totalRevenue = await User.aggregate([
          { $match: { _id: agent._id } },
          { $lookup: { from: "bookings", localField: "_id", foreignField: "agentId", as: "bookings" } },
          { $unwind: "$bookings" },
          { $group: { _id: null, totalRevenue: { $sum: "$bookings.amount" } } }
        ]);

        return {
          ...agent,
          servicesCount: servicesCount[0]?.servicesCount || 0,
          bookingsCount: bookingsCount[0]?.bookingsCount || 0,
          totalRevenue: totalRevenue[0]?.totalRevenue || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: agentsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error("Error fetching agents", {
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
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, email, phone, skills, experience, bio, specializations } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new agent
    const agent = new User({
      name,
      email,
      phone,
      role: "agent",
      isActive: true,
      skills: skills || [],
      experience: experience || 0,
      bio: bio || "",
      specializations: specializations || [],
      password: "tempPassword123" // This should be changed on first login
    });

    await agent.save();

    const agentResponse = agent.toObject();
    if ('password' in agentResponse) {
      delete (agentResponse as any).password;
    }

    return NextResponse.json({
      success: true,
      data: agentResponse
    }, { status: 201 });

  } catch (error) {
    logger.error("Error creating agent", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 