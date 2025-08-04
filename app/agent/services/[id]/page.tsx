"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientOnly } from "@/components/client-only";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { Service } from "@/types";

// Service categories
const SERVICE_CATEGORIES = [
  "Home Services",
  "Professional Services",
  "Health & Wellness",
  "Education & Tutoring",
  "Technology",
  "Events & Entertainment",
  "Transportation",
  "Other"
];

// Define form schema
const serviceFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description must be less than 1000 characters"),
  price: z.number().positive("Price must be a positive number").min(1, "Minimum price is $1"),
  category: z.string().refine(val => SERVICE_CATEGORIES.includes(val), "Please select a valid category"),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function EditService({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string>("");

  // Get serviceId from params
  useEffect(() => {
    const getServiceId = async () => {
      const resolvedParams = await params;
      setServiceId(resolvedParams.id);
    };
    getServiceId();
  }, [params]);

  // Fetch service data
  const { data: service, isLoading, error: fetchError } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const res = await fetch(`/api/agents/services/${serviceId}`);
      if (!res.ok) throw new Error("Failed to fetch service");
      const data = await res.json();
      return data.data;
    },
    enabled: !!serviceId,
  });

  // Form setup
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category: "",
    },
  });

  // Update form when service data is loaded
  useEffect(() => {
    if (service) {
      form.reset({
        title: service.title,
        description: service.description,
        price: service.price,
        category: service.category,
      });
    }
  }, [service, form]);

  // Update service mutation
  const updateServiceMutation = useMutation<Service, Error, Partial<Service>>({
    mutationFn: async (data: Partial<Service>) => {
      const res = await fetch(`/api/agents/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update service");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Service Updated",
        description: "Your service has been updated successfully.",
        variant: "default",
      });
      router.push("/agent/services");
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: ServiceFormValues) => {
    setIsSubmitting(true);
    updateServiceMutation.mutate({
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
    });
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading service...</span>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (fetchError || !service) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6">
          <div className="flex items-center space-x-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agent/services">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Services
              </Link>
            </Button>
          </div>
          
          <FadeIn>
            <Card className="max-w-2xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {fetchError?.message || "Service not found"}
                  </AlertDescription>
                </Alert>
                <Button asChild>
                  <Link href="/agent/services">Back to Services</Link>
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container py-12 px-4 md:px-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/agent/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>
        
        <FadeIn>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Edit Service</CardTitle>
              <CardDescription>
                Update your service details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <ClientOnly>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Service Title
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Professional Web Design"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    onValueChange={(value) => form.setValue("category", value)}
                    defaultValue={form.getValues("category")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price ($)
                  </label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="99.99"
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Describe your service in detail..."
                    rows={5}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                                  </div>
                </form>
              </ClientOnly>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" asChild>
                <Link href="/agent/services">Cancel</Link>
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Service"
                )}
              </Button>
            </CardFooter>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 