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
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  DollarSign,
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

// Interface for agent data
interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  skills?: string[];
  experience?: number;
  rating?: number;
  bio?: string;
  specializations?: string[];
  createdAt: string;
  lastLogin?: string;
  servicesCount?: number;
  bookingsCount?: number;
  totalRevenue?: number;
}

function AdminAgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Use query to fetch agents
  const { data: agents, isLoading, error } = useQuery<{ data: Agent[] }, Error>({
    queryKey: ["adminAgents", statusFilter, experienceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Only add filters if they're not "all"
      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }
      if (experienceFilter !== "all") {
        params.append("experience", experienceFilter);
      }
      
      const res = await fetch(`/api/admin/agents?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    }
  });
  
  // Toggle agent status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update agent status");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "The agent status has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/agents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete agent");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Deleted",
        description: "The agent has been successfully deleted.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      setIsDeleteDialogOpen(false);
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
      const res = await fetch("/api/admin/agents/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, isActive }),
      });
      if (!res.ok) throw new Error("Failed to update agents");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agents Updated",
        description: `${selectedAgents.length} agents have been updated successfully.`,
        variant: "default",
      });
      setSelectedAgents([]);
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter agents based on search query
  const filteredAgents = agents?.data?.filter((agent: Agent) => {
    return (
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      agent.specializations?.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }) || [];
  
  // Define allowed string fields for sorting
  const stringFields: Array<keyof Agent> = [
    "name", "email", "phone", "role", "bio"
  ];

  // Handle sorting
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort data based on current sort field and direction
  const sortedAgents = agents?.data ? [...agents.data].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    if (sortField === "createdAt" || sortField === "lastLogin") {
      const aDate = a[sortField as keyof Agent];
      const bDate = b[sortField as keyof Agent];
      aValue = typeof aDate === 'string' ? new Date(aDate).toISOString() : "";
      bValue = typeof bDate === 'string' ? new Date(bDate).toISOString() : "";
    } else if (stringFields.includes(sortField as keyof Agent)) {
      aValue = String(a[sortField as keyof Agent] ?? "").toLowerCase();
      bValue = String(b[sortField as keyof Agent] ?? "").toLowerCase();
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
  
  // Handle agent deletion
  const handleDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete action
  const confirmDelete = () => {
    if (agentToDelete) {
      deleteAgentMutation.mutate(agentToDelete._id);
    }
  };
  
  // Handle status toggle
  const handleStatusToggle = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };
  
  // Handle bulk status update
  const handleBulkStatusUpdate = (isActive: boolean) => {
    if (selectedAgents.length > 0) {
      bulkUpdateMutation.mutate({ ids: selectedAgents, isActive });
    }
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAgents(sortedAgents.map(a => a._id));
    } else {
      setSelectedAgents([]);
    }
  };
  
  // Handle individual selection
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
  
  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "success" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };
  
  // Get rating display
  const getRatingDisplay = (rating?: number) => {
    if (!rating) return "N/A";
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span>{rating.toFixed(1)}</span>
      </div>
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
            <CardTitle className="text-destructive">Error Loading Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load agents. Please try again later.</p>
            <Button 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["adminAgents"] })}
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
              <Heading level="h1" className="mb-2">Agents Management</Heading>
              <p className="text-muted-foreground">
                Manage all service agents across the platform
              </p>
            </div>
            
            <div className="flex gap-2">
              {selectedAgents.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedAgents.length})
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
                placeholder="Search agents..."
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
              
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Experience</SelectItem>
                  <SelectItem value="0-2">0-2 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
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
                      checked={selectedAgents.length === sortedAgents.length && sortedAgents.length > 0}
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
                      <User className="mr-1 h-4 w-4" />
                      Agent
                      {sortField === "name" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("rating")}
                      className="flex items-center font-medium px-0"
                    >
                      <Star className="mr-1 h-4 w-4" />
                      Rating
                      {sortField === "rating" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "rating" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("experience")}
                      className="flex items-center font-medium px-0"
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Experience
                      {sortField === "experience" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "experience" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSortChange("servicesCount")}
                      className="flex items-center font-medium px-0"
                    >
                      Services
                      {sortField === "servicesCount" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                      {sortField !== "servicesCount" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </Button>
                  </TableHead>
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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAgents.map((agent: Agent) => (
                  <TableRow key={agent._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent._id)}
                        onChange={(e) => handleSelectAgent(agent._id, e.target.checked)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" alt={agent.name} />
                          <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.email}
                          </p>
                          {agent.phone && (
                            <p className="text-sm text-muted-foreground">
                              {agent.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRatingDisplay(agent.rating)}</TableCell>
                    <TableCell>
                      {agent.experience ? `${agent.experience} years` : "N/A"}
                    </TableCell>
                    <TableCell>{agent.servicesCount || 0}</TableCell>
                    <TableCell>{agent.bookingsCount || 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={agent.isActive ? "success" : "destructive"}
                        className="cursor-pointer"
                        onClick={() => handleStatusToggle(agent._id, agent.isActive)}
                      >
                        {agent.isActive ? "Active" : "Inactive"}
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
                            <Link href={`/user/agents/${agent._id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/agent/profile`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAgent(agent)}>
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
              This will delete the agent &quot;{agentToDelete?.name}&quot;. 
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
              disabled={deleteAgentMutation.isPending}
            >
              {deleteAgentMutation.isPending && (
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

export default function AdminAgents() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminAgentsContent />
    </Suspense>
  );
} 
