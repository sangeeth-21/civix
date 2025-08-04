"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, startOfDay, setHours, setMinutes } from "date-fns";
import { CalendarIcon, ArrowLeft, Loader2, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

// Define the form schema
const bookingFormSchema = z.object({
  scheduledDate: z.date({
    error: "Please select a date and time for your booking",
  }),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  agentId: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  bio?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function NewBooking({ params }: { params: Promise<{ serviceId: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [service, setService] = useState<Service | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  // Form setup
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Get serviceId from params
  useEffect(() => {
    const getServiceId = async () => {
      const resolvedParams = await params;
      setServiceId(resolvedParams.serviceId);
    };
    getServiceId();
  }, [params]);

  // Fetch service details and user profile on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!serviceId) return;
      
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl = window.location.origin;
        
        // Fetch service details
        const serviceResponse = await fetch(`${baseUrl}/api/services/${serviceId}`);
        const serviceData = await serviceResponse.json();

        if (!serviceResponse.ok || !serviceData.success) {
          throw new Error(serviceData.error || "Failed to load service details");
        }

        setService(serviceData.data);

        // Fetch user profile
        const profileResponse = await fetch(`${baseUrl}/api/users/profile`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData.data);
          setPhoneNumber(profileData.data.phone || "");
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [serviceId]);

  // Check if user has phone number before booking
  const checkPhoneNumber = () => {
    if (!userProfile?.phone) {
      setShowPhoneDialog(true);
      return false;
    }
    return true;
  };

  // Update phone number
  const updatePhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      return;
    }

    try {
      setIsUpdatingPhone(true);
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (response.ok) {
        setUserProfile(prev => prev ? { ...prev, phone: phoneNumber } : null);
        setShowPhoneDialog(false);
        // Continue with booking
        form.handleSubmit(onSubmit)();
      } else {
        throw new Error("Failed to update phone number");
      }
    } catch (err) {
      // Handle error silently
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  // Form submission
  const onSubmit = async (values: BookingFormValues) => {
    // Check phone number first
    if (!checkPhoneNumber()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: serviceId,
          scheduledDate: values.scheduledDate,
          notes: values.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create booking");
      }

      // Redirect to booking details or confirmation page
      router.push(`/user/bookings/${data.data._id}?success=true`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time slots (9 AM to 6 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6">
          <div className="flex items-center space-x-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/services">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Services
              </Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="animate-pulse bg-muted h-8 w-1/3 rounded-md"></CardTitle>
              <CardDescription className="animate-pulse bg-muted h-5 w-1/4 rounded-md"></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="animate-pulse bg-muted h-10 w-full rounded-md"></div>
                <div className="animate-pulse bg-muted h-24 w-full rounded-md"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (error) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6">
          <div className="flex items-center space-x-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/services">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Services
              </Link>
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container py-12 px-4 md:px-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>

        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Book Service: {service?.title}</CardTitle>
              <CardDescription>
                {service?.category} - ${service?.price.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date and Time</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Picker */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !form.watch("scheduledDate") && "text-muted-foreground"
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("scheduledDate") ? (
                            format(form.watch("scheduledDate"), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch("scheduledDate")}
                          onSelect={(date) => {
                            if (date) {
                              // Set to 9 AM by default when date is selected
                              const newDate = setHours(setMinutes(date, 0), 9);
                              form.setValue("scheduledDate", newDate);
                            }
                          }}
                          disabled={(date) => {
                            // Disable past dates
                            return date < startOfDay(new Date());
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Time Picker */}
                    <Select
                      onValueChange={(time) => {
                        const currentDate = form.watch("scheduledDate") || new Date();
                        const [hours, minutes] = time.split(":").map(Number);
                        const newDate = setHours(setMinutes(currentDate, minutes), hours);
                        form.setValue("scheduledDate", newDate);
                      }}
                      value={
                        form.watch("scheduledDate")
                          ? format(form.watch("scheduledDate"), "HH:mm")
                          : ""
                      }
                    >
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}:00`), "h:mm a")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.formState.errors.scheduledDate && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.scheduledDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea
                    placeholder="Add any special requests or notes for this booking"
                    {...form.register("notes")}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/services">Cancel</Link>
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </CardFooter>
          </Card>
        </FadeIn>

        {/* Phone Number Dialog */}
        <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Phone Number Required
              </DialogTitle>
              <DialogDescription>
                We need your phone number to complete this booking. This helps us contact you about your appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={updatePhoneNumber}
                disabled={!phoneNumber.trim() || isUpdatingPhone}
              >
                {isUpdatingPhone ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update & Continue"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
} 
