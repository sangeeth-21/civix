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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { 
  MoreVertical, 
  Eye, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Mail,
  Clock,
  User,
  Calendar,
  Download,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Info,
  Send,
  Archive,
  Trash2,
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
import { Textarea } from "@/components/ui/textarea";

// Interface for email log data
interface EmailLog {
  _id: string;
  to: string;
  from: string;
  subject: string;
  template: string;
  status: "sent" | "failed" | "pending" | "bounced";
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  attachments?: string[];
  htmlContent?: string;
  textContent?: string;
}

// Interface for email stats
interface EmailStats {
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  pendingEmails: number;
  bouncedEmails: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  averageDeliveryTime: number;
  topTemplates: Array<{
    template: string;
    count: number;
    successRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    sent: number;
    failed: number;
    delivered: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
}

export default function SuperAdminEmailLogs() {
  const router = useRouter();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("sentAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // State for dialogs
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [isEmailDetailsOpen, setIsEmailDetailsOpen] = useState(false);
  const [isResendEmailOpen, setIsResendEmailOpen] = useState(false);
  
  // Fetch email logs data
  const { data: emailLogsData, isLoading, error, refetch } = useQuery({
    queryKey: ["superAdminEmailLogs", page, limit, search, statusFilter, templateFilter, dateFilter, sortBy, sortOrder],
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
      if (templateFilter !== "all") {
        params.append("template", templateFilter);
      }
      if (dateFilter !== "all") {
        params.append("dateFilter", dateFilter);
      }
      
      const res = await fetch(`/api/super-admin/email-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch email logs");
      return res.json();
    },
  });

  // Fetch email stats
  const { data: statsData } = useQuery({
    queryKey: ["superAdminEmailStats"],
    queryFn: async () => {
      const res = await fetch("/api/super-admin/email-logs/stats");
      if (!res.ok) throw new Error("Failed to fetch email stats");
      return res.json();
    },
  });

  // Handle resend email
  const handleResendEmail = async (emailId: string) => {
    try {
      const res = await fetch(`/api/super-admin/email-logs/${emailId}/resend`, {
        method: "POST",
      });
      
      if (!res.ok) throw new Error("Failed to resend email");
      
      toast({
        title: "Email Resent",
        description: "Email has been queued for resending.",
        variant: "default",
      });
      
      setIsResendEmailOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Resend Failed",
        description: "Failed to resend email. Please try again.",
        variant: "destructive",
      });
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
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      params.append("search", search);
      params.append("status", statusFilter);
      params.append("template", templateFilter);
      
      const res = await fetch(`/api/super-admin/email-logs/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export email logs");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Email Logs Exported",
        description: `Email logs have been exported as ${format.toUpperCase()}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export email logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const emailLogs = emailLogsData?.data || [];
  const stats = statsData?.data || {
    totalEmails: 0,
    sentEmails: 0,
    failedEmails: 0,
    pendingEmails: 0,
    bouncedEmails: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    averageDeliveryTime: 0,
    topTemplates: [],
    dailyStats: [],
    hourlyDistribution: [],
  };

  if (error) {
    return (
      <div className="container p-6 md:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Email Logs</h2>
            <p className="text-muted-foreground">Failed to load email logs. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "bounced":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "bounced":
        return <Badge variant="outline">Bounced</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <PageTransition>
      <div className="container p-6 md:p-10">
        <FadeIn delay={0.1}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Heading level="h1">Email Logs</Heading>
              <p className="text-muted-foreground">Monitor and manage email delivery status</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmails}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.sentEmails} sent, {stats.failedEmails} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.deliveryRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.sentEmails} successful deliveries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average open rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageDeliveryTime.toFixed(1)}s</div>
                <p className="text-xs text-muted-foreground">
                  Average delivery time
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
                      placeholder="Search emails..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All templates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All templates</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="booking-confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="password-reset">Password Reset</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFilter">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">Last 7 days</SelectItem>
                      <SelectItem value="month">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                Recent email delivery logs and status
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
                        <TableHead>Status</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Delivery Time</TableHead>
                        <TableHead>Retries</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.map((email: EmailLog) => (
                        <TableRow key={email._id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(email.status)}
                              {getStatusBadge(email.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{email.to}</div>
                              {email.userName && (
                                <div className="text-sm text-muted-foreground">{email.userName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={email.subject}>
                              {email.subject}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{email.template}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(email.sentAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(email.sentAt).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {email.deliveredAt ? (
                              <div className="text-sm">
                                {Math.round((new Date(email.deliveredAt).getTime() - new Date(email.sentAt).getTime()) / 1000)}s
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">-</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {email.retryCount}/{email.maxRetries}
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
                                  setSelectedEmail(email);
                                  setIsEmailDetailsOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {email.status === "failed" && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedEmail(email);
                                    setIsResendEmailOpen(true);
                                  }}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Resend Email
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {emailLogsData?.pagination && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {((emailLogsData.pagination.page - 1) * emailLogsData.pagination.limit) + 1} to{" "}
                        {Math.min(emailLogsData.pagination.page * emailLogsData.pagination.limit, emailLogsData.pagination.totalCount)} of{" "}
                        {emailLogsData.pagination.totalCount} emails
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={!emailLogsData.pagination.hasPrevPage}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={!emailLogsData.pagination.hasNextPage}
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

        {/* Email Details Dialog */}
        <Dialog open={isEmailDetailsOpen} onOpenChange={setIsEmailDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Details</DialogTitle>
              <DialogDescription>
                Detailed information about the email
              </DialogDescription>
            </DialogHeader>
            {selectedEmail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(selectedEmail.status)}
                      {getStatusBadge(selectedEmail.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Template</Label>
                    <p className="text-sm mt-1">{selectedEmail.template}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">To</Label>
                    <p className="text-sm mt-1">{selectedEmail.to}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">From</Label>
                    <p className="text-sm mt-1">{selectedEmail.from}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <p className="text-sm mt-1">{selectedEmail.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Sent At</Label>
                    <p className="text-sm mt-1">{new Date(selectedEmail.sentAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedEmail.deliveredAt && (
                  <div>
                    <Label className="text-sm font-medium">Delivered At</Label>
                    <p className="text-sm mt-1">{new Date(selectedEmail.deliveredAt).toLocaleString()}</p>
                  </div>
                )}
                
                {selectedEmail.openedAt && (
                  <div>
                    <Label className="text-sm font-medium">Opened At</Label>
                    <p className="text-sm mt-1">{new Date(selectedEmail.openedAt).toLocaleString()}</p>
                  </div>
                )}
                
                {selectedEmail.errorMessage && (
                  <div>
                    <Label className="text-sm font-medium">Error Message</Label>
                    <p className="text-sm mt-1 text-red-600">{selectedEmail.errorMessage}</p>
                  </div>
                )}
                
                {selectedEmail.htmlContent && (
                  <div>
                    <Label className="text-sm font-medium">HTML Content</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-xs max-h-32 overflow-y-auto">
                      <pre>{selectedEmail.htmlContent}</pre>
                    </div>
                  </div>
                )}
                
                {selectedEmail.metadata && Object.keys(selectedEmail.metadata).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Metadata</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-xs">
                      <pre>{JSON.stringify(selectedEmail.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Resend Email Dialog */}
        <Dialog open={isResendEmailOpen} onOpenChange={setIsResendEmailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resend Email</DialogTitle>
              <DialogDescription>
                Are you sure you want to resend this email? This will create a new email log entry.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsResendEmailOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedEmail && handleResendEmail(selectedEmail._id)}
              >
                <Send className="mr-2 h-4 w-4" />
                Resend Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
} 
