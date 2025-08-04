"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/heading";
import { toast } from "@/components/ui/use-toast";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  PlusCircle,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
} from "lucide-react";

// Define the schema for creating a ticket
const createTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.string().min(1, "Please select a priority"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

// Define schema for adding a response
const responseSchema = z.object({
  message: z.string().min(1, "Response cannot be empty"),
});

// Define types
type CreateTicketFormValues = z.infer<typeof createTicketSchema>;
type ResponseFormValues = z.infer<typeof responseSchema>;

interface TicketResponse {
  _id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  userId: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  responses: TicketResponse[];
}

export default function AgentSupport() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form for creating a ticket
  const createTicketForm = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      category: "",
      priority: "medium",
      message: "",
    },
  });
  
  // Form for adding a response
  const responseForm = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      message: "",
    },
  });
  
  // Query for fetching tickets from API
  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ["supportTickets"],
    queryFn: async () => {
      const response = await fetch("/api/support/tickets");
      if (!response.ok) {
        throw new Error("Failed to fetch support tickets");
      }
      return response.json();
    },
    staleTime: 60000,
  });
  
  // Filter tickets based on status and search
  const filteredTickets = ticketsData?.data.filter((ticket: SupportTicket) => {
    // Status filter
    if (statusFilter !== "all" && ticket.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery && 
        !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.category.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  }) || [];
  
  // Sort tickets by creation date (newest first)
  const sortedTickets = [...filteredTickets].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Mutation for creating a ticket
  const createTicketMutation = useMutation<{ success: boolean }, Error, CreateTicketFormValues>({
    mutationFn: async (data: CreateTicketFormValues) => {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create support ticket");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Support ticket created",
        description: "Your ticket has been submitted. We'll get back to you soon.",
      });
      createTicketForm.reset();
      setIsCreateDialogOpen(false);
      // Refresh the tickets list
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for adding a response
  const addResponseMutation = useMutation<{ success: boolean }, Error, { ticketId: string, message: string }>({
    mutationFn: async ({ ticketId, message }: { ticketId: string, message: string }) => {
      const response = await fetch(`/api/support/tickets/${ticketId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add response to ticket");
      }
      
      // Update the cache with the new data
      queryClient.setQueryData(["supportTickets"], (oldData: { data: SupportTicket[] }) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((ticket: SupportTicket) => {
            if (ticket._id === ticketId) {
              return {
                ...ticket,
                responses: [
                  ...ticket.responses,
                  {
                    _id: `r${Date.now()}`,
                    ticketId,
                    userId: "current-user-id", // This would come from session
                    message,
                    isStaff: false,
                    createdAt: new Date().toISOString(),
                  }
                ],
                updatedAt: new Date().toISOString()
              };
            }
            return ticket;
          })
        };
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response added",
        description: "Your response has been added to the ticket.",
      });
      responseForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add response",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle create ticket form submission
  const onCreateTicketSubmit = (data: CreateTicketFormValues) => {
    createTicketMutation.mutate(data);
  };
  
  // Handle response form submission
  const onAddResponseSubmit = (data: ResponseFormValues) => {
    if (!selectedTicket) return;
    
    addResponseMutation.mutate({
      ticketId: selectedTicket._id,
      message: data.message,
    });
  };
  
  // Helper function to get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "technical":
        return "Technical Issue";
      case "billing":
        return "Billing & Payments";
      case "account":
        return "Account Management";
      case "feature_request":
        return "Feature Request";
      case "other":
        return "Other";
      default:
        return category;
    }
  };
  
  // Helper function to get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Low</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Medium</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="mr-1 h-3 w-3" /> Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Loader2 className="mr-1 h-3 w-3" /> In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Resolved
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="mr-1 h-3 w-3" /> Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Open ticket details
  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load support tickets. Please try again later.</p>
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
              <Heading level="h1" className="mb-2">Support</Heading>
              <p className="text-muted-foreground">
                Get help with any issues or questions you may have
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Ticket
            </Button>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How Can We Help You?</CardTitle>
              <CardDescription>
                Browse our help center or create a new support ticket if you need assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Start Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Learn how to get started with our platform and manage your services.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full">
                    View Guide
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">FAQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Find answers to commonly asked questions about our platform.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full">
                    View FAQ
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contact Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Need personalized help? Our support team is ready to assist you.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                    Create Ticket
                  </Button>
                </CardFooter>
              </Card>
            </CardContent>
          </Card>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
            <h2 className="text-xl font-semibold">Your Support Tickets</h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-[250px]"
                />
              </div>
              
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {sortedTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                  <p className="text-muted-foreground mb-6">
                    {statusFilter !== "all" || searchQuery
                      ? "Try adjusting your search or filter"
                      : "You haven&apos;t created any support tickets yet"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Ticket
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedTickets.map((ticket) => {
                const typedTicket = ticket as SupportTicket;
                return (
                  <Card key={typedTicket._id} className="cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => handleOpenTicket(typedTicket)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{typedTicket.subject}</CardTitle>
                        {getStatusBadge(typedTicket.status)}
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <span>#{typedTicket._id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>{format(new Date(typedTicket.createdAt), "PPP")}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="line-clamp-2 text-sm">{typedTicket.message}</p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getCategoryLabel(typedTicket.category)}</Badge>
                          {getPriorityBadge(typedTicket.priority)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {typedTicket.responses.length} {typedTicket.responses.length === 1 ? "response" : "responses"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </FadeIn>
      </div>
      
      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Submit a new support ticket and we&apos;ll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createTicketForm}>
            <form onSubmit={createTicketForm.handleSubmit(onCreateTicketSubmit)} className="space-y-4">
              <FormField
                control={createTicketForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of your issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createTicketForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="account">Account Management</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createTicketForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={createTicketForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your issue in detail..." 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createTicketMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Ticket
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <DialogDescription className="flex items-center gap-2">
                  <span>#{selectedTicket._id.substring(0, 8)}</span>
                  <span>•</span>
                  <span>{format(new Date(selectedTicket.createdAt), "PPP")}</span>
                  <span>•</span>
                  <span>{getCategoryLabel(selectedTicket.category)}</span>
                  <span>•</span>
                  <span>Priority: {selectedTicket.priority}</span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Original ticket message */}
                <div className="bg-muted/30 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">You</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedTicket.createdAt), "PPP p")}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
                
                {/* Responses */}
                {selectedTicket.responses.length > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-lg font-medium">Responses</h3>
                    
                    {selectedTicket.responses.map((response) => (
                      <div 
                        key={response._id} 
                        className={`p-4 rounded-md ${
                          response.isStaff ? "bg-primary/10" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium">{response.isStaff ? "Support Team" : "You"}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(response.createdAt), "PPP p")}
                          </p>
                        </div>
                        <p className="whitespace-pre-wrap">{response.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add response form */}
                {selectedTicket.status !== "CLOSED" && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-lg font-medium">Add Response</h3>
                    
                    <Form {...responseForm}>
                      <form onSubmit={responseForm.handleSubmit(onAddResponseSubmit)} className="space-y-4">
                        <FormField
                          control={responseForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Type your response..." 
                                  className="min-h-[150px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit"
                            disabled={addResponseMutation.isPending}
                          >
                            {addResponseMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Send Response
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
} 
