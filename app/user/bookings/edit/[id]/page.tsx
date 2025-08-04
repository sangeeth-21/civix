"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition, FadeIn } from "@/components/page-transition";

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

interface Booking {
  _id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledDate: string;
  serviceId: Service;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditBooking() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No booking ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/bookings/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setBooking(data.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
        <Card className="max-w-2xl mx-auto mt-10">
          <CardHeader>
            <CardTitle>Edit Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div><strong>Service:</strong> {booking.serviceId.title}</div>
              <div><strong>Status:</strong> {booking.status}</div>
              <div><strong>Scheduled:</strong> {new Date(booking.scheduledDate).toLocaleString()}</div>
              {booking.notes && <div><strong>Notes:</strong> {booking.notes}</div>}
            </div>
            {/* TODO: Add booking edit form here */}
            <div className="text-muted-foreground">Booking edit form coming soon.</div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </CardFooter>
        </Card>
      </FadeIn>
    </PageTransition>
  );
} 