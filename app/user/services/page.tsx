"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, Tag, ChevronRight, X } from "lucide-react";

// Service type
interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

// Skeleton loader
function ServicesSkeleton() {
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 h-10 bg-muted animate-pulse rounded-md"></div>
        <div className="w-40 h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-7 w-3/4 bg-muted rounded-md mb-2"></div>
              <div className="h-5 w-1/2 bg-muted rounded-md"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded-md mb-2"></div>
              <div className="h-4 w-full bg-muted rounded-md mb-2"></div>
              <div className="h-4 w-2/3 bg-muted rounded-md"></div>
            </CardContent>
            <Button asChild className="w-full">
              <Link href={`/user/bookings/new/`}>
                Book Now
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Error display
function ServicesError({ error }: { error: Error }) {
  return (
    <div className="container p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Services</CardTitle>
          <p className="text-muted-foreground mb-6">{error.message || "Please try again later"}</p>
          <Button asChild>
            <Link href="/user/services">Refresh</Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}

// Modern Service Card
function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="line-clamp-1">{service.title}</CardTitle>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag className="h-4 w-4" />
          {service.category}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {service.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">₹{service.price.toFixed(2)}</span>
          <Badge variant="secondary">Available</Badge>
        </div>
      </CardContent>
      <Button asChild className="w-full">
        <Link href={`/user/bookings/new/${service._id}`}>
          Book Now
          <ChevronRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </Card>
  );
}

// Main Page Component
export default function UserServices() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await fetch(`/api/services`);
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      return Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : [];
    },
  });

  // Extract unique categories from services
  const categories: string[] = useMemo(() => {
    if (!data) return ["all"];
    const cats = Array.from(new Set(data.map((s: Service) => s.category))) as string[];
    return ["all", ...cats];
  }, [data]);

  // Filter services by search and category
  const services: Service[] = useMemo(() => {
    if (!data) return [];
    return data.filter((service: Service) => {
      const matchesCategory = category === "all" || service.category === category;
      const matchesSearch =
        service.title.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [data, search, category]);

  return (
    <PageTransition>
      <div className="container space-y-6 p-6 md:p-10">
        <FadeIn>
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Browse Services</h1>
              <p className="text-muted-foreground">
                Discover and book services from our trusted providers
              </p>
            </div>
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 w-full border rounded-md h-10 focus:ring-2 focus:ring-primary"
                  aria-label="Search services"
                />
                {search && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Category Filter */}
              <div>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="border rounded-md h-10 px-3 w-full md:w-48 focus:ring-2 focus:ring-primary"
                  aria-label="Filter by category"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </FadeIn>
        {/* Service Cards Grid */}
        {isLoading ? (
          <ServicesSkeleton />
        ) : isError ? (
          <ServicesError error={error instanceof Error ? error : new Error("Failed to load services")} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.length > 0 ? (
              services.map(service => <ServiceCard key={service._id} service={service} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <h2 className="text-xl font-semibold mb-2">No Services Found</h2>
                <p className="text-muted-foreground mb-6">Try adjusting your search or filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
} 
