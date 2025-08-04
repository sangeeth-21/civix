import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AgentDashboardClient } from "./agent-dashboard-client";

export default async function AgentDashboard() {
  // Get current user session
  const session = await auth();
  const agentId = session?.user?.id;
  
  if (!agentId || session?.user?.role !== "AGENT") {
    redirect('/login?callbackUrl=/agent/dashboard');
  }
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AgentDashboardClient 
        agentId={agentId}
        userName={session.user?.name || 'Agent'}
      />
    </Suspense>
  );
} 
