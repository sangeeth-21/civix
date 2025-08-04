"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Heading } from "@/components/ui/heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Package,
  Clock,
  Loader2,
  UserCircle,
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

// Define interfaces
interface Booking {
  _id: string;
  status: string;
  scheduledDate: string;
  serviceId: {
    _id: string;
    title: string;
    price: number;
    category: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bookings: Booking[];
  totalSpent: number;
  bookingsCount: number;
  lastBookingDate: string;
}

export default function AgentUsers() {
  const router = useRouter();
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<string>("lastBookingDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState<boolean>(false);
  
  // Real data from API
  const { data: usersData, isLoading, error } = useQuery<{ data: User[] }>({
    queryKey: ['agentClients'],
    queryFn: async () => {
      const response = await fetch("/api/agents/users");
      if (!response.ok) {
        throw new Error("Failed to fetch agent clients");
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Get unique service categories for filter
  const allServices = usersData?.data.flatMap((user: User) => 
    user.bookings.map((booking) => booking.serviceId.category)
  ) || [];
  const uniqueServices = Array.from(new Set(allServices));
  
  // Filter users based on search query and service category
  const filteredUsers = usersData?.data.filter((user: User) => {
    // Search filter
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Service filter
    if (serviceFilter !== "all") {
      return user.bookings.some(booking => booking.serviceId.category === serviceFilter);
    }
    
    return true;
  }) || [];
  
  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue;
    
    if (sortField === "name") {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortField === "email") {
      aValue = a.email.toLowerCase();
      bValue = b.email.toLowerCase();
    } else if (sortField === "lastBookingDate") {
      aValue = new Date(a.lastBookingDate).getTime();
      bValue = new Date(b.lastBookingDate).getTime();
    } else if (sortField === "bookingsCount") {
      aValue = a.bookingsCount;
      bValue = b.bookingsCount;
    } else if (sortField === "totalSpent") {
      aValue = a.totalSpent;
      bValue = b.totalSpent;
    } else {
      aValue = a[sortField as keyof User];
      bValue = b[sortField as keyof User];
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
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Open user detail dialog
  const openUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
            <CardTitle className="text-destructive">Error Loading Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load client data. Please try again later.</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
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
              <Heading level="h1" className="mb-2">My Clients</Heading>
              <p className="text-muted-foreground">
                View and manage clients who have booked your services
              </p>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {uniqueServices.map((service) => (
                  <SelectItem key={service} value={service as string}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          {sortedUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">No clients found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || serviceFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "You don&apos;t have any clients yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSortChange("name")}
                          className="flex items-center font-medium px-0"
                        >
                          Client
                          {sortField === "name" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                          {sortField !== "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSortChange("bookingsCount")}
                          className="flex items-center font-medium px-0"
                        >
                          Bookings
                          {sortField === "bookingsCount" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                          {sortField !== "bookingsCount" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSortChange("totalSpent")}
                          className="flex items-center font-medium px-0"
                        >
                          Total Spent
                          {sortField === "totalSpent" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                          {sortField !== "totalSpent" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSortChange("lastBookingDate")}
                          className="flex items-center font-medium px-0"
                        >
                          Last Booking
                          {sortField === "lastBookingDate" && (
                            sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                          )}
                          {sortField !== "lastBookingDate" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground hidden md:block">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col space-y-1">
                            <span className="flex items-center text-sm">
                              <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center text-sm">
                                <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {user.bookingsCount}
                          </div>
                        </TableCell>
                        <TableCell>${user.totalSpent.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(user.lastBookingDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUserDialog(user)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </div>
      
      {/* User Detail Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Viewing detailed information about this client
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.name)}`} 
                    alt={selectedUser.name} 
                  />
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                  <div className="flex flex-col mt-1">
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-3.5 w-3.5" />
                      {selectedUser.email}
                    </span>
                    {selectedUser.phone && (
                      <span className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-3.5 w-3.5" />
                        {selectedUser.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Calendar className="mx-auto h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium">Total Bookings</p>
                      <p className="text-2xl font-bold">{selectedUser.bookingsCount}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Package className="mx-auto h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium">Total Spent</p>
                      <p className="text-2xl font-bold">${selectedUser.totalSpent.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium">Last Booking</p>
                      <p className="text-lg font-bold">
                        {new Date(selectedUser.lastBookingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Booking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedUser.bookings.length === 0 ? (
                      <p className="text-center text-muted-foreground">No bookings found</p>
                    ) : (
                      selectedUser.bookings.map((booking) => (
                        <div key={booking._id} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{booking.serviceId.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.scheduledDate).toLocaleDateString()} at{" "}
                              {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${booking.serviceId.price.toFixed(2)}</p>
                            <Badge
                              variant={
                                booking.status === "COMPLETED" ? "success" :
                                booking.status === "CANCELLED" ? "destructive" :
                                booking.status === "CONFIRMED" ? "default" :
                                "outline"
                              }
                              className="mt-1"
                            >
                              {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Close</Button>
            <Button asChild>
              <Link href={`/agent/users/${selectedUser?._id}`}>Full Profile</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
} 
