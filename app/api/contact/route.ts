import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiResponse, handleApiError } from "@/lib/api-utils";

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);
    
    // In a real application, you would:
    // 1. Store the message in the database
    // 2. Send an email notification
    // 3. Create a support ticket
    
    // For now, we'll just return success
    
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return createApiResponse(
      true,
      { received: true },
      undefined,
      200
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return createApiResponse(
        false,
        undefined,
        "Invalid form data",
        400
      );
    }
    
    // Handle other errors
    return handleApiError(error);
  }
} 