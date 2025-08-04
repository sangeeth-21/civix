"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  Tag,
  DollarSign,
  Calendar,
  Star,
  User,
  Settings,
  Download,
  BarChart3,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import Image from "next/image";

// Interface for service data
interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentAvatar?: string;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  totalBookings: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  images: string[];
  requirements: string[];
  included: string[];
  excluded: string[];
}

// Interface for service stats
interface ServiceStats {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  featuredServices: number;
  totalRevenue: number;
  averageRating: number;
  topCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  topAgents: Array<{
    _id: string;
    name: string;
    email: string;
    servicesCount: number;
    totalRevenue: number;
    avatar?: string;
  }>;
}

export default function SuperAdminServices() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // State for bulk actions
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for dialogs
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isDeleteServiceOpen, setIsDeleteServiceOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  
  // Fetch services data
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ["superAdminServices", page, limit, search, categoryFilter, statusFilter, agentFilter, priceRange, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });
      
      // Only add filters if they're not "all"
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (agentFilter !== "all") {
        params.append("agentId", agentFilter);
      }
      if (priceRange !== "all") {
        params.append("priceRange", priceRange);
      }
      
      const res = await fetch(`/api/super-admin/services?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  // Fetch service stats
  const { data: statsData } = useQuery({
    queryKey: ["superAdminServiceStats"],
    queryFn: async () => {
      const res = await fetch("/api/super-admin/services/stats");
      if (!res.ok) throw new Error("Failed to fetch service stats");
      return res.json();
    },
  });

  // Mutations
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const res = await fetch(`/api/super-admin/services/${serviceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminServices"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminServiceStats"] });
      toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully.",
        variant: "default",
      });
      setIsDeleteServiceOpen(false);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete service.",
        variant: "destructive",
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, serviceIds }: { action: string; serviceIds: string[] }) => {
      const res = await fetch("/api/super-admin/services/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, serviceIds }),
      });
      if (!res.ok) throw new Error("Failed to perform bulk action");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["superAdminServices"] });
      queryClient.invalidateQueries({ queryKey: ["superAdminServiceStats"] });
      setSelectedServices([]);
      setSelectAll(false);
      toast({
        title: "Bulk Action Completed",
        description: `${variables.action} completed for ${variables.serviceIds.length} services.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Action Failed",
        description: error.message || "Failed to perform bulk action.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedServices.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select services to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }
    bulkActionMutation.mutate({ action, serviceIds: selectedServices });
  };

  // Handle service selection
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedServices([]);
      setSelectAll(false);
    } else {
      const allServiceIds = servicesData?.data?.map((service: Service) => service._id) || [];
      setSelectedServices(allServiceIds);
      setSelectAll(true);
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      params.append("search", search);
      params.append("category", categoryFilter);
      params.append("status", statusFilter);
      
      const res = await fetch(`/api/super-admin/services/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export services");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super-admin-services-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Services Exported",
        description: `Services have been exported as ${format.toUpperCase()}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export services. Please try again.",
        variant: "destructive",
      });
    }
  };

  const services = servicesData?.data || [];
  const stats = statsData?.data || {
    totalServices: 0,
    activeServices: 0,
    inactiveServices: 0,
    featuredServices: 0,
    totalRevenue: 0,
    averageRating: 0,
    topCategories: [],
    topAgents: [],
  };

  if (error) {
    return (
      <div className="container p-6 md:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Services</h2>
            <p className="text-muted-foreground">Failed to load services. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container p-6 md:p-10">
        <FadeIn delay={0.1}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">Services Management</Heading>
              <p className="text-muted-foreground">Manage all services across the platform</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={() => setIsAddServiceOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalServices}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeServices} active, {stats.inactiveServices} inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured Services</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.featuredServices}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.featuredServices / stats.totalServices) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Average: ${(stats.totalRevenue / stats.totalServices).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Out of 5 stars
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search services..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All prices</SelectItem>
                      <SelectItem value="0-50">$0 - $50</SelectItem>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="100-200">$100 - $200</SelectItem>
                      <SelectItem value="200+">$200+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedServices.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedServices.length} service(s) selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("activate")}
                      disabled={bulkActionMutation.isPending}
                    >
                      {bulkActionMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("deactivate")}
                      disabled={bulkActionMutation.isPending}
                    >
                      {bulkActionMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("delete")}
                      disabled={bulkActionMutation.isPending}
                    >
                      {bulkActionMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Manage all services in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service: Service) => (
                        <TableRow key={service._id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service._id)}
                              onChange={() => handleServiceSelect(service._id)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {service.images && service.images.length > 0 ? (
                                  <Image
                                    src={service.images[0]}
                                    alt={service.title}
                                    width={40}
                                    height={40}
                                    className="rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Tag className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{service.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {service.description.substring(0, 50)}...
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={service.agentAvatar} />
                                <AvatarFallback>
                                  {service.agentName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{service.agentName}</div>
                                <div className="text-sm text-muted-foreground">{service.agentEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{service.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${service.price}</div>
                            <div className="text-sm text-muted-foreground">{service.duration} min</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={service.isActive ? "default" : "secondary"}>
                              {service.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {service.isFeatured && (
                              <Badge variant="outline" className="ml-1">
                                Featured
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-medium">{service.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{service.totalBookings}</div>
                            <div className="text-sm text-muted-foreground">
                              ${service.totalRevenue.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(service.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedService(service);
                                  setIsServiceDetailsOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedService(service);
                                  setIsEditServiceOpen(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Service
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedService(service);
                                  setIsDeleteServiceOpen(true);
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Service
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {servicesData?.pagination && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {((servicesData.pagination.page - 1) * servicesData.pagination.limit) + 1} to{" "}
                        {Math.min(servicesData.pagination.page * servicesData.pagination.limit, servicesData.pagination.totalCount)} of{" "}
                        {servicesData.pagination.totalCount} services
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={!servicesData.pagination.hasPrevPage}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={!servicesData.pagination.hasNextPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Service Details Dialog */}
        <Dialog open={isServiceDetailsOpen} onOpenChange={setIsServiceDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Service Details</DialogTitle>
              <DialogDescription>
                Detailed information about the service
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    <p className="text-sm">{selectedService.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">{selectedService.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price</Label>
                    <p className="text-sm">${selectedService.price}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-sm">{selectedService.duration} minutes</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Rating</Label>
                    <p className="text-sm">{selectedService.rating.toFixed(1)} / 5</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Bookings</Label>
                    <p className="text-sm">{selectedService.totalBookings}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{selectedService.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedService.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteServiceOpen} onOpenChange={setIsDeleteServiceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Service</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this service? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteServiceOpen(false)}
                disabled={deleteServiceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedService && deleteServiceMutation.mutate(selectedService._id)}
                disabled={deleteServiceMutation.isPending}
              >
                {deleteServiceMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
} 
