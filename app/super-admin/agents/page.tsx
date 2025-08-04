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
  Star,
  TrendingUp,
  DollarSign,
  Award,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

// Interface for agent data
interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "AGENT" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profile?: {
    bio?: string;
    avatar?: string;
    skills?: string[];
    experience?: number;
    specializations?: string[];
  };
  performance?: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageRating: number;
    responseTime: number;
    completionRate: number;
  };
  services?: Array<{
    _id: string;
    title: string;
    price: number;
    isActive: boolean;
  }>;
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
interface AgentsResponse {
  data: Agent[];
  pagination: PaginationData;
}

export default function SuperAdminAgents() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // State for bulk actions
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for dialogs
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDetailsOpen, setIsAgentDetailsOpen] = useState(false);
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);
  const [isDeleteAgentOpen, setIsDeleteAgentOpen] = useState(false);
  
  // Fetch agents data
  const { data: agentsData, isLoading, error } = useQuery({
    queryKey: ["superAdminAgents", page, limit, search, roleFilter, statusFilter, performanceFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });
      
      // Only add filters if they're not "all"
      if (roleFilter !== "all") {
        params.append("role", roleFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (performanceFilter !== "all") {
        params.append("performance", performanceFilter);
      }
      
      const res = await fetch(`/api/super-admin/agents?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });
  
  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async (data: { _id: string; name?: string; email?: string; phone?: string; role?: string; isActive?: boolean; profile?: Record<string, unknown> }) => {
      const res = await fetch(`/api/super-admin/agents/${data._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "Agent has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminAgents"] });
      setIsEditAgentOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update agent",
        variant: "destructive",
      });
    },
  });
  
  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`/api/super-admin/agents/${agentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete agent");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Deleted",
        description: "Agent has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["superAdminAgents"] });
      setIsDeleteAgentOpen(false);
      setSelectedAgent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete agent",
        variant: "destructive",
      });
    },
  });
  
  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, agentIds }: { action: string; agentIds: string[] }) => {
      const res = await fetch("/api/super-admin/agents/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, agentIds }),
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
      queryClient.invalidateQueries({ queryKey: ["superAdminAgents"] });
      setSelectedAgents([]);
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
        role: roleFilter,
        status: statusFilter,
        performance: performanceFilter,
        sortBy,
        sortOrder,
      });
      
      const res = await fetch(`/api/super-admin/agents/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export agents");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super-admin-agents-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Agents Exported",
        description: `Agents have been exported as ${format.toUpperCase()}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export agents. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle impersonation
  const handleImpersonate = async (agentId: string) => {
    try {
      const res = await fetch(`/api/super-admin/agents/${agentId}/impersonate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to impersonate agent");
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Impersonation Started",
          description: "You are now impersonating this agent.",
          variant: "default",
        });
        // Redirect to agent dashboard
        router.push("/agent/dashboard");
      }
    } catch (error) {
      toast({
        title: "Impersonation Failed",
        description: "Failed to impersonate agent. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedAgents.length === 0) {
      toast({
        title: "No Agents Selected",
        description: "Please select agents to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }
    
    await bulkActionMutation.mutateAsync({ action, agentIds: selectedAgents });
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedAgents(agentsData?.data?.map((agent: Agent) => agent._id) || []);
    } else {
      setSelectedAgents([]);
    }
  };
  
  // Handle select agent
  const handleSelectAgent = (agentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAgents(prev => [...prev, agentId]);
    } else {
      setSelectedAgents(prev => prev.filter(id => id !== agentId));
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
      AGENT: "success",
      ADMIN: "warning",
    };
    return variants[role] || "default";
  };
  
  // Get status badge variant
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? "success" : "destructive";
  };
  
  // Get performance badge variant
  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return "success";
    if (rating >= 4.0) return "default";
    if (rating >= 3.5) return "warning";
    return "destructive";
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
            <CardTitle className="text-destructive">Error Loading Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load agents data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const agents = agentsData?.data as Agent[];
  const pagination = agentsData?.pagination as PaginationData;
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">Global Agent Management</Heading>
              <p className="text-muted-foreground">
                Manage all agents across the platform with performance insights
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => router.push("/super-admin/add-user")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Agent
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
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <Label htmlFor="search">Search Agents</Label>
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
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
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
                  <Label htmlFor="performance">Performance</Label>
                  <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All performance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All performance</SelectItem>
                      <SelectItem value="top">Top Performers (4.5+ rating)</SelectItem>
                      <SelectItem value="good">Good (4.0-4.4 rating)</SelectItem>
                      <SelectItem value="average">Average (3.5-3.9 rating)</SelectItem>
                      <SelectItem value="poor">Poor (&lt;3.5 rating)</SelectItem>
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
                      <SelectItem value="performance-desc">Best Performance</SelectItem>
                      <SelectItem value="revenue-desc">Highest Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bulk Actions */}
          {selectedAgents.length > 0 && (
            <Card className="mb-6 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedAgents.length} agent{selectedAgents.length !== 1 ? 's' : ''} selected
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
                      onClick={() => handleBulkAction('promote')}
                      disabled={bulkActionMutation.isPending}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Promote to Admin
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
          
          {/* Agents Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent._id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent._id)}
                        onChange={(e) => handleSelectAgent(agent._id, e.target.checked)}
                        className="rounded"
                      />
                      
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={agent.profile?.avatar} alt={agent.name} />
                        <AvatarFallback>
                          {getInitials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">{agent.email}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant={getRoleBadge(agent.role)}>
                            {agent.role}
                          </Badge>
                          <Badge variant={getStatusBadge(agent.isActive)}>
                            {agent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedAgent(agent);
                          setIsAgentDetailsOpen(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedAgent(agent);
                          setIsEditAgentOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleImpersonate(agent._id)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedAgent(agent);
                            setIsDeleteAgentOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Agent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  {agent.performance && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {agent.performance.averageRating.toFixed(1)}
                          </span>
                          <Badge variant={getPerformanceBadge(agent.performance.averageRating)}>
                            {agent.performance.averageRating >= 4.5 ? "Top" : 
                             agent.performance.averageRating >= 4.0 ? "Good" : 
                             agent.performance.averageRating >= 3.5 ? "Average" : "Poor"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Completion Rate</span>
                          <span className="font-medium">
                            {agent.performance.completionRate.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={agent.performance.completionRate} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Bookings</p>
                          <p className="font-medium">{formatNumber(agent.performance.totalBookings)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-medium">{formatCurrency(agent.performance.totalRevenue)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Services */}
                  {agent.services && agent.services.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Active Services</p>
                      <div className="space-y-1">
                        {agent.services.slice(0, 3).map((service) => (
                          <div key={service._id} className="flex items-center justify-between text-sm">
                            <span className="truncate">{service.title}</span>
                            <span className="font-medium">{formatCurrency(service.price)}</span>
                          </div>
                        ))}
                        {agent.services.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{agent.services.length - 3} more services
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Skills */}
                  {agent.profile?.skills && agent.profile.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.profile.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                        {agent.profile.skills.length > 3 && (
                          <Badge variant="outline">
                            +{agent.profile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Member since {new Date(agent.createdAt).toLocaleDateString()}</span>
                    {agent.lastLogin && (
                      <span>Last login {new Date(agent.lastLogin).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} agents
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
        </FadeIn>
        
        {/* Agent Details Dialog */}
        <Dialog open={isAgentDetailsOpen} onOpenChange={setIsAgentDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Agent Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedAgent?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedAgent.profile?.avatar} alt={selectedAgent.name} />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedAgent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedAgent.name}</h3>
                    <p className="text-muted-foreground">{selectedAgent.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getRoleBadge(selectedAgent.role)}>
                        {selectedAgent.role}
                      </Badge>
                      <Badge variant={getStatusBadge(selectedAgent.isActive)}>
                        {selectedAgent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Performance Metrics */}
                {selectedAgent.performance && (
                  <div>
                    <h4 className="font-semibold mb-3">Performance Metrics</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Average Rating</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">
                                {selectedAgent.performance.averageRating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={(selectedAgent.performance.averageRating / 5) * 100} 
                            className="mt-2" 
                          />
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Completion Rate</span>
                            <span className="font-semibold">
                              {selectedAgent.performance.completionRate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={selectedAgent.performance.completionRate} className="mt-2" />
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Total Bookings</span>
                              <span className="font-semibold">{formatNumber(selectedAgent.performance.totalBookings)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Completed</span>
                              <span className="text-green-600">{formatNumber(selectedAgent.performance.completedBookings)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Cancelled</span>
                              <span className="text-red-600">{formatNumber(selectedAgent.performance.cancelledBookings)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Total Revenue</span>
                              <span className="font-semibold">{formatCurrency(selectedAgent.performance.totalRevenue)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Response Time</span>
                              <span className="font-semibold">{selectedAgent.performance.responseTime}min</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                
                {/* Services */}
                {selectedAgent.services && selectedAgent.services.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Services ({selectedAgent.services.length})</h4>
                    <div className="space-y-2">
                      {selectedAgent.services.map((service) => (
                        <div key={service._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{service.title}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(service.price)}</p>
                          </div>
                          <Badge variant={service.isActive ? "success" : "destructive"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Skills and Experience */}
                {selectedAgent.profile && (
                  <div>
                    <h4 className="font-semibold mb-3">Profile Information</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedAgent.profile.experience && (
                        <div>
                          <Label>Experience</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedAgent.profile.experience} years
                          </p>
                        </div>
                      )}
                      
                      {selectedAgent.profile.skills && selectedAgent.profile.skills.length > 0 && (
                        <div>
                          <Label>Skills</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedAgent.profile.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedAgent.profile.specializations && selectedAgent.profile.specializations.length > 0 && (
                        <div>
                          <Label>Specializations</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedAgent.profile.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedAgent.profile.bio && (
                        <div className="md:col-span-2">
                          <Label>Bio</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedAgent.profile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Edit Agent Dialog */}
        <Dialog open={isEditAgentOpen} onOpenChange={setIsEditAgentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update agent information and permissions
              </DialogDescription>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={selectedAgent.name}
                    onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedAgent.email}
                    onChange={(e) => setSelectedAgent(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={selectedAgent.role}
                    onValueChange={(value) => setSelectedAgent(prev => prev ? { ...prev, role: value as "AGENT" | "ADMIN" } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={selectedAgent.isActive}
                    onCheckedChange={(checked) => setSelectedAgent(prev => prev ? { ...prev, isActive: checked } : null)}
                  />
                  <Label htmlFor="isActive">Active Account</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateAgentMutation.mutate(selectedAgent)}
                    disabled={updateAgentMutation.isPending}
                    className="flex-1"
                  >
                    {updateAgentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Agent
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditAgentOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Delete Agent Dialog */}
        <Dialog open={isDeleteAgentOpen} onOpenChange={setIsDeleteAgentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Agent</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedAgent?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => selectedAgent && deleteAgentMutation.mutate(selectedAgent._id)}
                disabled={deleteAgentMutation.isPending}
                className="flex-1"
              >
                {deleteAgentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Agent
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteAgentOpen(false)}
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
