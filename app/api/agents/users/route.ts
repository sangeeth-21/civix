import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  await connectDB();
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENT") {
    return apiError("Unauthorized", 401);
  }
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search")?.trim() || "";
  const bookingStatus = searchParams.get("bookingStatus") || "";

  // Find all unique userIds who have bookings with this agent (optionally filtered by status)
  const bookingQuery: any = { agentId: session.user.id };
  if (bookingStatus) bookingQuery.status = bookingStatus;
  const bookings = await Booking.find(bookingQuery).select("userId").lean();
  let userIds = [...new Set(bookings.map((b: any) => b.userId?.toString()).filter(Boolean))];

  // Search filter
  if (search) {
    const users = await User.find({
      _id: { $in: userIds },
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id name email phone").lean();
    userIds = users.map(u => u._id.toString());
  }

  // Pagination
  const total = userIds.length;
  const pagedUserIds = userIds.slice((page - 1) * limit, page * limit);
  const users = await User.find({ _id: { $in: pagedUserIds } }).select("_id name email phone").lean();

  return NextResponse.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
} 