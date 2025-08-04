import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNamespaceLogger } from "@/lib/logger";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";

const logger = createNamespaceLogger("api:super-admin:email-logs");

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // Verify user is authenticated and has super admin role
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      logger.warn("Unauthorized access attempt to super admin email logs", {
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
    const status = searchParams.get("status") || "";
    const template = searchParams.get("template") || "";
    const dateFilter = searchParams.get("dateFilter") || "";
    const sortBy = searchParams.get("sortBy") || "sentAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Build query
    const query: Record<string, unknown> = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { to: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { template: { $regex: search, $options: "i" } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add template filter
    if (template) {
      query.template = template;
    }
    
    // Add date filter
    if (dateFilter) {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "yesterday":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query.sentAt = { $gte: startDate };
    }
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Note: Email logs would require an EmailLog model to be implemented
    // For now, return empty array since we don't have email logging implemented
    const emailLogs: any[] = [];
    
    // Filter email logs based on query (no filtering needed for empty array)
    let filteredLogs = emailLogs;
    
    // Apply pagination
    const totalCount = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(skip, skip + limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Log the action
    await AuditLog?.create({
      userId: session.user.id,
      action: "VIEW_EMAIL_LOGS",
      entityType: "EMAIL_LOG",
      details: {
        page,
        limit,
        search,
        status,
        template,
        totalCount
      }
    });
    
    logger.info("Super admin viewed email logs", {
      userId: session.user.id,
      page,
      limit,
      totalCount
    });
    
    return NextResponse.json({
      success: true,
      data: paginatedLogs,
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
    logger.error("Error fetching email logs", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 