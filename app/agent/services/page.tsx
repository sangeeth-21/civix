"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus, 
  Eye, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

// Interface for service data
interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  agentId: string;
  isActive: boolean;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

function AgentServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Use query to fetch services
  const { data: services, isLoading, error } = useQuery({
    queryKey: ["agentServices", activeFilter, category],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      if (activeFilter) {
        params.append("isActive", activeFilter === "active" ? "true" : "false");
      }
      if (category) {
        params.append("category", category);
      }
      
      const res = await fetch(`/api/services?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    }
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation<Service, Error, { id: string; data: Partial<Service> }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const res = await fetch(`/api/agents/services/${id}`, {
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
        description: "Service has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["agentServices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agents/services/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");
    },
    onSuccess: () => {
      toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["agentServices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle service status mutation
  const toggleStatusMutation = useMutation<Service, Error, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/agents/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update service status");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Service status has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["agentServices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter services based on search query - ensure data is an array
  // Services API returns { success: true, data: { data: [...], pagination: {...} } }
  const safeServices = Array.isArray(services?.data?.data) ? services.data.data : [];
  const filteredServices = safeServices.filter((service: Service) => {
    return (
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    // Handle different field types
    let aValue, bValue;
    
    if (sortField === "price" || sortField === "duration") {
      aValue = a[sortField] || 0;
      bValue = b[sortField] || 0;
    } else if (sortField === "createdAt" || sortField === "updatedAt") {
      aValue = new Date(a[sortField]).getTime();
      bValue = new Date(b[sortField]).getTime();
    } else {
      aValue = String(a[sortField]).toLowerCase();
      bValue = String(b[sortField]).toLowerCase();
    }
    
    // Sort based on direction with null/undefined checks
    if (sortDirection === "asc") {
      if (aValue === undefined) return bValue === undefined ? 0 : -1;
      if (bValue === undefined) return 1;
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      if (aValue === undefined) return bValue === undefined ? 0 : 1;
      if (bValue === undefined) return -1;
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
  
  // Helper for sorting
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Get unique categories for filter
  const categories = Array.from(new Set(safeServices.map((s: Service) => s.category)));
  
  // Handle service deletion
  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete action
  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete._id);
    }
  };
  
  // Toggle service active status
  const toggleServiceStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load services. Please try again later.</p>
            <Button 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["agentServices"] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">My Services</Heading>
              <p className="text-muted-foreground">
                Manage the services you offer to clients
              </p>
            </div>
            
            <Button asChild size="sm">
              <Link href="/agent/services/create">
                <Plus className="mr-2 h-4 w-4" /> Create New Service
              </Link>
            </Button>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {activeFilter ? `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Only` : 'All Services'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setActiveFilter(null)}>
                    All Services
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("active")}>
                    Active Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("inactive")}>
                    Inactive Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {category || 'All Categories'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCategory("")}>
                    All Categories
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  {categories.map((cat) => (
                    <DropdownMenuItem key={String(cat)} onClick={() => setCategory(String(cat))}>
                      {String(cat)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          {sortedServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">No services found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || activeFilter || category
                      ? "Try adjusting your filters or search query"
                      : "You haven&apos;t created any services yet"}
                  </p>
                  {!searchQuery && !activeFilter && !category && (
                    <Button asChild>
                      <Link href="/agent/services/create">
                        <Plus className="mr-2 h-4 w-4" /> Create Your First Service
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSortChange("title")}
                        className="flex items-center font-medium px-0"
                      >
                        Service
                        {sortField === "title" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                        {sortField !== "title" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSortChange("category")}
                        className="flex items-center font-medium px-0"
                      >
                        Category
                        {sortField === "category" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                        {sortField !== "category" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSortChange("price")}
                        className="flex items-center font-medium px-0"
                      >
                        Price
                        {sortField === "price" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                        {sortField !== "price" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedServices.map((service: Service) => (
                    <TableRow key={service._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell>${service.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={service.isActive ? "success" : "destructive"}
                          className="cursor-pointer"
                          onClick={() => toggleServiceStatus(service._id, service.isActive)}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/services/${service._id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/agent/services/${service._id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteService(service)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </FadeIn>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will delete the service &quot;{serviceToDelete?.title}&quot;. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteServiceMutation.isPending}
            >
              {deleteServiceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

export default function AgentServices() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AgentServicesContent />
    </Suspense>
  );
} 
