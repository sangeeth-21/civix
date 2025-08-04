import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Set runtime to nodejs for MongoDB compatibility
export const runtime = "nodejs";

// Add dynamic config for production and local environments
export const dynamic = "force-dynamic"; // Don't cache auth responses 