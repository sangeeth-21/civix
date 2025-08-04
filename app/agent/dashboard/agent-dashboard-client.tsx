"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Users, Clock, Wallet, BarChart, TrendingUp, CalendarClock, CheckCircle, XCircle, Calendar, PlusCircle, Settings, MessageSquare, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast, useToast } from "@/components/ui/use-toast";

// Define types for our data
interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface Booking {
  _id: string;
  status: string;
  scheduledDate: string;
  serviceId: Service;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string; // Added phone number to the type
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentDashboardClientProps {
  agentId: string;
  userName: string;
}

// Loading component
function DashboardSkeleton() {
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse"></div>

      {/* Quick Actions */}
      <div className="h-20 rounded-lg border bg-card p-6 animate-pulse"></div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted mb-4"></div>
            <div className="h-7 w-24 rounded-md bg-muted mb-2"></div>
            <div className="h-5 w-16 rounded-md bg-muted"></div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="rounded-lg border bg-card p-6 animate-pulse">
        <div className="h-7 w-48 rounded-md bg-muted mb-4"></div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded-md bg-muted"></div>
              <div className="h-8 w-16 rounded-md bg-muted"></div>
              <div className="h-3 w-32 rounded-md bg-muted"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border bg-card p-6 animate-pulse">
        <div className="h-7 w-48 rounded-md bg-muted mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-b py-4 animate-pulse last:border-0">
              <div className="flex flex-col gap-3">
                <div className="h-5 w-3/4 rounded-md bg-muted"></div>
                <div className="h-4 w-1/2 rounded-md bg-muted"></div>
                <div className="h-4 w-1/4 rounded-md bg-muted"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error component
function DashboardError({ error }: { error: Error }) {
  return (
    <div className="container p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Dashboard</CardTitle>
          <CardDescription>We encountered a problem loading your data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{error.message || "Please try again later"}</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick Actions component
function QuickActions() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4 justify-between">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/agent/services/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Service
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/agent/bookings">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Bookings
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/agent/support">
                <MessageSquare className="mr-2 h-4 w-4" />
                Support
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/agent/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CalendarClock className="mr-1 h-3 w-3" />
          Confirmed
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
}

// Dashboard stats component
function DashboardStats({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch agent dashboard data
        const res = await fetch(`/api/agents/dashboard?agentId=${agentId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch agent dashboard data');
        }
        const data = await res.json();

        // Extract bookings and services
        const bookingsList = data.data?.bookings || [];
        const servicesList = data.data?.services || [];

        setBookings(bookingsList);
        setServices(servicesList);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [agentId]);

  const handleConfirmBooking = async (bookingId: string) => {
    setConfirmingBookingId(bookingId);
    try {
      const res = await fetch(`/api/agents/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" })
      });
      if (!res.ok) throw new Error("Failed to confirm booking");

      // Show toast notification
      toast({
        title: "Booking confirmed!",
        description: "Email notifications have been sent to you and the client."
      });

      // Update local state to reflect the status change
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking._id === bookingId
            ? { ...booking, status: "CONFIRMED" }
            : booking
        )
      );
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error confirming booking",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setConfirmingBookingId(null);
    }
  };


  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} />;
  }

  // Calculate stats - ensure arrays exist
  const totalServices = Array.isArray(services) ? services.length : 0;
  const activeServices = Array.isArray(services) ? services.filter(s => s.isActive).length : 0;

  const totalBookings = Array.isArray(bookings) ? bookings.length : 0;
  const pendingBookings = Array.isArray(bookings) ? bookings.filter(b => b.status === "PENDING").length : 0;
  const confirmedBookings = Array.isArray(bookings) ? bookings.filter(b => b.status === "CONFIRMED").length : 0;
  const completedBookings = Array.isArray(bookings) ? bookings.filter(b => b.status === "COMPLETED").length : 0;

  // Calculate estimated earnings (from completed bookings)
  const earnings = Array.isArray(bookings) ? bookings
    .filter(b => b.status === "COMPLETED")
    .reduce((sum, booking) => sum + (booking.serviceId.price || 0), 0) : 0;

  // Get upcoming bookings (sorted by date)
  const upcomingBookings = Array.isArray(bookings) ? bookings
    .filter(b => b.status === "PENDING" || b.status === "CONFIRMED")
    .sort((a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    )
    .slice(0, 5) : [];

  // Get recent services
  const recentServices = Array.isArray(services) ? services
    .sort((a, b) =>
      new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
    )
    .slice(0, 3) : [];

  // Calculate performance metrics
  const completionRate = totalBookings > 0
    ? Math.round((completedBookings / totalBookings) * 100)
    : 0;

  const todaysBookings = Array.isArray(bookings) ? bookings.filter(b => {
    const bookingDate = new Date(b.scheduledDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  }).length : 0;

  return (
    <>
      {/* Quick Actions */}
      <FadeIn delay={0.1}>
        <QuickActions />
      </FadeIn>

      {/* Stats Grid */}
      <FadeIn delay={0.2}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Services</p>
                  <p className="text-2xl font-bold">{activeServices} <span className="text-sm text-muted-foreground font-normal">/ {totalServices}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <Clock className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <Wallet className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Earnings</p>
                  <p className="text-2xl font-bold">${earnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Performance Metrics */}
      <FadeIn delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Key indicators of your business performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{completionRate}%</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {completedBookings} of {totalBookings} bookings completed
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Today&apos;s Bookings</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{todaysBookings}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Scheduled for today
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Service Utilization</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {totalServices > 0 ? Math.round(totalBookings / totalServices) : 0}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Average bookings per service
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Tabs for Services and Bookings */}
      <FadeIn delay={0.4}>
        <Tabs defaultValue="bookings" className="mt-8">
          <TabsList>
            <TabsTrigger value="bookings">Upcoming Bookings</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarClock className="mr-2 h-5 w-5" />
                  Upcoming Bookings
                </CardTitle>
                <CardDescription>Manage your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground">You have no upcoming bookings</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {upcomingBookings.map((booking) => (
                      <div key={booking._id} className="border-b pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{booking.serviceId.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.scheduledDate).toLocaleDateString()} at{" "}
                              {new Date(booking.scheduledDate).toLocaleTimeString()}
                            </p>
                          </div>
                          <StatusBadge status={booking.status} />
                        </div>

                        <div className="mt-2">
                          <p className="text-sm font-medium">Client:</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.userId.name} ({booking.userId.email})
                          </p>
                          {/* Add phone number if available */}
                          {booking.userId.phone && (
                            <p className="text-sm text-muted-foreground">
                              📞 {booking.userId.phone}
                            </p>
                          )}
                        </div>

                        {booking.notes && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Notes:</p>
                            <p className="text-sm text-muted-foreground">{booking.notes}</p>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <Button size="sm" asChild>
                            <Link href={`/agent/bookings/${booking._id}`}>View Details</Link>
                          </Button>
                          {booking.status === "PENDING" && (
                            <Button variant="outline" size="sm" onClick={() => handleConfirmBooking(booking._id)} disabled={confirmingBookingId === booking._id}>
                              {confirmingBookingId === booking._id ? "Confirming..." : "Confirm"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/agent/bookings">View All Bookings</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  My Services
                </CardTitle>
                <CardDescription>Services you offer to clients</CardDescription>
              </CardHeader>
              <CardContent>
                {recentServices.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground">You haven&apos;t created any services yet</p>
                    <Button className="mt-4" asChild>
                      <Link href="/agent/services/create">Create Service</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {recentServices.map((service) => (
                      <div key={service._id} className="border-b pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{service.title}</h3>
                          <Badge variant={service.isActive ? "success" : "destructive"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{service.category}</p>
                        <p className="text-sm font-medium">${service.price.toFixed(2)}</p>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/agent/services/${service._id}`}>Edit</Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/services/${service._id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/agent/services">View All Services</Link>
                </Button>
                <Button asChild>
                  <Link href="/agent/services/create">Create Service</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </>
  );
}

export function AgentDashboardClient({ agentId, userName }: AgentDashboardClientProps) {
  return (
    <PageTransition>
      <div className="container space-y-6 p-6 md:p-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-2">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {userName}</h1>
              <p className="text-muted-foreground">Manage your services and bookings</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/agent/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/agent/services/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Service
                </Link>
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
        </FadeIn>

        <DashboardStats agentId={agentId} />
      </div>
    </PageTransition>
  );
} 