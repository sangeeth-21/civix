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
  Calendar,
  User,
  DollarSign,
  Clock,
  Download,
  BarChart3,
  TrendingUp,
  TrendingDown,
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
import Link from "next/link";

// Interface for booking data
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

interface Agent {
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
  agentId: Agent;
  notes?: string;
  agentNotes?: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  paymentStatus?: "PENDING" | "PAID" | "REFUNDED";
  rating?: number;
  review?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BookingsResponse {
  data: Booking[];
  pagination: PaginationData;
}

export default function SuperAdminBookings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // State for bulk actions
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for dialogs
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
  const [isDeleteBookingOpen, setIsDeleteBookingOpen] = useState(false);
  
  // Fetch bookings data
  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ["superAdminBookings", page, limit, search, statusFilter, dateFilter, agentFilter, paymentFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });
      
      // Only add filters if they're not "all"
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (dateFilter !== "all") {
        params.append("dateFilter", dateFilter);
      }
      if (agentFilter !== "all") {
        params.append("agentId", agentFilter);
      }
      if (paymentFilter !== "all") {
        params.append("paymentStatus", paymentFilter);
      }
      
      const res = await fetch(`/api/super-admin/bookings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });
  
  // Fetch agents for filter
  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/super-admin/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    }
  });
  
  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/super-admin/bookings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete booking");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Deleted",
        description: "The booking has been successfully deleted.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminBookings"] });
      setIsDeleteBookingOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });
  
  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/super-admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update booking status");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminBookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });
  
  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, action, value }: { ids: string[]; action: string; value?: string }) => {
      const res = await fetch("/api/super-admin/bookings/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, value }),
      });
      if (!res.ok) throw new Error("Failed to perform bulk action");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bulk Action Completed",
        description: "Bulk action has been completed successfully.",
        variant: "default",
      });
      setSelectedBookings([]);
      setSelectAll(false);
      queryClient.invalidateQueries({ queryKey: ["superAdminBookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Action Failed",
        description: error.message || "Failed to perform bulk action",
        variant: "destructive",
      });
    },
  });
  
  // Handle bulk actions
  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedBookings.length === 0) return;
    
    await bulkActionMutation.mutateAsync({ ids: selectedBookings, action, value });
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(bookingsData?.data?.map((booking: Booking) => booking._id) || []);
      setSelectAll(true);
    } else {
      setSelectedBookings([]);
      setSelectAll(false);
    }
  };
  
  // Handle individual selection
  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
      setSelectAll(false);
    }
  };
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "success" | "outline" | "warning"> = {
      PENDING: "secondary",
      CONFIRMED: "default",
      COMPLETED: "success",
      CANCELLED: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };
  
  // Get payment status badge
  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    
    const variants: Record<string, "default" | "destructive" | "secondary" | "success" | "outline" | "warning"> = {
      PENDING: "warning",
      PAID: "success",
      REFUNDED: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
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
            <CardTitle className="text-destructive">Error Loading Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load bookings. Please try again later.</p>
            <Button 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["superAdminBookings"] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const bookings = bookingsData?.data || [];
  const pagination = bookingsData?.pagination;
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">Global Bookings Management</Heading>
              <p className="text-muted-foreground">
                Oversee all bookings across the entire platform
              </p>
            </div>
            
            <div className="flex gap-2">
              {selectedBookings.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedBookings.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkAction("status", "CONFIRMED")}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Confirm Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("status", "COMPLETED")}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("status", "CANCELLED")}>
                      <XCircle className="mr-2 h-4 w-4" /> Cancel Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("delete")}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction("export", "csv")}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("export", "excel")}>
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("export", "pdf")}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
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
              
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
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
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead className="w-[300px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("serviceId.title")}
                      className="flex items-center font-medium px-0"
                    >
                      Service
                      {sortBy === "serviceId.title" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "serviceId.title" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("userId.name")}
                      className="flex items-center font-medium px-0"
                    >
                      Customer
                      {sortBy === "userId.name" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "userId.name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("agentId.name")}
                      className="flex items-center font-medium px-0"
                    >
                      Agent
                      {sortBy === "agentId.name" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "agentId.name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("scheduledDate")}
                      className="flex items-center font-medium px-0"
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Date
                      {sortBy === "scheduledDate" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "scheduledDate" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("totalAmount")}
                      className="flex items-center font-medium px-0"
                    >
                      <DollarSign className="mr-1 h-4 w-4" />
                      Amount
                      {sortBy === "totalAmount" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "totalAmount" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: Booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking._id)}
                        onChange={(e) => handleSelectBooking(booking._id, e.target.checked)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.serviceId.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.serviceId.category}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" alt={booking.userId.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(booking.userId.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{booking.userId.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.userId.email}
                          </p>
                          {booking.userId.phone && (
                            <p className="text-sm text-muted-foreground">
                              📞 {booking.userId.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" alt={booking.agentId.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(booking.agentId.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{booking.agentId.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.agentId.email}
                          </p>
                          {booking.agentId.phone && (
                            <p className="text-sm text-muted-foreground">
                              📞 {booking.agentId.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.scheduledDate).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
                        {booking.rating && (
                          <p className="text-sm text-muted-foreground">
                            {booking.rating} ⭐
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getPaymentStatusBadge(booking.paymentStatus)}
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedBooking(booking);
                            setIsBookingDetailsOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedBooking(booking);
                            setIsEditBookingOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              id: booking._id, 
                              status: "CONFIRMED" 
                            })}
                            disabled={booking.status === "CONFIRMED"}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              id: booking._id, 
                              status: "COMPLETED" 
                            })}
                            disabled={booking.status === "COMPLETED"}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              id: booking._id, 
                              status: "CANCELLED" 
                            })}
                            disabled={booking.status === "CANCELLED"}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedBooking(booking);
                            setIsDeleteBookingOpen(true);
                          }}>
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
        
        {/* Pagination */}
        {pagination && (
          <FadeIn delay={0.3}>
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} bookings
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteBookingOpen} onOpenChange={setIsDeleteBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will delete the booking for &quot;{selectedBooking?.serviceId.title}&quot;. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteBookingOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedBooking && deleteBookingMutation.mutate(selectedBooking._id)}
              disabled={deleteBookingMutation.isPending}
            >
              {deleteBookingMutation.isPending && (
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
