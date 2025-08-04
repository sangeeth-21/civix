import { NextRequest } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import { createApiResponse, requireAuth, handleApiError } from "@/lib/api-utils";

// Schema for query parameters
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  category: z.string().optional(),
  agentId: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  sort: z.string().optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// GET handler for listing services
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Parse query params for pagination/filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("query");
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};
    if (category && category !== "all") query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch services and count
    const [services, totalCount] = await Promise.all([
      Service.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Service.countDocuments(query),
    ]);

    return createApiResponse(true, {
      data: services,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST handler for creating a new service
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { session, error } = await requireAuth(request, ["AGENT", "ADMIN", "SUPER_ADMIN"]);
    if (error) return error;
    
    // Parse request body
    const body = await request.json();
    
    // Create schema for service creation
    const ServiceCreateSchema = z.object({
      title: z.string().min(3).max(100),
      description: z.string().min(10),
      price: z.number().positive(),
      category: z.string().min(2),
      isActive: z.boolean().optional().default(true),
    });
    
    // Validate service data
    const serviceData = ServiceCreateSchema.parse(body);
    
    // Connect to database
    await connectDB();
    
    // Add agent ID from session
    const newServiceData = {
      ...serviceData,
      agentId: session!.user.id,
    };
    
    // Create new service
    const newService = await Service.create(newServiceData);
    
    // Return created service
    const createdService = await Service.findById(newService._id)
      .populate("agentId", "name email");
    
    return createApiResponse(
      true,
      createdService,
      undefined,
      201
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(
        false,
        undefined,
        "Invalid service data",
        400
      );
    }
    
    return handleApiError(error);
  }
} 