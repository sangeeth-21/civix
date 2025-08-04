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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Download,
  BarChart3,
  PieChart,
  Globe,
  Shield,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Interface for super admin dashboard data
interface SuperAdminStats {
  system: {
    totalUsers: number;
    totalAgents: number;
    totalAdmins: number;
    totalServices: number;
    totalBookings: number;
    activeUsers: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageRating: number;
    systemUptime: number;
    serverLoad: number;
    databaseSize: number;
    activeConnections: number;
  };
  performance: {
    topPerformingAgents: Array<{
      _id: string;
      name: string;
      email: string;
      bookingsCount: number;
      totalRevenue: number;
      rating: number;
      avatar?: string;
    }>;
    topPerformingServices: Array<{
      _id: string;
      title: string;
      category: string;
      bookingsCount: number;
      totalRevenue: number;
    }>;
    topRevenueCategories: Array<{
      category: string;
      revenue: number;
      bookings: number;
      percentage: number;
    }>;
  };
  analytics: {
    monthlyStats: Array<{
      month: string;
      users: number;
      bookings: number;
      revenue: number;
      agents: number;
    }>;
    userGrowth: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
    }>;
    revenueTrend: Array<{
      date: string;
      revenue: number;
      bookings: number;
    }>;
  };
  alerts: Array<{
    _id: string;
    type: "warning" | "error" | "info" | "success";
    title: string;
    message: string;
    timestamp: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  recentActivity: Array<{
    _id: string;
    action: string;
    userId: string;
    userName: string;
    userEmail: string;
    entityType: string;
    entityId: string;
    timestamp: string;
    ipAddress: string;
  }>;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  // State for date range
  const [dateRange, setDateRange] = useState<string>("30");
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Fetch super admin dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["superAdminDashboard", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("days", dateRange);
      
      const res = await fetch(`/api/super-admin/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    }
  });
  
  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams();
      params.append("days", dateRange);
      params.append("format", format);
      
      const res = await fetch(`/api/super-admin/dashboard/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export dashboard");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super-admin-dashboard-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Dashboard Exported",
        description: `Dashboard has been exported as ${format.toUpperCase()}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard. Please try again.",
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
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get alert badge variant
  const getAlertBadge = (severity: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "success" | "outline" | "warning"> = {
      low: "secondary",
      medium: "default",
      high: "warning",
      critical: "destructive",
    };
    return variants[severity] || "secondary";
  };
  
  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
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
            <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load dashboard data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const stats = dashboardData?.data as SuperAdminStats;
  
  return (
    <PageTransition>
      <div className="container py-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <Heading level="h1" className="mb-2">Super Admin Dashboard</Heading>
              <p className="text-muted-foreground">
                System-wide overview and performance metrics
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* System Health Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.system.systemUptime.toFixed(2)}%</div>
                    <Progress value={stats.system.systemUptime} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Server Load</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.system.serverLoad.toFixed(1)}%</div>
                    <Progress 
                      value={stats.system.serverLoad} 
                      className="mt-2"
                      style={{
                        backgroundColor: stats.system.serverLoad > 80 ? '#ef4444' : 
                                        stats.system.serverLoad > 60 ? '#f59e0b' : '#22c55e'
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current load
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats.system.databaseSize / 1024 / 1024).toFixed(1)} GB</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.system.activeConnections} active connections
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Network Status</CardTitle>
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">Online</div>
                    <p className="text-xs text-muted-foreground">
                      All services operational
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.system.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.system.activeUsers} active users
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.system.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.system.totalBookings} total bookings
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.system.totalAgents)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.system.totalAdmins} administrators
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.system.averageRating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      Out of 5 stars
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Alerts and Recent Activity */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Alerts</CardTitle>
                    <CardDescription>Recent system notifications and warnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.alerts.slice(0, 5).map((alert) => (
                        <div key={alert._id} className="flex items-start gap-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{alert.title}</p>
                              <Badge variant={getAlertBadge(alert.severity)} className="text-xs">
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest user and system actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity._id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={activity.userName} />
                            <AvatarFallback className="text-xs">
                              {getInitials(activity.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.userName}</p>
                            <p className="text-sm text-muted-foreground">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
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
                      {stats.performance.topPerformingAgents.slice(0, 5).map((agent, index) => (
                        <div key={agent._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index + 1}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={agent.avatar} alt={agent.name} />
                              <AvatarFallback className="text-xs">
                                {getInitials(agent.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(agent.totalRevenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {agent.bookingsCount} bookings • {agent.rating.toFixed(1)} ⭐
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
                      {stats.performance.topRevenueCategories.slice(0, 5).map((category, index) => (
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
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Statistics</CardTitle>
                    <CardDescription>Key metrics over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.analytics.monthlyStats.slice(-6).map((month) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{month.month}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(month.revenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {month.bookings} bookings • {month.users} users
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Trend</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.analytics.userGrowth.slice(-7).map((day) => (
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
              </div>
            </TabsContent>
            
            <TabsContent value="system" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Resources</CardTitle>
                    <CardDescription>Current system resource utilization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm text-muted-foreground">{stats.system.serverLoad.toFixed(1)}%</span>
                      </div>
                      <Progress value={stats.system.serverLoad} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm text-muted-foreground">75.2%</span>
                      </div>
                      <Progress value={75.2} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Disk Usage</span>
                        <span className="text-sm text-muted-foreground">68.5%</span>
                      </div>
                      <Progress value={68.5} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Network</span>
                        <span className="text-sm text-muted-foreground">45.8%</span>
                      </div>
                      <Progress value={45.8} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Database Statistics</CardTitle>
                    <CardDescription>Database performance and usage metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Size</span>
                      <span className="text-sm font-medium">{(stats.system.databaseSize / 1024 / 1024).toFixed(1)} GB</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Connections</span>
                      <span className="text-sm font-medium">{stats.system.activeConnections}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Query Response Time</span>
                      <span className="text-sm font-medium">45ms avg</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cache Hit Rate</span>
                      <span className="text-sm font-medium">92.3%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Backup Status</span>
                      <Badge variant="success">Up to date</Badge>
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
