"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, PageTransition } from "@/components/page-transition";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, AlertCircle, Search, CalendarPlus, MessageSquare, User, Settings, Package, XCircle } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBookingsDashboard } from "@/hooks/useBookingsDashboard";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";

// Local formatCurrency function instead of importing
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Loading component
function DashboardSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto space-y-8 p-6 md:p-8">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse"></div>

      {/* Quick Actions */}
      <div className="h-20 rounded-xl border bg-card shadow-sm p-6 animate-pulse"></div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card shadow-sm p-6 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted mb-4"></div>
            <div className="h-7 w-24 rounded-md bg-muted mb-2"></div>
            <div className="h-5 w-16 rounded-md bg-muted"></div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6">
          <div className="h-7 w-48 rounded-md bg-muted mb-4"></div>
        </div>
        <div className="p-6">
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
function DashboardError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="container max-w-6xl mx-auto p-6 md:p-8">
      <Alert variant="destructive" className="rounded-xl shadow-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading dashboard</AlertTitle>
        <AlertDescription>
          {error.message || "We encountered a problem loading your data. Please try again."}
        </AlertDescription>
      </Alert>
      <div className="mt-6">
        <Button onClick={retry}>Retry</Button>
      </div>
    </div>
  );
}

// Quick Actions component
function QuickActions() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-5 px-4 flex flex-col items-center gap-3 rounded-xl hover:bg-muted/50 transition-colors" asChild>
            <Link href="/services">
              <Search className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Find Services</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-5 px-4 flex flex-col items-center gap-3 rounded-xl hover:bg-muted/50 transition-colors" asChild>
            <Link href="/user/bookings">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">My Bookings</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-5 px-4 flex flex-col items-center gap-3 rounded-xl hover:bg-muted/50 transition-colors" asChild>
            <Link href="/user/profile">
              <User className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Profile</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-5 px-4 flex flex-col items-center gap-3 rounded-xl hover:bg-muted/50 transition-colors" asChild>
            <Link href="/user/settings">
              <Settings className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Status badge component for bookings
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 rounded-full px-3">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3">
          <Calendar className="mr-1 h-3 w-3" />
          Confirmed
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 rounded-full px-3">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 rounded-full px-3">
          <XCircle className="mr-1 h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="rounded-full px-3">
          {status}
        </Badge>
      );
  }
}

// BookingCard component
function BookingCard({ booking }: { booking: any }) {
  const scheduledDate = new Date(booking.scheduledDate);
  const formattedDate = scheduledDate.toLocaleDateString();
  const formattedTime = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="border-b py-5 last:border-0 last:pb-0 first:pt-0">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-base">{booking.service?.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {formattedDate} at {formattedTime}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      {booking.notes && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
          Notes: {booking.notes}
        </p>
      )}
      <div className="mt-3">
        <Button size="sm" variant="outline" className="rounded-full" asChild>
          <Link href={`/user/bookings/${booking._id}`}>View Details</Link>
        </Button>
      </div>
    </div>
  );
}

// Dashboard content component with real-time updates
function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const { data: session } = useSession();

  // Fetch dashboard data with real-time polling
  const {
    bookingsByStatus,
    stats,
    error,
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useBookingsDashboard({
    limit: 5,
    enabled: !!session,
    pollingInterval: 10000, // Poll every 10 seconds
    onStatusChange: (prevStats, newStats) => {
      // Notify user of any status changes
      if (newStats.completed > prevStats.completed) {
        toast({
          title: "Booking Completed",
          description: `A booking has been marked as completed.`,
        });
      }
      if (newStats.confirmed > prevStats.confirmed) {
        toast({
          title: "Booking Confirmed",
          description: `A booking has been confirmed.`,
        });
      }
      if (newStats.cancelled > prevStats.cancelled) {
        toast({
          title: "Booking Cancelled",
          description: `A booking has been cancelled.`,
        });
      }
    }
  });

  // Handle error state
  if (isError && error) {
    return <DashboardError error={error} retry={refetch} />;
  }

  // Check if user has any bookings
  const hasBookings = stats?.total > 0;

  return (
    <>
      {/* Quick Actions */}
      <FadeIn delay={0.1}>
        <QuickActions />
      </FadeIn>

      {/* Stats Grid */}
      <FadeIn delay={0.2}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">{stats?.confirmed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Bookings by Status */}
        <FadeIn delay={0.3}>
          <Card className="h-full rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <Calendar className="mr-2 h-5 w-5" />
                My Bookings
              </CardTitle>
              <CardDescription>View your bookings by status</CardDescription>
            </CardHeader>

            <div>
              <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                <div className="px-6 py-3">
                  <TabsList className="grid w-full grid-cols-4 rounded-lg gap-1 md:gap-2">
                    <TabsTrigger value="pending" className="text-xs md:text-sm rounded-l-lg px-1 md:px-3 py-1.5 flex items-center justify-center">
                      <span className="hidden sm:inline-flex sm:mr-1">Pending</span>
                      <span className="sm:inline-flex">({stats?.pending || 0})</span>
                    </TabsTrigger>
                    <TabsTrigger value="confirmed" className="text-xs md:text-sm px-1 md:px-3 py-1.5 flex items-center justify-center">
                      <span className="hidden sm:inline-flex sm:mr-1">Confirmed</span>
                      <span className="sm:inline-flex">({stats?.confirmed || 0})</span>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs md:text-sm px-1 md:px-3 py-1.5 flex items-center justify-center">
                      <span className="hidden sm:inline-flex sm:mr-1">Completed</span>
                      <span className="sm:inline-flex">({stats?.completed || 0})</span>
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="text-xs md:text-sm rounded-r-lg px-1 md:px-3 py-1.5 flex items-center justify-center">
                      <span className="hidden sm:inline-flex sm:mr-1">Cancelled</span>
                      <span className="sm:inline-flex">({stats?.cancelled || 0})</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CardContent className="p-6">
                  {!hasBookings ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">You have no bookings yet</p>
                      <Button asChild className="rounded-full">
                        <Link href="/services">Browse Services</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <TabsContent value="pending" className="m-0">
                        <div className="space-y-0">
                          {bookingsByStatus?.PENDING && bookingsByStatus.PENDING.length > 0 ? (
                            bookingsByStatus.PENDING.map(booking => (
                              <BookingCard key={booking._id} booking={booking} />
                            ))
                          ) : (
                            <p className="py-8 text-center text-muted-foreground">No pending bookings</p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="confirmed" className="m-0">
                        <div className="space-y-0">
                          {bookingsByStatus?.CONFIRMED && bookingsByStatus.CONFIRMED.length > 0 ? (
                            bookingsByStatus.CONFIRMED.map(booking => (
                              <BookingCard key={booking._id} booking={booking} />
                            ))
                          ) : (
                            <p className="py-8 text-center text-muted-foreground">No confirmed bookings</p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="completed" className="m-0">
                        <div className="space-y-0">
                          {bookingsByStatus?.COMPLETED && bookingsByStatus.COMPLETED.length > 0 ? (
                            bookingsByStatus.COMPLETED.map(booking => (
                              <BookingCard key={booking._id} booking={booking} />
                            ))
                          ) : (
                            <p className="py-8 text-center text-muted-foreground">No completed bookings</p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="cancelled" className="m-0">
                        <div className="space-y-0">
                          {bookingsByStatus?.CANCELLED && bookingsByStatus.CANCELLED.length > 0 ? (
                            bookingsByStatus.CANCELLED.map(booking => (
                              <BookingCard key={booking._id} booking={booking} />
                            ))
                          ) : (
                            <p className="py-8 text-center text-muted-foreground">No cancelled bookings</p>
                          )}
                        </div>
                      </TabsContent>
                    </>
                  )}
                </CardContent>
              </Tabs>
            </div>

            <CardFooter className="border-t pt-4 pb-4">
              <Button variant="outline" size="sm" className="w-full rounded-full" asChild>
                <Link href="/user/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  View All Bookings
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </FadeIn>

        {/* Booking Summary */}
        <FadeIn delay={0.4}>
          <Card className="h-full rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <CalendarPlus className="mr-2 h-5 w-5" />
                Booking Summary
              </CardTitle>
              <CardDescription>Overview of your booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasBookings ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No booking data available</p>
                  <Button asChild className="rounded-full">
                    <Link href="/services">Book Your First Service</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Financial Summary */}
                  <div className="bg-muted/30 rounded-xl p-5">
                    <h3 className="text-sm font-medium mb-4">Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="text-muted-foreground text-sm">Total Spent:</div>
                      <div className="text-sm font-medium text-right">{formatCurrency(stats?.totalAmount || 0)}</div>

                      <div className="text-muted-foreground text-sm">Active Bookings Value:</div>
                      <div className="text-sm font-medium text-right">
                        {formatCurrency(
                          (bookingsByStatus?.PENDING?.reduce((sum, booking) => sum + (booking.totalAmount || booking.amount || 0), 0) || 0) +
                          (bookingsByStatus?.CONFIRMED?.reduce((sum, booking) => sum + (booking.totalAmount || booking.amount || 0), 0) || 0)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Stats */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-medium">Booking Progress</h3>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Completed</span>
                        <span>{Math.round((stats?.completed || 0) / (stats?.total || 1) * 100)}%</span>
                      </div>
                      <div className="bg-muted h-2 w-full rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.round((stats?.completed || 0) / (stats?.total || 1) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Cancelled</span>
                        <span>{Math.round((stats?.cancelled || 0) / (stats?.total || 1) * 100)}%</span>
                      </div>
                      <div className="bg-muted h-2 w-full rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${Math.round((stats?.cancelled || 0) / (stats?.total || 1) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Active (Pending/Confirmed)</span>
                        <span>{Math.round(((stats?.pending || 0) + (stats?.confirmed || 0)) / (stats?.total || 1) * 100)}%</span>
                      </div>
                      <div className="bg-muted h-2 w-full rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.round(((stats?.pending || 0) + (stats?.confirmed || 0)) / (stats?.total || 1) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 pb-4">
              <Button variant="outline" size="sm" className="w-full rounded-full" asChild>
                <Link href="/services">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Services
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </FadeIn>
      </div>
    </>
  );
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/user/dashboard');
    }
  }, [status, router]);

  // Check role access
  useEffect(() => {
    if (session && session.user?.role !== 'USER') {
      router.push('/');
    }
  }, [session, router]);

  // Show loading until session is checked
  if (status === 'loading' || !session) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-6xl mx-auto space-y-8 p-6 md:p-8">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {session.user?.name}</h1>
              <p className="text-muted-foreground mt-1">Manage your bookings and services</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link href="/user/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button size="sm" className="rounded-full" asChild>
                <Link href="/services">
                  <Package className="mr-2 h-4 w-4" />
                  Browse Services
                </Link>
              </Button>
            </div>
          </div>
          <Separator className="my-6" />
        </FadeIn>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </PageTransition>
  );
} 
