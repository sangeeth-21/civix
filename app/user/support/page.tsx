"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MessageSquare, TicketCheck, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";

// Define the form schema
const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.string().min(1, "Please select a priority"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

// Define ticket interface
interface SupportTicket {
  _id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  userId: string;
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    _id: string;
    message: string;
    isStaff: boolean;
    createdAt: string;
  }>;
}

export default function UserSupport() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  // Fetch user's support tickets
  const fetchTickets = useCallback(async () => {
    try {
      setIsLoadingTickets(true);
      
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/support/tickets`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch support tickets");
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTickets(data.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your support tickets",
      });
    } finally {
      setIsLoadingTickets(false);
    }
  }, [toast]);

  // Fetch tickets on component mount
  useEffect(() => {
    if (session?.user) {
      fetchTickets();
    } else {
      setIsLoadingTickets(false);
    }
  }, [session, fetchTickets]);

  // Initialize the support ticket form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: "",
      category: "",
      priority: "MEDIUM",
      message: "",
    }
  });

  // Handle form submission
  const onSubmit = async (data: SupportTicketFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create support ticket");
      }

      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully",
      });

      reset();
      fetchTickets(); // Refresh tickets list
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while submitting your ticket");
      
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Failed to create ticket",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ticket selection
  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  // Submit response to ticket
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket || !responseMessage.trim()) {
      return;
    }
    
    try {
      setIsSubmittingResponse(true);
      
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/support/tickets/${selectedTicket._id}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: responseMessage }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to add response");
      }
      
      toast({
        title: "Response Added",
        description: "Your response has been added to the ticket",
      });
      
      // Update selected ticket with the new response
      if (responseData.data) {
        setSelectedTicket(responseData.data);
        // Also update in the tickets array
        setTickets(tickets.map(t => t._id === selectedTicket._id ? responseData.data : t));
      }
      
      setResponseMessage("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add response",
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Get badge color based on ticket status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case "RESOLVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      case "CLOSED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get badge color based on ticket priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Medium</Badge>;
      case "LOW":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // If no session, user should be redirected to login
  if (!session?.user) {
    return (
      <PageTransition>
        <div className="container py-12 px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please login to access support services
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push('/login?callbackUrl=/user/support')}>
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container py-12 px-4 md:px-6 max-w-6xl">
        <FadeIn>
          <h1 className="text-3xl font-bold mb-8">Support</h1>

          <Tabs defaultValue="tickets">
            <TabsList className="mb-6">
              <TabsTrigger value="tickets" className="flex items-center gap-2">
                <TicketCheck className="h-4 w-4" />
                My Tickets
              </TabsTrigger>
              <TabsTrigger value="new-ticket" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                New Ticket
              </TabsTrigger>
            </TabsList>

            {/* My Tickets Tab */}
            <TabsContent value="tickets">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tickets List */}
                <Card className="md:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle>My Tickets</CardTitle>
                    <CardDescription>
                      {isLoadingTickets ? "Loading tickets..." : `${tickets.length} ticket(s) found`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoadingTickets ? (
                      <div className="flex justify-center items-center p-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <p className="text-muted-foreground">No support tickets found</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            const element = document.querySelector('[data-value="new-ticket"]');
                            if (element instanceof HTMLElement) {
                              element.click();
                            }
                          }}
                        >
                          Create Your First Ticket
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {Array.isArray(tickets) ? tickets.map((ticket) => (
                          <div
                            key={ticket._id}
                            onClick={() => handleTicketSelect(ticket)}
                            className={`p-4 cursor-pointer hover:bg-muted/50 ${
                              selectedTicket?._id === ticket._id ? "bg-muted" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium line-clamp-1">{ticket.subject}</h3>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {ticket.message}
                            </p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                              {getPriorityBadge(ticket.priority)}
                            </div>
                          </div>
                        )) : (
                          <div className="p-4 text-center text-muted-foreground">
                            <p>No tickets available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ticket Details */}
                <Card className="md:col-span-2">
                  {selectedTicket ? (
                    <>
                      <CardHeader>
                        <div className="flex justify-between">
                          <div>
                            <CardTitle>{selectedTicket.subject}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              {selectedTicket.category} • {new Date(selectedTicket.createdAt).toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(selectedTicket.status)}
                            {getPriorityBadge(selectedTicket.priority)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Original message */}
                        <div className="bg-muted/30 p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                        </div>

                        {/* Responses */}
                        {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold">Responses</h3>
                            {selectedTicket.responses.map((response) => (
                              <div
                                key={response._id}
                                className={`p-4 rounded-md ${
                                  response.isStaff ? "bg-primary/10 ml-8" : "bg-muted/30"
                                }`}
                              >
                                <div className="flex justify-between mb-2">
                                  <p className="text-sm font-medium">
                                    {response.isStaff ? "Support Agent" : "You"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(response.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <p className="whitespace-pre-wrap">{response.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Response form */}
                        {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                          <form onSubmit={handleSubmitResponse} className="pt-4 border-t">
                            <h3 className="font-semibold mb-2">Add Response</h3>
                            <Textarea
                              placeholder="Type your response here..."
                              className="min-h-[100px] mb-4"
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              required
                            />
                            <div className="flex justify-end">
                              <Button type="submit" disabled={isSubmittingResponse || !responseMessage.trim()}>
                                {isSubmittingResponse ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  "Send Response"
                                )}
                              </Button>
                            </div>
                          </form>
                        )}
                      </CardContent>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <TicketCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Ticket Selected</h3>
                      <p className="text-muted-foreground mb-6">
                        Select a ticket from the list to view details or create a new support ticket.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const element = document.querySelector('[data-value="new-ticket"]');
                          if (element instanceof HTMLElement) {
                            element.click();
                          }
                        }}
                      >
                        Create New Ticket
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* New Ticket Tab */}
            <TabsContent value="new-ticket">
              <Card>
                <CardHeader>
                  <CardTitle>Submit a New Support Request</CardTitle>
                  <CardDescription>
                    Fill out the form below to create a new support ticket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        {...register("subject")}
                      />
                      {errors.subject && (
                        <p className="text-sm text-red-500">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          onValueChange={(value) => {
                            const event = {
                              target: {
                                name: "category",
                                value
                              }
                            };
                            register("category").onChange(event as React.ChangeEvent<HTMLSelectElement>);
                          }}
                          defaultValue=""
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TECHNICAL">Technical Issue</SelectItem>
                            <SelectItem value="BILLING">Billing</SelectItem>
                            <SelectItem value="ACCOUNT">Account Management</SelectItem>
                            <SelectItem value="SERVICE">Service Related</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-sm text-red-500">{errors.category.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          onValueChange={(value) => {
                            const event = {
                              target: {
                                name: "priority",
                                value
                              }
                            };
                            register("priority").onChange(event as React.ChangeEvent<HTMLSelectElement>);
                          }}
                          defaultValue="MEDIUM"
                        >
                          <SelectTrigger id="priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.priority && (
                          <p className="text-sm text-red-500">{errors.priority.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Please provide a detailed description of your issue"
                        rows={6}
                        {...register("message")}
                      />
                      {errors.message && (
                        <p className="text-sm text-red-500">{errors.message.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Ticket"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
