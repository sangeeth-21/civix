import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:admins");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to super admin admins", {
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
    const query: Record<string, unknown> = {
      role: { $in: ["ADMIN", "SUPER_ADMIN"] }
    };
    
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
    const [admins, totalCount] = await Promise.all([
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
      action: "VIEW_ADMINS",
      entityType: "ADMIN",
      details: {
        page,
        limit,
        search,
        role,
        status,
        totalCount
      }
    });
    
    logger.info("Super admin viewed admins list", {
      userId: session.user.id,
      page,
      limit,
      totalCount
    });
    
    return NextResponse.json({
      success: true,
      data: admins,
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
    logger.error("Error fetching admins", { error });
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
      logger.warn("Unauthorized access attempt to create admin", {
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
    const { name, email, phone, role, password } = body;
    
    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    
    // Create admin user (password will be hashed by the User model pre-save hook)
    const admin = await User.create({
      name,
      email,
      phone,
      role,
      password: password,
      isActive: true
    });
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "CREATE_ADMIN",
      entityType: "ADMIN",
      entityId: admin._id,
      details: {
        adminName: name,
        adminEmail: email,
        role
      }
    });
    
    logger.info("Super admin created new admin", {
      userId: session.user.id,
      adminId: admin._id,
      adminEmail: email,
      role
    });
    
    // Return admin data without password
    const adminData = admin.toObject();
    const { password: _, ...adminDataWithoutPassword } = adminData;
    
    return NextResponse.json({
      success: true,
      data: adminDataWithoutPassword
    });
    
  } catch (error) {
    logger.error("Error creating admin", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 