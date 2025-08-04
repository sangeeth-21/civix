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
  Calendar,
  User,
  DollarSign,
  Clock,
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
}

// Loading component for Suspense fallback
function BookingsSkeleton() {
  return (
    <div className="container py-10">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

// Main bookings component that uses useSearchParams
function AdminBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Use query to fetch bookings
  const { data: bookings, isLoading, error } = useQuery<{ data: Booking[] }, Error>({
    queryKey: ["adminBookings", statusFilter, dateFilter, agentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      
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
      
      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
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
  
  // Update booking mutation
  const updateBookingMutation = useMutation<Booking, Error, { id: string; data: Partial<Booking> }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Booking> }) => {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update booking");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Updated",
        description: "Booking has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete booking");
    },
    onSuccess: () => {
      toast({
        title: "Booking Deleted",
        description: "Booking has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send confirmation mutation
  const sendConfirmationMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/bookings/${id}/send-confirmation`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to send confirmation");
    },
    onSuccess: () => {
      toast({
        title: "Confirmation Sent",
        description: "Booking confirmation has been sent successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Bulk status update mutation
  const bulkUpdateMutation = useMutation<void, Error, { ids: string[]; status: string }>({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await fetch("/api/admin/bookings/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) throw new Error("Failed to update bookings");
    },
    onSuccess: () => {
      toast({
        title: "Bookings Updated",
        description: `${selectedBookings.length} bookings have been updated successfully.`,
        variant: "default",
      });
      setSelectedBookings([]);
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter bookings based on search query
  const filteredBookings = bookings?.data?.filter((booking: Booking) => {
    return (
      booking.serviceId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.agentId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];
  
  // Define allowed string fields for sorting
  const stringFields: Array<keyof Booking> = [
    "status", "notes", "agentNotes"
  ];

  // Sort data based on current sort field and direction
  const sortedBookings = bookings?.data ? [...bookings.data].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    if (sortField === "scheduledDate" || sortField === "createdAt" || sortField === "updatedAt") {
      const aDate = a[sortField as keyof Booking];
      const bDate = b[sortField as keyof Booking];
      aValue = typeof aDate === 'string' ? new Date(aDate).toISOString() : "";
      bValue = typeof bDate === 'string' ? new Date(bDate).toISOString() : "";
    } else if (stringFields.includes(sortField as keyof Booking)) {
      aValue = String(a[sortField as keyof Booking] ?? "").toLowerCase();
      bValue = String(b[sortField as keyof Booking] ?? "").toLowerCase();
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
  
  // Handle booking deletion
  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete action
  const confirmDelete = () => {
    if (bookingToDelete) {
      deleteBookingMutation.mutate(bookingToDelete._id);
    }
  };
  
  // Handle status update
  const handleStatusUpdate = (id: string, newStatus: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") => {
    updateBookingMutation.mutate({ id, data: { status: newStatus } });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteBookingMutation.mutate(id);
  };

  // Handle send confirmation
  const handleSendConfirmation = (id: string) => {
    sendConfirmationMutation.mutate(id);
  };
  
  // Handle bulk status update
  const handleBulkStatusUpdate = (status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") => {
    // Implementation for bulk status update
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    // Implementation for bulk delete
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(sortedBookings.map(b => b._id));
    } else {
      setSelectedBookings([]);
    }
  };
  
  // Handle individual selection
  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    }
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ["adminBookings"] })}
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
              <Heading level="h1" className="mb-2">Bookings Management</Heading>
              <p className="text-muted-foreground">
                Manage all bookings across the platform
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
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("CONFIRMED")}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Confirm Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("COMPLETED")}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("CANCELLED")}>
                      <XCircle className="mr-2 h-4 w-4" /> Cancel Selected
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
                placeholder="Search bookings..."
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
                      checked={selectedBookings.length === sortedBookings.length && sortedBookings.length > 0}
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
                      {sortField === "serviceId.title" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "serviceId.title" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("userId.name")}
                      className="flex items-center font-medium px-0"
                    >
                      Customer
                      {sortField === "userId.name" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "userId.name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("agentId.name")}
                      className="flex items-center font-medium px-0"
                    >
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
                      onClick={() => handleSortChange("scheduledDate")}
                      className="flex items-center font-medium px-0"
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Date
                      {sortField === "scheduledDate" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "scheduledDate" && <ArrowUpDown className="ml-1 h-4 w-4" />}
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
                      {sortField === "totalAmount" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "totalAmount" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBookings.map((booking: Booking) => (
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
                    </TableCell>
                    <TableCell>
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
                    <TableCell>${booking.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(booking.status)}
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
                            <Link href={`/user/bookings/${booking._id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(booking._id, "CONFIRMED")}
                            disabled={booking.status === "CONFIRMED"}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(booking._id, "COMPLETED")}
                            disabled={booking.status === "COMPLETED"}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(booking._id, "CANCELLED")}
                            disabled={booking.status === "CANCELLED"}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteBooking(booking)}>
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
              This will delete the booking for &quot;{bookingToDelete?.serviceId.title}&quot;. 
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

// Main export function with Suspense boundary
export default function AdminBookings() {
  return (
    <Suspense fallback={<BookingsSkeleton />}>
      <AdminBookingsContent />
    </Suspense>
  );
} 
