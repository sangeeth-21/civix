import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { format } from "date-fns";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, X, ArrowLeft, CalendarX, User, Phone, Mail, MapPin, MessageSquare, Star, Award, FileText, Calendar as CalendarIcon, CalendarClock } from "lucide-react";

// Define types for our data
interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  location?: string; // Added location
}

interface Booking {
  _id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledDate: string;
  serviceId: Service;
  agentId: Agent;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for the component props
interface BookingDetailsProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    success?: string;
  }>;
}

// Loading component
function BookingSkeleton() {
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="flex items-center space-x-2 mb-6">
        <div className="h-10 w-24 rounded-md bg-muted animate-pulse"></div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-lg border bg-card animate-pulse">
            <div className="p-6">
              <div className="h-7 w-1/3 rounded-md bg-muted mb-2"></div>
              <div className="h-5 w-1/4 rounded-md bg-muted mb-4"></div>

              <div className="space-y-4 mt-6">
                <div className="h-4 w-full rounded-md bg-muted"></div>
                <div className="h-4 w-full rounded-md bg-muted"></div>
                <div className="h-4 w-2/3 rounded-md bg-muted"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="rounded-lg border bg-card animate-pulse">
            <div className="p-6">
              <div className="h-7 w-3/4 rounded-md bg-muted mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 w-full rounded-md bg-muted"></div>
                <div className="h-4 w-full rounded-md bg-muted"></div>
                <div className="h-4 w-full rounded-md bg-muted"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error component
function BookingError({ error }: { error: Error }) {
  return (
    <div className="container p-6 md:p-10">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/user/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Error Loading Booking</CardTitle>
          <CardDescription>We encountered a problem loading your booking details</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{error.message || "Please try again later"}</p>
          <Button asChild>
            <Link href="/user/bookings">Back to Bookings</Link>
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
          <X className="mr-1 h-3 w-3" />
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

// Booking details component
async function BookingDetail({ id, showSuccess }: { id: string, showSuccess: boolean }) {
  try {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/login?callbackUrl=/user/bookings/' + id);
    }

    // Get cookies for authentication
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    // Use absolute URL with origin to avoid URL parsing errors
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Fetch booking details
    const response = await fetch(
      `${baseUrl}/api/bookings/${id}`,
      {
        headers: {
          cookie: cookieString,
          'Content-Type': 'application/json'
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch booking: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error("Booking not found");
    }

    const booking = data.data as Booking;

    // Format dates
    const bookingDate = new Date(booking.scheduledDate);
    const formattedDate = format(bookingDate, "PPP"); // Monday, January 1, 2023
    const formattedTime = format(bookingDate, "p"); // 12:00 PM

    // Function to check if date is in the past
    const isPast = bookingDate < new Date();

    return (
      <div className="container p-6 md:p-10">
        <FadeIn>
          {/* Success message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p>Your booking has been successfully created!</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user/bookings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bookings
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Booking Details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{booking.serviceId?.title || "Service not found"}</CardTitle>
                      <CardDescription>{booking.serviceId?.category || "Unknown category"}</CardDescription>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Booking Time */}
                  <div>
                    <h3 className="text-sm font-medium mb-1">Appointment Time</h3>
                    <div className="flex items-center text-muted-foreground">
                      <CalendarClock className="h-4 w-4 mr-2" />
                      <span>
                        {formattedDate} at {formattedTime}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Service Description */}
                  <div>
                    <h3 className="text-sm font-medium mb-1">Service Description</h3>
                    <p className="text-muted-foreground">{booking.serviceId?.description || "No description available"}</p>
                  </div>

                  <Separator />

                  {/* Notes */}
                  {booking.notes && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Your Notes</h3>
                      <p className="text-muted-foreground">{booking.notes}</p>
                    </div>
                  )}

                  {/* Booking Details */}
                  <div>
                    <h3 className="text-sm font-medium mb-1">Booking Details</h3>
                    <div className="text-sm text-muted-foreground">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Booking ID:</span>
                        <span>{booking._id.substring(booking._id.length - 8)}</span>

                        <span className="font-medium">Created On:</span>
                        <span>{new Date(booking.createdAt).toLocaleDateString()}</span>

                        <span className="font-medium">Price:</span>
                        <span>${booking.serviceId?.price?.toFixed(2) || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-6 flex gap-2">
                  {/* Action buttons based on booking status */}
                  {booking.status === "PENDING" && !isPast && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive">Cancel Booking</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancel Booking</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to cancel this booking? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>

                          <form className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Reason for Cancellation (Optional)</label>
                              <Textarea placeholder="Tell us why you&apos;re cancelling..." />
                            </div>
                          </form>

                          <DialogFooter>
                            <Button variant="outline" type="button">
                              Keep Booking
                            </Button>
                            <Button variant="destructive" type="button">
                              Confirm Cancellation
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" asChild>
                        <Link href={`/user/bookings/edit/${booking._id}`}>
                          Reschedule
                        </Link>
                      </Button>
                    </>
                  )}

                  {booking.status === "CONFIRMED" && !isPast && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive">Cancel Booking</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancel Booking</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to cancel this confirmed booking? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>

                          <form className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Reason for Cancellation (Optional)</label>
                              <Textarea placeholder="Tell us why you&apos;re cancelling..." />
                            </div>
                          </form>

                          <DialogFooter>
                            <Button variant="outline" type="button">
                              Keep Booking
                            </Button>
                            <Button variant="destructive" type="button">
                              Confirm Cancellation
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {(booking.status === "COMPLETED" || booking.status === "CANCELLED") && booking.serviceId?._id && (
                    <Button variant="outline" asChild>
                      <Link href={`/services/${booking.serviceId._id}`}>
                        Book Again
                      </Link>
                    </Button>
                  )}

                  <Button variant="outline" asChild className="ml-auto">
                    <Link href={`/user/support?bookingId=${booking._id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Get Support
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Warning for past pending booking */}
              {booking.status === "PENDING" && isPast && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <CalendarX className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800">Booking Date Has Passed</h3>
                      <p className="text-sm text-amber-700">
                        This booking&apos;s scheduled date has already passed. Please contact support
                        or create a new booking.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Agent Information */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Service Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {booking.agentId ? (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-medium text-center">{booking.agentId?.name || "Agent not found"}</h3>
                        <p className="text-sm text-muted-foreground">{booking.agentId?.role || "Service Agent"}</p>

                        {/* Agent Rating */}
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${star <= 4 ? "text-amber-400" : "text-gray-300"}`}
                              fill={star <= 4 ? "currentColor" : "none"}
                            />
                          ))}
                          <span className="text-xs ml-1 text-muted-foreground">(4.0)</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{booking.agentId?.email || "Email not available"}</span>
                        </div>

                        {booking.agentId?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{booking.agentId.phone}</span>
                          </div>
                        )}

                        {booking.agentId?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{booking.agentId.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Certified Professional</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {booking.agentId?._id && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  <User className="mr-2 h-4 w-4" />
                                  View Agent Profile
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Agent Profile</DialogTitle>
                                  <DialogDescription>
                                    Detailed information about your service provider
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="py-4">
                                  <div className="flex items-center gap-4 mb-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-lg">{booking.agentId?.name}</h3>
                                      <p className="text-sm text-muted-foreground">{booking.agentId?.role || "Service Agent"}</p>
                                      <div className="flex items-center mt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-3 w-3 ${star <= 4 ? "text-amber-400" : "text-gray-300"}`}
                                            fill={star <= 4 ? "currentColor" : "none"}
                                          />
                                        ))}
                                        <span className="text-xs ml-1 text-muted-foreground">(4.0)</span>
                                      </div>
                                    </div>
                                  </div>

                                  <Tabs defaultValue="about">
                                    <TabsList className="grid w-full grid-cols-3">
                                      <TabsTrigger value="about">About</TabsTrigger>
                                      <TabsTrigger value="services">Services</TabsTrigger>
                                      <TabsTrigger value="schedule">Schedule</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="about" className="space-y-4 mt-4">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">{booking.agentId?.email}</span>
                                        </div>
                                        {booking.agentId?.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{booking.agentId.phone}</span>
                                          </div>
                                        )}
                                        {booking.agentId?.location && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{booking.agentId.location}</span>
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Expertise</h4>
                                        <div className="flex flex-wrap gap-1">
                                          <Badge variant="secondary">Customer Service</Badge>
                                          <Badge variant="secondary">{booking.serviceId?.category || "Services"}</Badge>
                                          <Badge variant="secondary">Certified</Badge>
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="text-sm font-medium mb-2">About</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Professional service provider with expertise in {booking.serviceId?.category || "various services"}.
                                          Committed to delivering high-quality service and ensuring customer satisfaction.
                                        </p>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="services" className="mt-4">
                                      <div className="rounded-md border">
                                        <div className="p-4 flex items-center gap-3">
                                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                          </div>
                                          <div>
                                            <h4 className="font-medium">{booking.serviceId?.title || "Service"}</h4>
                                            <p className="text-sm text-muted-foreground">{booking.serviceId?.category || "Category"}</p>
                                          </div>
                                          <div className="ml-auto">
                                            <Badge>${booking.serviceId?.price?.toFixed(2) || "N/A"}</Badge>
                                          </div>
                                        </div>
                                      </div>

                                      <Button variant="link" className="p-0 h-auto mt-2" asChild>
                                        <Link href={`/user/agents?id=${booking.agentId._id}`}>
                                          View all services by this agent
                                        </Link>
                                      </Button>
                                    </TabsContent>

                                    <TabsContent value="schedule" className="mt-4">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">Available Monday - Friday</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">9:00 AM - 5:00 PM</span>
                                        </div>
                                      </div>

                                      <Button className="w-full mt-4" asChild>
                                        <Link href={`/user/bookings/new/${booking.serviceId?._id}`}>
                                          Book New Appointment
                                        </Link>
                                      </Button>
                                    </TabsContent>
                                  </Tabs>
                                </div>

                                <DialogFooter>
                                  <Button variant="outline" asChild>
                                    <Link href={`/user/agents?id=${booking.agentId._id}`}>
                                      Full Profile
                                    </Link>
                                  </Button>
                                  <Button variant="secondary" asChild>
                                    <Link href={`/user/support?agentId=${booking.agentId._id}`}>
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Contact
                                    </Link>
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {booking.status === "CONFIRMED" && (
                              <Button variant="secondary" className="w-full" asChild>
                                <Link href={`/user/support?agentId=${booking.agentId._id}&bookingId=${booking._id}`}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Contact Agent
                                </Link>
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2 mx-auto">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Agent information unavailable</p>
                      <Button variant="outline" className="mt-4 w-full" asChild>
                        <Link href="/user/support">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Contact Support
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Quick Info */}
              {booking.serviceId && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Service Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">${booking.serviceId?.price?.toFixed(2) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{booking.serviceId?.category || "Unknown"}</span>
                      </div>
                      {booking.serviceId?._id && (
                        <Button variant="link" className="p-0 h-auto w-full justify-end" asChild>
                          <Link href={`/services/${booking.serviceId._id}`}>
                            View Service Details
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    );
  } catch (error) {
    return <BookingError error={error instanceof Error ? error : new Error('Failed to load booking details')} />;
  }
}

export default async function BookingDetailPage({ params, searchParams }: BookingDetailsProps) {
  // Resolve the Promise parameters
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Check for success parameter
  const showSuccess = resolvedSearchParams.success === 'true';

  return (
    <PageTransition>
      <Suspense fallback={<BookingSkeleton />}>
        <BookingDetail id={resolvedParams.id} showSuccess={showSuccess} />
      </Suspense>
    </PageTransition>
  );
} 