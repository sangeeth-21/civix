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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Download,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Interface for user data
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profile?: {
    bio?: string;
    avatar?: string;
  };
  stats?: {
    totalBookings: number;
    totalSpent: number;
    averageRating: number;
  };
}

// Interface for pagination
interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Interface for API response
interface UsersResponse {
  data: User[];
  pagination: PaginationData;
}

export default function SuperAdminUsers() {
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  
  // Fetch users data
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ["superAdminUsers", page, limit, search, roleFilter, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder,
      });
      
      const res = await fetch(`/api/super-admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { _id: string; name?: string; email?: string; phone?: string; role?: string; isActive?: boolean; profile?: Record<string, unknown> }) => {
      const res = await fetch(`/api/super-admin/users/${data._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminUsers"] });
      setIsEditUserOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminUsers"] });
      setIsDeleteUserOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });
  
  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, userIds }: { action: string; userIds: string[] }) => {
      const res = await fetch("/api/super-admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userIds }),
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
      queryClient.invalidateQueries({ queryKey: ["superAdminUsers"] });
      setSelectedUsers([]);
      setSelectAll(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Action Failed",
        description: error.message || "Failed to perform bulk action",
        variant: "destructive",
      });
    },
  });
  
  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        search,
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder,
      });
      
      const res = await fetch(`/api/super-admin/users/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export users");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super-admin-users-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Users Exported",
        description: `Users have been exported as ${format.toUpperCase()}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export users. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle impersonation
  const handleImpersonate = async (userId: string) => {
    try {
      const res = await fetch(`/api/super-admin/users/${userId}/impersonate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to impersonate user");
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Impersonation Started",
          description: "You are now impersonating this user.",
          variant: "default",
        });
        // Redirect to user dashboard
        router.push("/user/dashboard");
      }
    } catch (error) {
      toast({
        title: "Impersonation Failed",
        description: "Failed to impersonate user. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }
    
    await bulkActionMutation.mutateAsync({ action, userIds: selectedUsers });
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(usersData?.data?.map((user: User) => user._id) || []);
    } else {
      setSelectedUsers([]);
    }
  };
  
  // Handle select user
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
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
  
  // Get role badge variant
  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "success" | "outline" | "warning"> = {
      USER: "default",
      AGENT: "success",
      ADMIN: "warning",
      SUPER_ADMIN: "destructive",
    };
    return variants[role] || "default";
  };
  
  // Get status badge variant
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? "success" : "destructive";
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
            <CardTitle className="text-destructive">Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load users data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const users = usersData?.data as User[];
  const pagination = usersData?.pagination as PaginationData;
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">Global User Management</Heading>
              <p className="text-muted-foreground">
                Manage all users across the platform with advanced controls
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => router.push("/super-admin/add-user")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
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
                
                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Newest First</SelectItem>
                      <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="lastLogin-desc">Last Login</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <Card className="mb-6 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('activate')}
                      disabled={bulkActionMutation.isPending}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('deactivate')}
                      disabled={bulkActionMutation.isPending}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                      disabled={bulkActionMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({pagination.totalCount})</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => handleSelectUser(user._id, e.target.checked)}
                        className="rounded"
                      />
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile?.avatar} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          <Badge variant={getRoleBadge(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getStatusBadge(user.isActive)}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user.stats && (
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{user.stats.totalBookings} bookings</p>
                          <p>{formatCurrency(user.stats.totalSpent)} spent</p>
                        </div>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsUserDetailsOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsEditUserOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleImpersonate(user._id)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Impersonate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteUserOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} users
                  </p>
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
              )}
            </CardContent>
          </Card>
        </FadeIn>
        
        {/* User Details Dialog */}
        <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.profile?.avatar} alt={selectedUser.name} />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getRoleBadge(selectedUser.role)}>
                        {selectedUser.role.replace('_', ' ')}
                      </Badge>
                      <Badge variant={getStatusBadge(selectedUser.isActive)}>
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label>Last Login</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.lastLogin 
                        ? new Date(selectedUser.lastLogin).toLocaleString()
                        : "Never"
                      }
                    </p>
                  </div>
                  {selectedUser.stats && (
                    <div>
                      <Label>Total Spent</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(selectedUser.stats.totalSpent)}
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedUser.profile?.bio && (
                  <div>
                    <Label>Bio</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.profile.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser(prev => prev ? { ...prev, role: value as "USER" | "AGENT" | "ADMIN" | "SUPER_ADMIN" } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={selectedUser.isActive}
                    onCheckedChange={(checked) => setSelectedUser(prev => prev ? { ...prev, isActive: checked } : null)}
                  />
                  <Label htmlFor="isActive">Active Account</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateUserMutation.mutate(selectedUser)}
                    disabled={updateUserMutation.isPending}
                    className="flex-1"
                  >
                    {updateUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditUserOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Delete User Dialog */}
        <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser._id)}
                disabled={deleteUserMutation.isPending}
                className="flex-1"
              >
                {deleteUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete User
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteUserOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
} 
