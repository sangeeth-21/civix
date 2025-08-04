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
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  FileText,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interface for report data
interface ReportStats {
  totalUsers: number;
  totalAgents: number;
  totalServices: number;
  totalBookings: number;
  activeUsers: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating: number;
  topPerformingAgents: Array<{
    _id: string;
    name: string;
    bookingsCount: number;
    totalRevenue: number;
    rating: number;
  }>;
  popularServices: Array<{
    _id: string;
    title: string;
    bookingsCount: number;
    totalRevenue: number;
  }>;
  monthlyStats: Array<{
    month: string;
    bookings: number;
    revenue: number;
    users: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
}

// Loading component for Suspense fallback
function ReportsSkeleton() {
  return (
    <div className="container py-10">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

// Main reports component that uses useSearchParams
function AdminReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for date range
  const [dateRange, setDateRange] = useState<string>("30");
  const [reportType, setReportType] = useState<string>("overview");
  
  // Use query to fetch report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["adminReports", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("days", dateRange);
      
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      return res.json();
    }
  });
  
  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams();
      params.append("days", dateRange);
      params.append("format", format);
      
      const res = await fetch(`/api/admin/reports/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export report");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `civix-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Exported",
        description: `Report has been exported as ${format.toUpperCase()}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
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
            <CardTitle className="text-destructive">Error Loading Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load report data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const stats = reportData?.data as ReportStats;
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">Analytics & Reports</Heading>
              <p className="text-muted-foreground">
                Comprehensive insights into platform performance
              </p>
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="mr-2 h-4 w-4" /> Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="mr-2 h-4 w-4" /> Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileText className="mr-2 h-4 w-4" /> Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeUsers} active users
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalBookings)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingBookings} pending
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      Average: {formatCurrency(stats.totalRevenue / Math.max(stats.totalBookings, 1))}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      Out of 5 stars
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Booking Status Breakdown */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Status</CardTitle>
                    <CardDescription>Current booking status distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Pending</span>
                      </div>
                      <span className="text-sm font-medium">{stats.pendingBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="text-sm font-medium">{stats.completedBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Cancelled</span>
                      </div>
                      <span className="text-sm font-medium">{stats.cancelledBookings}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Overview</CardTitle>
                    <CardDescription>Key platform metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Agents</span>
                      <span className="text-sm font-medium">{stats.totalAgents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Services</span>
                      <span className="text-sm font-medium">{stats.totalServices}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Users</span>
                      <span className="text-sm font-medium">{stats.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="text-sm font-medium">
                        {((stats.completedBookings / Math.max(stats.totalBookings, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="bookings" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Agents</CardTitle>
                    <CardDescription>Agents with highest booking counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topPerformingAgents.slice(0, 5).map((agent, index) => (
                        <div key={agent._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {agent.bookingsCount} bookings
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(agent.totalRevenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {agent.rating.toFixed(1)} ⭐
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Services</CardTitle>
                    <CardDescription>Most booked services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.popularServices.slice(0, 5).map((service, index) => (
                        <div key={service._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{service.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {service.bookingsCount} bookings
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(service.totalRevenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="revenue" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                    <CardDescription>Revenue breakdown by service category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.categoryBreakdown.map((category) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.category}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(category.revenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {category.count} services
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Revenue Trend</CardTitle>
                    <CardDescription>Revenue over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.monthlyStats.slice(-6).map((month) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{month.month}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(month.revenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {month.bookings} bookings
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>Monthly user registration trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.monthlyStats.slice(-6).map((month) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{month.month}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{month.users}</p>
                            <p className="text-xs text-muted-foreground">
                              new users
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>Platform engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Users</span>
                      <span className="text-sm font-medium">{formatNumber(stats.totalUsers)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Users</span>
                      <span className="text-sm font-medium">{formatNumber(stats.activeUsers)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Rate</span>
                      <span className="text-sm font-medium">
                        {((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Agents</span>
                      <span className="text-sm font-medium">{formatNumber(stats.totalAgents)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </PageTransition>
  );
}

export default function AdminReports() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <AdminReportsContent />
    </Suspense>
  );
} 
