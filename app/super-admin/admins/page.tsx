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
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  Activity,
  UserCheck,
  UserX,
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

// Interface for admin data
interface Admin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profile?: {
    bio?: string;
    avatar?: string;
  };
  stats?: {
    totalActions: number;
    lastActionDate?: string;
    loginCount: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AdminsResponse {
  data: Admin[];
  pagination: PaginationData;
}

export default function SuperAdminAdmins() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // State for bulk actions
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for dialogs
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  
  // Fetch admins data
  const { data: adminsData, isLoading, error } = useQuery({
    queryKey: ["superAdminAdmins", page, limit, search, roleFilter, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });
      
      // Only add role and status filters if they're not "all"
      if (roleFilter !== "all") {
        params.append("role", roleFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const res = await fetch(`/api/super-admin/admins?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch admins");
      return res.json();
    },
  });
  
  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/super-admin/admins/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete admin");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin Deleted",
        description: "The admin has been successfully deleted.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminAdmins"] });
      setIsDeleteAdminOpen(false);
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete admin",
        variant: "destructive",
      });
    },
  });
  
  // Toggle admin status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/super-admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update admin status");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Admin status has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminAdmins"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update admin status",
        variant: "destructive",
      });
    },
  });
  
  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      const res = await fetch("/api/super-admin/admins/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
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
      setSelectedAdmins([]);
      setSelectAll(false);
      queryClient.invalidateQueries({ queryKey: ["superAdminAdmins"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Bulk Action Failed",
        description: error instanceof Error ? error.message : "Failed to perform bulk action",
        variant: "destructive",
      });
    },
  });
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedAdmins.length === 0) return;
    
    await bulkActionMutation.mutateAsync({ ids: selectedAdmins, action });
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAdmins(adminsData?.data?.map((admin: Admin) => admin._id) || []);
      setSelectAll(true);
    } else {
      setSelectedAdmins([]);
      setSelectAll(false);
    }
  };
  
  // Handle individual selection
  const handleSelectAdmin = (adminId: string, checked: boolean) => {
    if (checked) {
      setSelectedAdmins(prev => [...prev, adminId]);
    } else {
      setSelectedAdmins(prev => prev.filter(id => id !== adminId));
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
  
  // Get role badge
  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "success" | "outline" | "warning"> = {
      ADMIN: "default",
      SUPER_ADMIN: "destructive",
    };
    
    return (
      <Badge variant={variants[role] || "secondary"}>
        {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
      </Badge>
    );
  };
  
  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "success" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
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
            <CardTitle className="text-destructive">Error Loading Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load admins. Please try again later.</p>
            <Button 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["superAdminAdmins"] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const admins = adminsData?.data || [];
  const pagination = adminsData?.pagination;
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">Admin Management</Heading>
              <p className="text-muted-foreground">
                Manage all administrators across the platform
              </p>
            </div>
            
            <div className="flex gap-2">
              {selectedAdmins.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedAdmins.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkAction("activate")}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Activate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("deactivate")}>
                      <XCircle className="mr-2 h-4 w-4" /> Deactivate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("delete")}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button onClick={() => setIsAddAdminOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
                      onClick={() => handleSortChange("name")}
                      className="flex items-center font-medium px-0"
                    >
                      Admin
                      {sortBy === "name" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("role")}
                      className="flex items-center font-medium px-0"
                    >
                      Role
                      {sortBy === "role" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "role" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("createdAt")}
                      className="flex items-center font-medium px-0"
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Created
                      {sortBy === "createdAt" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "createdAt" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("lastLogin")}
                      className="flex items-center font-medium px-0"
                    >
                      <Activity className="mr-1 h-4 w-4" />
                      Last Login
                      {sortBy === "lastLogin" && (
                        sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortBy !== "lastLogin" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin: Admin) => (
                  <TableRow key={admin._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAdmins.includes(admin._id)}
                        onChange={(e) => handleSelectAdmin(admin._id, e.target.checked)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={admin.profile?.avatar} alt={admin.name} />
                          <AvatarFallback>
                            {getInitials(admin.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                          {admin.phone && (
                            <p className="text-sm text-muted-foreground">{admin.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(admin.role)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(admin.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.lastLogin ? (
                        <div>
                          <p className="font-medium">
                            {new Date(admin.lastLogin).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(admin.lastLogin).toLocaleTimeString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Never</p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={admin.isActive ? "success" : "destructive"}
                        className="cursor-pointer"
                        onClick={() => toggleStatusMutation.mutate({ 
                          id: admin._id, 
                          isActive: !admin.isActive 
                        })}
                      >
                        {admin.isActive ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedAdmin(admin);
                            setIsAdminDetailsOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedAdmin(admin);
                            setIsEditAdminOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedAdmin(admin);
                            setIsDeleteAdminOpen(true);
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
                {pagination.totalCount} admins
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
      <Dialog open={isDeleteAdminOpen} onOpenChange={setIsDeleteAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will delete the admin &quot;{selectedAdmin?.name}&quot;. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAdminOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedAdmin && deleteAdminMutation.mutate(selectedAdmin._id)}
              disabled={deleteAdminMutation.isPending}
            >
              {deleteAdminMutation.isPending && (
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
