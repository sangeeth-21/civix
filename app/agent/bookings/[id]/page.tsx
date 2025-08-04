"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, AlertTriangle, Check, X, Clock } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Booking {
  _id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledDate: string;
  serviceId: Service;
  userId: User;
  notes?: string;
  agentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AgentBookingDetail() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentNotes, setAgentNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingNotes, setUpdatingNotes] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No booking ID provided.");
      setLoading(false);
      // Show toast for missing ID
      toast({
        title: "Booking Error",
        description: "No booking ID provided.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    fetch(`/api/agents/bookings/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          // Show toast for forbidden or other errors
          let userMessage = errorData.message || "Failed to fetch booking";
          if (res.status === 403) {
            userMessage = "You do not have permission to view this booking.";
          }
          toast({
            title: "Booking Error",
            description: userMessage,
            variant: "destructive"
          });
          throw new Error(userMessage);
        }
        const data = await res.json();
        setBooking(data.data);
        if (data.data.agentNotes) {
          setAgentNotes(data.data.agentNotes);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateBookingStatus = async (status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") => {
    if (!booking) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/agents/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const data = await res.json();
      setBooking({
        ...booking,
        status,
      });
      toast({
        title: `Booking status updated to ${status}`,
        description: `Booking status updated to ${status}`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to update status",
        description: err.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateAgentNotes = async () => {
    if (!booking) return;

    setUpdatingNotes(true);
    try {
      const res = await fetch(`/api/agents/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentNotes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update notes");
      }

      toast({
        title: "Notes updated successfully",
        description: "Notes updated successfully",
      });
    } catch (err: any) {
      toast({
        title: "Failed to update notes",
        description: err.message || "Failed to update notes",
        variant: "destructive",
      });
    } finally {
      setUpdatingNotes(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "CONFIRMED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive font-semibold">{error}</p>
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive font-semibold">Booking not found.</p>
      </div>
    );
  }
  return (
    <PageTransition>
      <FadeIn>
        <div className="max-w-3xl mx-auto mt-10 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Booking Details</CardTitle>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Service</h3>
                    <p className="font-medium">{booking.serviceId?.title || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Price</h3>
                    <p className="font-medium">${booking.serviceId?.price?.toFixed(2) || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Client</h3>
                    <p className="font-medium">{booking.userId?.name || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Contact</h3>
                    <p className="font-medium">{booking.userId?.email || "-"}</p>
                    {booking.userId?.phone && <p className="font-medium">{booking.userId.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Scheduled Date</h3>
                    <p className="font-medium">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleString() : "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Booking Created</h3>
                    <p className="font-medium">{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"}</p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="space-y-2 pt-2 border-t">
                    <h3 className="font-medium text-sm text-muted-foreground">Client Notes</h3>
                    <p>{booking.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={booking.status === "PENDING" ? "default" : "outline"}
                  onClick={() => updateBookingStatus("PENDING")}
                  disabled={updatingStatus || booking.status === "PENDING"}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Pending
                </Button>
                <Button
                  variant={booking.status === "CONFIRMED" ? "default" : "outline"}
                  onClick={() => updateBookingStatus("CONFIRMED")}
                  disabled={updatingStatus || booking.status === "CONFIRMED"}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
                <Button
                  variant={booking.status === "COMPLETED" ? "default" : "outline"}
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateBookingStatus("COMPLETED")}
                  disabled={updatingStatus || booking.status === "COMPLETED"}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Complete
                </Button>
                <Button
                  variant={booking.status === "CANCELLED" ? "default" : "outline"}
                  className={booking.status === "CANCELLED" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => updateBookingStatus("CANCELLED")}
                  disabled={updatingStatus || booking.status === "CANCELLED"}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="Add notes about this booking (only visible to you)"
                className="min-h-[120px]"
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={updateAgentNotes}
                disabled={updatingNotes || agentNotes === booking.agentNotes}
              >
                {updatingNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Notes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </FadeIn>
    </PageTransition>
  );
} 