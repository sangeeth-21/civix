import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import bcrypt from "bcryptjs";

const logger = createNamespaceLogger("api:super-admin:users");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to super admin users", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Build query
    const query: Record<string, unknown> = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }
    
    // Add role filter
    if (role) {
      query.role = role;
    }
    
    // Add status filter
    if (status) {
      query.isActive = status === "active";
    }
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_USERS",
      entityType: "USER",
      details: {
        page,
        limit,
        search,
        role,
        status,
        totalCount
      }
    });
    
    logger.info("Super admin viewed users list", {
      userId: session.user.id,
      page,
      limit,
      totalCount
    });
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    logger.error("Error fetching users", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to create user", {
        userId: session?.user?.id || "unauthenticated",
        userRole: session?.user?.role || "none",
      });
      
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Get request body
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      role,
      isActive = true,
      profile = {},
      preferences = {}
    } = body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, role" },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    
    // Validate role
    const validRoles = ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: USER, AGENT, ADMIN, SUPER_ADMIN" },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    
    // Create user (password will be hashed by the User model pre-save hook)
    const user = await User.create({
      name,
      email,
      phone,
      password: password,
      role,
      isActive,
      profile: {
        bio: profile.bio || "",
        avatar: profile.avatar || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        zipCode: profile.zipCode || "",
        country: profile.country || "",
        dateOfBirth: profile.dateOfBirth || "",
        company: profile.company || "",
        position: profile.position || "",
        skills: profile.skills || [],
        experience: profile.experience || "",
        certifications: profile.certifications || []
      },
      preferences: {
        emailNotifications: preferences.emailNotifications !== false,
        smsNotifications: preferences.smsNotifications || false,
        marketingEmails: preferences.marketingEmails || false,
        language: preferences.language || "en",
        timezone: preferences.timezone || "UTC"
      }
    });
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "CREATE_USER",
      entityType: "USER",
      entityId: user._id,
      details: {
        name,
        email,
        role,
        isActive
      }
    });
    
    logger.info("Super admin created user", {
      userId: session.user.id,
      newUserId: user._id,
      name,
      email,
      role
    });
    
    // Return user without password
    const userResponse = user.toObject() as unknown as Record<string, unknown>;
    delete userResponse.password;
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: "User created successfully"
    });
    
  } catch (error) {
    logger.error("Error creating user", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 