import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Star, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";

// Define types for our data
interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  skills?: string[];
  experience?: number;
  rating?: number;
  bio?: string;
  specializations?: string[];
  createdAt: string;
}

// Interface for booking data
interface Booking {
  _id: string;
  agentId: string;
  serviceId: {
    title: string;
  };
  scheduledDate: string;
  status: string;
}

// Page metadata
export const metadata = {
  title: "My Agents - Civix",
  description: "View information about your assigned service agents",
};

// Loading component
function AgentSkeleton() {
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse mb-6"></div>
      
      <div className="rounded-lg border bg-card animate-pulse">
        <div className="p-6 flex flex-col md:flex-row gap-6">
          <div className="h-24 w-24 rounded-full bg-muted"></div>
          <div className="flex-1 space-y-4">
            <div className="h-7 w-1/3 rounded-md bg-muted"></div>
            <div className="h-5 w-1/4 rounded-md bg-muted"></div>
            <div className="h-4 w-1/2 rounded-md bg-muted"></div>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card animate-pulse">
        <div className="p-6">
          <div className="h-7 w-1/3 rounded-md bg-muted mb-4"></div>
          <div className="h-4 w-full rounded-md bg-muted mb-2"></div>
          <div className="h-4 w-3/4 rounded-md bg-muted"></div>
        </div>
      </div>
    </div>
  );
}

// Error component
function AgentsError({ error }: { error: Error }) {
  return (
    <div className="container p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Agents</CardTitle>
          <CardDescription>We encountered a problem loading your agent information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{error.message || "Please try again later"}</p>
          <Button asChild>
            <Link href="/user/agents">Refresh</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={`star-${i}`} 
          className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
        />
      ))}
      <span className="ml-2 text-sm">{rating.toFixed(1)}</span>
    </div>
  );
}

// Agent details component
async function AgentDetails({ userId }: { userId: string }) {
  try {
    // Get cookies for authentication
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    
    // Use absolute URL with origin to avoid URL parsing errors
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Fetch user bookings to find agent IDs
    const bookingsResponse = await fetch(
      `${baseUrl}/api/bookings`,
      { 
        headers: { 
          cookie: cookieString,
          'Content-Type': 'application/json'
        },
        cache: "no-store" 
      }
    );
    
    if (!bookingsResponse.ok) {
      throw new Error(`Failed to fetch bookings: ${bookingsResponse.statusText}`);
    }
    
    const bookingsData = await bookingsResponse.json();
    // Fix: Extract bookings array from paginated response
    const bookings: Booking[] = (bookingsData.data && Array.isArray(bookingsData.data.data)) ? bookingsData.data.data : [];
    
    // Extract unique agent IDs from bookings
    const agentIds = [...new Set(bookings.map((booking: Booking) => booking.agentId))];
    
    if (agentIds.length === 0) {
      return (
        <div className="container p-6 md:p-10">
          <FadeIn>
            <h1 className="text-3xl font-bold mb-6">My Agents</h1>
            
            <Card className="text-center p-8">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2">No Agents Found</h2>
                <p className="text-muted-foreground mb-6">
                  You don&apos;t have any assigned agents yet. Book a service to get matched with an agent.
                </p>
                <Button asChild>
                  <Link href="/services">Browse Services</Link>
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      );
    }
    
    // For each agent ID, fetch the agent details
    const agents: Agent[] = [];
    
    for (const agentId of agentIds) {
      try {
        const agentResponse = await fetch(
          `${baseUrl}/api/users/${agentId}`,
          { 
            headers: { 
              cookie: cookieString,
              'Content-Type': 'application/json'
            },
            cache: "no-store" 
          }
        );
        
        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          if (agentData.success && agentData.data) {
            agents.push(agentData.data);
          }
        }
      } catch (err) {
        // Silently handle agent fetch errors
      }
    }
    
    return (
      <div className="container p-6 md:p-10">
        <FadeIn>
          <h1 className="text-3xl font-bold mb-6">My Agents</h1>
          
          <div className="space-y-8">
            {agents.map((agent) => (
              <div key={`agent-${agent._id}`} className="space-y-6">
                {/* Agent Profile Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl">
                          {agent.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-3 flex-1">
                        <div>
                          <h2 className="text-2xl font-semibold">{agent.name}</h2>
                          <p className="text-muted-foreground">Service Agent</p>
                        </div>
                        
                        {agent.rating && (
                          <StarRating rating={agent.rating} />
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {agent.specializations?.map((spec, i) => (
                            <Badge key={`spec-${agent._id}-${spec}-${i}`} variant="outline">{spec}</Badge>
                          ))}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-primary" />
                            <span>{agent.email}</span>
                          </div>
                          
                          {agent.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <span>{agent.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            <span>
                              {agent.experience 
                                ? `${agent.experience} years of experience` 
                                : "Experience information unavailable"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Agent Bio and Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {agent.name.split(" ")[0]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {agent.bio ? (
                      <p>{agent.bio}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No biography available for this agent.
                      </p>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <Heading level="h3" className="mb-4">Skills & Expertise</Heading>
                      <div className="flex flex-wrap gap-2">
                        {agent.skills && agent.skills.length > 0 ? (
                          agent.skills.map((skill, i) => (
                            <Badge key={`skill-${agent._id}-${skill}-${i}`} variant="secondary">{skill}</Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground italic">No specific skills listed.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Agent's Recent Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Bookings with {agent.name.split(" ")[0]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bookings
                        .filter((booking: Booking) => booking.agentId === agent._id)
                        .slice(0, 3)
                        .map((booking: Booking, i: number) => (
                          <div key={`booking-${booking._id}-${i}`} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{booking.serviceId.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(booking.scheduledDate).toLocaleDateString()} at {" "}
                                  {new Date(booking.scheduledDate).toLocaleTimeString()}
                                </p>
                              </div>
                              <Badge variant={getStatusVariant(booking.status)}>
                                {booking.status.toLowerCase()}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    <Button variant="outline" asChild className="w-full mt-4">
                      <Link href="/user/bookings">View All Bookings</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    );
  } catch (error) {
    return <AgentsError error={error instanceof Error ? error : new Error('Failed to load agent information')} />;
  }
}

// Helper function to get badge variant based on booking status
function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING": return "warning";
    case "CONFIRMED": return "outline";
    case "COMPLETED": return "success";
    case "CANCELLED": return "destructive";
    default: return "secondary";
  }
}

export default async function UserAgents() {
  // Get current user session
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) {
    redirect('/login?callbackUrl=/user/agents');
  }
  
  return (
    <PageTransition>
      <Suspense fallback={<AgentSkeleton />}>
        <AgentDetails userId={userId} />
      </Suspense>
    </PageTransition>
  );
} 
