import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageTransition, FadeIn, StaggerChildren } from "@/components/page-transition";
import { Suspense } from "react";
import { Metadata } from "next";

// Add metadata for SEO
export const metadata: Metadata = {
  title: "Services - Civix Platform",
  description: "Browse available services on Civix",
};

// Loading component
function ServicesSkeleton() {
  return (
    <div className="container px-4 py-16 md:px-6 md:py-24">
      <div className="mb-12">
        <div className="h-10 w-1/4 rounded-md bg-muted animate-pulse"></div>
        <div className="mt-4 h-6 w-1/2 rounded-md bg-muted animate-pulse"></div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card animate-pulse">
            <div className="p-6">
              <div className="h-7 w-3/4 rounded-md bg-muted"></div>
              <div className="mt-2 h-5 w-1/2 rounded-md bg-muted"></div>
            </div>
            <div className="p-6">
              <div className="h-4 w-full rounded-md bg-muted"></div>
              <div className="mt-2 h-4 w-full rounded-md bg-muted"></div>
              <div className="mt-4 h-6 w-1/4 rounded-md bg-muted"></div>
            </div>
            <div className="flex justify-end p-6">
              <div className="h-10 w-28 rounded-md bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error component
function ServicesError({ error }: { error: Error }) {
  return (
    <div className="container flex min-h-[400px] flex-col items-center justify-center px-4 py-16 text-center md:px-6">
      <h2 className="mb-2 text-2xl font-bold">Error Loading Services</h2>
      <p className="mb-6 text-muted-foreground">{error.message || "Please try again later"}</p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}

// Service fetcher component
async function ServicesList() {
  try {
    // Always use relative path for API route to avoid SSR/client mismatch and 500 errors
    const response = await fetch(`/api/services`, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Try to extract error message from response body if possible
      let errorMsg = `Failed to fetch services: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMsg = `Failed to fetch services: ${errorData.error}`;
        }
      } catch {
        // ignore JSON parse error, use default errorMsg
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    // Defensive: support both {data: {data: [...]}} and {data: [...]}
    let services: any[] = [];
    if (Array.isArray(data.data?.data)) {
      services = data.data.data;
    } else if (Array.isArray(data.data)) {
      services = data.data;
    } else if (Array.isArray(data)) {
      services = data;
    }

    if (services.length === 0) {
      return (
        <div className="container px-4 py-16 md:px-6 md:py-24">
          <FadeIn>
            <div className="rounded-lg border bg-card p-8 text-center">
              <h2 className="mb-2 text-2xl font-semibold">No Services Available</h2>
              <p className="mb-6 text-muted-foreground">Check back later for new services.</p>
              <Button asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      );
    }

    return (
      <div className="container px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12">
          <FadeIn>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Services
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 max-w-[700px] text-muted-foreground md:text-xl">
              Browse our available services and book the ones you need.
            </p>
          </FadeIn>
        </div>

        <StaggerChildren className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service: { _id: string; title: string; category: string; description: string; price: number }) => (
            <Card key={service._id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>
                  {service.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
                <p className="mt-4 font-semibold">
                  {typeof service.price === "number" ? `$${service.price.toFixed(2)}` : ""}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Link href={`/services/${service._id}`}>
                  <Button>View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </StaggerChildren>
      </div>
    );
  } catch (error: any) {
    // Instead of throwing, render the error UI directly
    return <ServicesError error={error instanceof Error ? error : new Error("Unknown error")} />;
  }
}

export default function Services() {
  return (
    <MainLayout>
      <PageTransition>
        <Suspense fallback={<ServicesSkeleton />}>
          <ServicesList />
        </Suspense>
      </PageTransition>
    </MainLayout>
  );
} 
