"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CheckCircle, Clock, XCircle, Calendar, Filter, Search, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Define types for our data
interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

interface Booking {
  _id: string;
  status: string;
  scheduledDate: string;
  serviceId: Service;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Loading component
function BookingsSkeleton() {
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse mb-6"></div>

      <div className="h-10 w-72 rounded-md bg-muted animate-pulse mb-8"></div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card animate-pulse">
            <div className="p-6">
              <div className="h-7 w-1/3 rounded-md bg-muted mb-2"></div>
              <div className="h-5 w-1/4 rounded-md bg-muted mb-4"></div>
              <div className="h-4 w-1/2 rounded-md bg-muted"></div>
            </div>
            <div className="p-6 border-t">
              <div className="flex justify-between">
                <div className="h-9 w-24 rounded-md bg-muted"></div>
                <div className="h-9 w-24 rounded-md bg-muted"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error component
function BookingsError({ error }: { error: Error }) {
  return (
    <div className="container p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Bookings</CardTitle>
          <CardDescription>We encountered a problem loading your bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{error.message || "Please try again later"}</p>
          <Button asChild>
            <Link href="/user/bookings">Refresh</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
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

function BookingCard({ booking }: { booking: Booking }) {
  // Format date
  const bookingDate = new Date(booking.scheduledDate);
  const formattedDate = format(bookingDate, "PPP"); // Monday, January 1, 2023
  const formattedTime = format(bookingDate, "p"); // 12:00 PM

  // Check if date is in the past
  const isPast = bookingDate < new Date();

  // Determine card border color based on status
  let cardBorderClass = "";
  switch (booking.status) {
    case "PENDING":
      cardBorderClass = "border-l-4 border-l-amber-400";
      break;
    case "CONFIRMED":
      cardBorderClass = "border-l-4 border-l-blue-400";
      break;
    case "COMPLETED":
      cardBorderClass = "border-l-4 border-l-green-400";
      break;
    case "CANCELLED":
      cardBorderClass = "border-l-4 border-l-red-400";
      break;
  }

  return (
    <Card className={`overflow-hidden ${cardBorderClass}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{booking.serviceId?.title || "Service not found"}</CardTitle>
            <CardDescription>{booking.serviceId?.category || "Unknown category"}</CardDescription>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {formattedDate} at {formattedTime}
          </span>
          {isPast && booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
              Past Due
            </Badge>
          )}
        </div>

        {booking.notes && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p className="line-clamp-1">{booking.notes}</p>
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="pt-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/user/bookings/${booking._id}`}>
            View Details
          </Link>
        </Button>

        {booking.status === "PENDING" && !isPast && (
          <Button variant="outline" size="sm" className="ml-2" asChild>
            <Link href={`/user/bookings/edit/${booking._id}`}>
              Reschedule
            </Link>
          </Button>
        )}

        {(booking.status === "COMPLETED" || booking.status === "CANCELLED") && (
          <Button variant="outline" size="sm" className="ml-auto" asChild>
            <Link href={`/services/${booking.serviceId?._id}`}>
              Book Again
            </Link>
          </Button>
        )}

        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && !isPast && (
          <Button variant="ghost" size="sm" className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50">
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function UserBookingsList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["userBookings"],
    queryFn: async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      // Handle both possible API response shapes
      if (Array.isArray(data.data?.data)) return data.data.data as Booking[];
      if (Array.isArray(data.data)) return data.data as Booking[];
      return [];
    },
  });

  if (isLoading) return <BookingsSkeleton />;
  if (isError) return <BookingsError error={error instanceof Error ? error : new Error("Failed to load bookings")} />;

  // Explicitly type bookings as Booking[]
  const bookings: Booking[] = data ?? [];
  const pendingBookings = bookings.filter((b: Booking) => b.status === "PENDING");
  const confirmedBookings = bookings.filter((b: Booking) => b.status === "CONFIRMED");
  const completedBookings = bookings.filter((b: Booking) => b.status === "COMPLETED");
  const cancelledBookings = bookings.filter((b: Booking) => b.status === "CANCELLED");

  if (bookings.length === 0) {
    return (
      <div className="container p-6 md:p-10">
        <FadeIn>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <Button asChild>
              <Link href="/services">
                <Calendar className="mr-2 h-4 w-4" />
                Book a Service
              </Link>
            </Button>
          </div>

          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground/70" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Bookings Found</h2>
              <p className="text-muted-foreground mb-6">You haven&apos;t made any bookings yet.</p>
              <Button asChild>
                <Link href="/services">Browse Services</Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="container p-6 md:p-10">
      <FadeIn>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Button asChild>
            <Link href="/services">
              <Calendar className="mr-2 h-4 w-4" />
              Book a Service
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed ({confirmedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-3.5 w-3.5" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-3.5 w-3.5" />
                Search
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="space-y-4">
              {bookings.length > 0 ? (
                bookings.map((booking: Booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))
              ) : (
                <Card className="text-center p-6">
                  <CardContent>
                    <p className="text-muted-foreground">No bookings found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <div className="space-y-4">
              {pendingBookings.length > 0 ? (
                pendingBookings.map((booking: Booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))
              ) : (
                <Card className="text-center p-6">
                  <CardContent>
                    <p className="text-muted-foreground">No pending bookings.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="confirmed" className="mt-0">
            <div className="space-y-4">
              {confirmedBookings.length > 0 ? (
                confirmedBookings.map((booking: Booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))
              ) : (
                <Card className="text-center p-6">
                  <CardContent>
                    <p className="text-muted-foreground">No confirmed bookings.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <div className="space-y-4">
              {completedBookings.length > 0 ? (
                completedBookings.map((booking: Booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))
              ) : (
                <Card className="text-center p-6">
                  <CardContent>
                    <p className="text-muted-foreground">No completed bookings.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="mt-0">
            <div className="space-y-4">
              {cancelledBookings.length > 0 ? (
                cancelledBookings.map((booking: Booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))
              ) : (
                <Card className="text-center p-6">
                  <CardContent>
                    <p className="text-muted-foreground">No cancelled bookings.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}

export default function UserBookings() {
  return (
    <FadeIn>
      <UserBookingsList />
    </FadeIn>
  );
}
