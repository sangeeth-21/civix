"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  Eye, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  DollarSign,
  Clock,
  User,
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
interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  agentId: Agent;
  isActive: boolean;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  bookingsCount?: number;
  totalRevenue?: number;
}

function AdminServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Use query to fetch services
  const { data: services, isLoading, error } = useQuery<{ data: Service[] }, Error>({
    queryKey: ["adminServices", statusFilter, categoryFilter, agentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Only add filters if they're not "all"
      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (agentFilter !== "all") {
        params.append("agentId", agentFilter);
      }
      
      const res = await fetch(`/api/admin/services?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    }
  });
  
  // Fetch agents for filter
  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    }
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation<Service, Error, { id: string; data: Partial<Service> }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const res = await fetch(`/api/admin/services/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
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
      const res = await fetch(`/api/admin/services/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Bulk status update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const res = await fetch("/api/admin/services/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, isActive }),
      });
      if (!res.ok) throw new Error("Failed to update services");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Services Updated",
        description: `${selectedServices.length} services have been updated successfully.`,
        variant: "default",
      });
      setSelectedServices([]);
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter services based on search query
  const filteredServices = services?.data?.filter((service: Service) => {
    return (
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.agentId.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];
  
  // Define allowed string fields for sorting
  const stringFields: Array<keyof Service> = [
    "title", "description", "category"
  ];

  // Sort data based on current sort field and direction
  const sortedServices = services?.data ? [...services.data].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    if (sortField === "createdAt" || sortField === "updatedAt") {
      const aDate = a[sortField as keyof Service];
      const bDate = b[sortField as keyof Service];
      aValue = typeof aDate === 'string' ? new Date(aDate).toISOString() : "";
      bValue = typeof bDate === 'string' ? new Date(bDate).toISOString() : "";
    } else if (stringFields.includes(sortField as keyof Service)) {
      aValue = String(a[sortField as keyof Service] ?? "").toLowerCase();
      bValue = String(b[sortField as keyof Service] ?? "").toLowerCase();
    } else {
      aValue = "";
      bValue = "";
    }

    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  }) : [];
  
  // Helper for sorting
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
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
  
  // Handle status toggle
  const handleStatusToggle = (id: string, currentStatus: boolean) => {
    updateServiceMutation.mutate({ id, data: { isActive: !currentStatus } });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteServiceMutation.mutate(id);
  };
  
  // Handle bulk status update
  const handleBulkStatusUpdate = (isActive: boolean) => {
    // Implementation for bulk status update
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedServices(sortedServices.map(s => s._id));
    } else {
      setSelectedServices([]);
    }
  };
  
  // Handle individual selection
  const handleSelectService = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
  };
  
  // Get unique categories for filter
  const categories = Array.from(new Set(services?.data?.map((s: Service) => s.category) || []));
  
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ["adminServices"] })}
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
              <Heading level="h1" className="mb-2">Services Management</Heading>
              <p className="text-muted-foreground">
                Manage all services across the platform
              </p>
            </div>
            
            <div className="flex gap-2">
              {selectedServices.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedServices.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate(true)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Activate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate(false)}>
                      <XCircle className="mr-2 h-4 w-4" /> Deactivate Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={String(cat)} value={String(cat)}>
                      {String(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents?.data?.map((agent: Agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedServices.length === sortedServices.length && sortedServices.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </TableHead>
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
                      onClick={() => handleSortChange("agentId.name")}
                      className="flex items-center font-medium px-0"
                    >
                      <User className="mr-1 h-4 w-4" />
                      Agent
                      {sortField === "agentId.name" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "agentId.name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("price")}
                      className="flex items-center font-medium px-0"
                    >
                      <DollarSign className="mr-1 h-4 w-4" />
                      Price
                      {sortField === "price" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "price" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("duration")}
                      className="flex items-center font-medium px-0"
                    >
                      <Clock className="mr-1 h-4 w-4" />
                      Duration
                      {sortField === "duration" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "duration" && <ArrowUpDown className="ml-1 h-4 w-4" />}
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
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service._id)}
                        onChange={(e) => handleSelectService(service._id, e.target.checked)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.agentId.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.agentId.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>${service.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {service.duration ? `${service.duration} min` : "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={service.isActive ? "success" : "destructive"}
                        className="cursor-pointer"
                        onClick={() => handleStatusToggle(service._id, service.isActive)}
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

export default function AdminServices() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminServicesContent />
    </Suspense>
  );
} 
