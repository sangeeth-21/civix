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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  Star,
  Download,
  Loader2,
  Activity,
  Target,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Interface for report data
interface ReportData {
  overview: {
    totalUsers: number;
    totalAgents: number;
    totalAdmins: number;
    totalServices: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    systemUptime: number;
  };
  trends: {
    userGrowth: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
    }>;
    revenueGrowth: Array<{
      date: string;
      revenue: number;
      bookings: number;
    }>;
    bookingTrends: Array<{
      date: string;
      total: number;
      completed: number;
      cancelled: number;
    }>;
  };
  performance: {
    topAgents: Array<{
      _id: string;
      name: string;
      email: string;
      bookingsCount: number;
      totalRevenue: number;
      averageRating: number;
      completionRate: number;
    }>;
    topServices: Array<{
      _id: string;
      title: string;
      category: string;
      bookingsCount: number;
      totalRevenue: number;
      averageRating: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      bookings: number;
      revenue: number;
      percentage: number;
    }>;
  };
  analytics: {
    userRetention: number;
    bookingConversion: number;
    averageResponseTime: number;
    customerSatisfaction: number;
    systemPerformance: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
  };
}

export default function SuperAdminReports() {
  const router = useRouter();
  
  // State for date range and filters
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["superAdminReports", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("days", dateRange);
      
      const res = await fetch(`/api/super-admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      return res.json();
    },
  });
  
  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'excel', reportType: string) => {
    try {
      const params = new URLSearchParams();
      params.append("days", dateRange);
      params.append("format", format);
      params.append("type", reportType);
      
      const res = await fetch(`/api/super-admin/reports/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export report");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super-admin-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Exported",
        description: `${reportType} report has been exported as ${format.toUpperCase()}.`,
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
  
  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Get trend icon and color
  const getTrendIcon = (percentage: number) => {
    if (percentage > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (percentage < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };
  
  // Get performance badge
  const getPerformanceBadge = (value: number, threshold: number) => {
    if (value >= threshold) return "success";
    if (value >= threshold * 0.8) return "default";
    if (value >= threshold * 0.6) return "warning";
    return "destructive";
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
  
  const data = reportData?.data as ReportData;
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">System Reports & Analytics</Heading>
              <p className="text-muted-foreground">
                Comprehensive insights and performance metrics across the platform
              </p>
            </div>
            
            <div className="flex gap-2">
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf', 'overview')}>
                    Export Overview as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv', 'performance')}>
                    Export Performance as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel', 'analytics')}>
                    Export Analytics as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                    <div className="text-2xl font-bold">{formatNumber(data.overview.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      {data.overview.totalAgents} agents • {data.overview.totalAdmins} admins
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(data.overview.totalBookings)} total bookings
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.overview.averageRating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      Out of 5 stars
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.overview.systemUptime.toFixed(2)}%</div>
                    <Progress value={data.overview.systemUptime} className="mt-2" />
                  </CardContent>
                </Card>
              </div>
              
              {/* System Health */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                    <CardDescription>Current system resource utilization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm text-muted-foreground">{data.analytics.systemPerformance.cpu.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.analytics.systemPerformance.cpu} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm text-muted-foreground">{data.analytics.systemPerformance.memory.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.analytics.systemPerformance.memory} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Disk Usage</span>
                        <span className="text-sm text-muted-foreground">{data.analytics.systemPerformance.disk.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.analytics.systemPerformance.disk} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Network</span>
                        <span className="text-sm text-muted-foreground">{data.analytics.systemPerformance.network.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.analytics.systemPerformance.network} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Key Performance Indicators</CardTitle>
                    <CardDescription>Platform performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User Retention</span>
                      <Badge variant={getPerformanceBadge(data.analytics.userRetention, 80)}>
                        {data.analytics.userRetention.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Booking Conversion</span>
                      <Badge variant={getPerformanceBadge(data.analytics.bookingConversion, 70)}>
                        {data.analytics.bookingConversion.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Response Time</span>
                      <Badge variant={getPerformanceBadge(100 - data.analytics.averageResponseTime, 80)}>
                        {data.analytics.averageResponseTime.toFixed(1)}min
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Customer Satisfaction</span>
                      <Badge variant={getPerformanceBadge(data.analytics.customerSatisfaction, 90)}>
                        {data.analytics.customerSatisfaction.toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Agents</CardTitle>
                    <CardDescription>Agents with highest performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.performance.topAgents.slice(0, 5).map((agent, index) => (
                        <div key={agent._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(agent.totalRevenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {agent.bookingsCount} bookings • {agent.averageRating.toFixed(1)} ⭐
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Revenue Categories</CardTitle>
                    <CardDescription>Service categories by revenue performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.performance.categoryBreakdown.slice(0, 5).map((category, index) => (
                        <div key={category.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{category.category}</span>
                            <span className="text-sm font-medium">{formatCurrency(category.revenue)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={category.percentage} className="flex-1" />
                            <span className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {category.bookings} bookings
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Services</CardTitle>
                  <CardDescription>Services with highest bookings and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.performance.topServices.slice(0, 10).map((service, index) => (
                      <div key={service._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{service.title}</p>
                            <p className="text-xs text-muted-foreground">{service.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(service.totalRevenue)}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.bookingsCount} bookings • {service.averageRating.toFixed(1)} ⭐
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Trend</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.trends.userGrowth.slice(-7).map((day) => (
                        <div key={day.date} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day.date}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{day.newUsers}</p>
                            <p className="text-xs text-muted-foreground">
                              {day.activeUsers} active
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Growth</CardTitle>
                    <CardDescription>Daily revenue and booking trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.trends.revenueGrowth.slice(-7).map((day) => (
                        <div key={day.date} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day.date}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(day.revenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {day.bookings} bookings
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Daily booking status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.trends.bookingTrends.slice(-7).map((day) => (
                      <div key={day.date} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day.date}</span>
                          <span className="text-sm font-medium">{day.total} total</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-green-100 rounded p-2">
                            <p className="text-xs text-green-800 font-medium">{day.completed} completed</p>
                          </div>
                          <div className="flex-1 bg-red-100 rounded p-2">
                            <p className="text-xs text-red-800 font-medium">{day.cancelled} cancelled</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                    <CardDescription>Detailed performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">User Retention Rate</span>
                        <span className="text-sm font-medium">{data.analytics.userRetention.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.analytics.userRetention} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Percentage of users who return within 30 days
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Booking Conversion Rate</span>
                        <span className="text-sm font-medium">{data.analytics.bookingConversion.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.analytics.bookingConversion} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Percentage of service views that result in bookings
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Average Response Time</span>
                        <span className="text-sm font-medium">{data.analytics.averageResponseTime.toFixed(1)} minutes</span>
                      </div>
                      <Progress value={Math.max(0, 100 - data.analytics.averageResponseTime)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Average time for agents to respond to booking requests
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Customer Satisfaction</span>
                        <span className="text-sm font-medium">{data.analytics.customerSatisfaction.toFixed(1)}%</span>
                      </div>
                      <Progress value={data.analytics.customerSatisfaction} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on customer ratings and feedback
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>System Health Overview</CardTitle>
                    <CardDescription>Current system status and alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">System Status</span>
                      <Badge variant="success">Operational</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Health</span>
                      <Badge variant="success">Healthy</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Response Time</span>
                      <Badge variant="default">45ms avg</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <Badge variant="success">0.02%</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Alerts</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>System backup completed successfully</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span>High memory usage detected</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>All services operational</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>Generate detailed reports in various formats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('pdf', 'comprehensive')}
                      className="h-20 flex-col gap-2"
                    >
                      <Download className="h-6 w-6" />
                      <span>Comprehensive Report</span>
                      <span className="text-xs text-muted-foreground">PDF Format</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleExport('csv', 'performance')}
                      className="h-20 flex-col gap-2"
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span>Performance Data</span>
                      <span className="text-xs text-muted-foreground">CSV Format</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleExport('excel', 'analytics')}
                      className="h-20 flex-col gap-2"
                    >
                      <TrendingUp className="h-6 w-6" />
                      <span>Analytics Report</span>
                      <span className="text-xs text-muted-foreground">Excel Format</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </PageTransition>
  );
} 
