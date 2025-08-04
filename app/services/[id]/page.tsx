import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface ServiceDetailProps {
  params: Promise<{
    id: string;
  }>;
}

// Loading component
function ServiceSkeleton() {
  return (
    <div className="container px-4 py-16 md:px-6 md:py-24">
      <div className="mb-6">
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse"></div>
      </div>
      
      <div className="rounded-lg border bg-card overflow-hidden animate-pulse">
        <div className="p-6">
          <div className="h-10 w-1/3 rounded-md bg-muted mb-2"></div>
          <div className="h-6 w-1/4 rounded-md bg-muted"></div>
        </div>
        <div className="p-6">
          <div className="mb-8 rounded-lg bg-muted p-6 h-32"></div>
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted p-4 h-20"></div>
            <div className="rounded-lg bg-muted p-4 h-20"></div>
            <div className="rounded-lg bg-muted p-4 h-20"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-10 w-40 rounded-md bg-muted"></div>
        </div>
      </div>
    </div>
  );
}

// Error component
function ServiceError({ error }: { error: Error }) {
  return (
    <div className="container flex min-h-[400px] flex-col items-center justify-center px-4 py-16 text-center md:px-6">
      <h2 className="mb-2 text-2xl font-bold">Error Loading Service</h2>
      <p className="mb-6 text-muted-foreground">{error.message || "Service not found or unavailable"}</p>
      <Button asChild>
        <Link href="/services">Back to Services</Link>
      </Button>
    </div>
  );
}

// Dynamic metadata generation
export async function generateMetadata({ params }: ServiceDetailProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    
    // Use absolute URL with origin to avoid URL parsing errors
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(
      `${baseUrl}/api/services/${resolvedParams.id}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      return {
        title: "Service Not Found - Civix",
        description: "The requested service could not be found",
      };
    }
    
    const data = await response.json();
    const service = data.data;
    
    return {
      title: `${service.title} - Civix Services`,
      description: service.description,
    };
  } catch (error) {
    return {
      title: "Service - Civix",
      description: "Service details",
    };
  }
}

// Service detail component
async function ServiceDetail({ id }: { id: string }) {
  try {
    // Use absolute URL with origin to avoid URL parsing errors
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(
      `${baseUrl}/api/services/${id}`,
      { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`Failed to load service: ${response.statusText}`);
    }
    
    const data = await response.json();
    const service = data.data;
    
    if (!service) {
      notFound();
    }
    
    return (
      <div className="container px-4 py-16 md:px-6 md:py-24">
        <div className="mb-6">
          <Link href="/services">
            <Button variant="ghost" size="sm">
              ← Back to Services
            </Button>
          </Link>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <FadeIn>
              <CardTitle className="text-3xl">{service.title}</CardTitle>
              <CardDescription className="text-lg">
                {service.category}
              </CardDescription>
            </FadeIn>
          </CardHeader>
          <CardContent>
            <FadeIn delay={0.1}>
              <div className="mb-8 rounded-lg bg-muted p-6">
                <h2 className="mb-2 text-xl font-semibold">Description</h2>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
              
              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                  <p className="mt-1 text-xl font-semibold">${service.price.toFixed(2)}</p>
                </div>
                
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <p className="mt-1 text-xl font-semibold">{service.category}</p>
                </div>
                
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="mt-1 text-xl font-semibold">
                    {service.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </FadeIn>
          </CardContent>
          <CardFooter>
            <FadeIn delay={0.2}>
              <Link href={`/user/bookings/new/${service._id}`}>
                <Button size="lg">Book This Service</Button>
              </Link>
            </FadeIn>
          </CardFooter>
        </Card>
      </div>
    );
  } catch (error) {
    throw error;
  }
}

// Page component
export default async function ServicePage({ params }: ServiceDetailProps) {
  const resolvedParams = await params;
  
  return (
    <MainLayout>
      <PageTransition>
        <Suspense fallback={<ServiceSkeleton />}>
          <ServiceDetail id={resolvedParams.id} />
        </Suspense>
      </PageTransition>
    </MainLayout>
  );
} 
