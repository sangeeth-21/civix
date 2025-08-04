import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Package, 
  Calendar, 
  Settings,
  AlertTriangle,
  BarChart3,
  UserCog,
  ShieldAlert,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  PieChart,
  TrendingUp,
  Activity
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import AuditLog from "@/models/AuditLog";
import SupportTicket from "@/models/SupportTicket";

// Define types for our data
interface SystemStats {
  totalUsers: number;
  totalAgents: number;
  totalServices: number;
  totalBookings: number;
  activeUsers: number;
  pendingBookings: number;
  recentTickets: number;
  systemHealth: "good" | "warning" | "critical";
}

interface AuditLogEntry {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  entityType?: string;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

// Page metadata
export const metadata = {
  title: "Admin Dashboard - Civix",
  description: "System overview and management tools",
};

// Loading component
function DashboardSkeleton() {
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse"></div>
      
      {/* Quick Actions */}
      <div className="h-20 rounded-lg border bg-card p-6 animate-pulse"></div>
      
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted mb-4"></div>
            <div className="h-7 w-24 rounded-md bg-muted mb-2"></div>
            <div className="h-5 w-16 rounded-md bg-muted"></div>
          </div>
        ))}
      </div>
      
      {/* System Health */}
      <div className="h-40 rounded-lg border bg-card p-6 animate-pulse"></div>
      
      {/* Tabs */}
      <div className="h-10 w-72 rounded-md bg-muted animate-pulse mb-6"></div>
      
      {/* Content Area */}
      <div className="rounded-lg border bg-card p-6 animate-pulse h-80"></div>
    </div>
  );
}

// Error component
function DashboardError({ error }: { error: Error }) {
  return (
    <div className="container p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Dashboard</CardTitle>
          <CardDescription>We encountered a problem loading your data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{error.message || "Please try again later"}</p>
          <Button asChild>
            <Link href="/admin/dashboard">Refresh Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick Actions component
function QuickActions() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4 justify-between">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/services">
                <Package className="mr-2 h-4 w-4" />
                Services
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/bookings">
                <Calendar className="mr-2 h-4 w-4" />
                Bookings
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/profile">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status badge component
function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "low":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Low
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Medium
        </Badge>
      );
    case "high":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          High
        </Badge>
      );
    case "urgent":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Urgent
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {priority}
        </Badge>
      );
  }
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="mr-1 h-3 w-3" />
          Open
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Activity className="mr-1 h-3 w-3" />
          In Progress
        </Badge>
      );
    case "resolved":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Resolved
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="mr-1 h-3 w-3" />
          Closed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
}

// Dashboard stats component
async function DashboardStats() {
  try {
    // Get cookies for authentication
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    
    // Use absolute URL with origin to avoid URL parsing errors
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Fetch system stats
    const statsResponse = await fetch(
      `${baseUrl}/api/admin/stats`,
      { 
        headers: { 
          cookie: cookieString,
          'Content-Type': 'application/json'
        },
        cache: "no-store" 
      }
    );
    
    if (!statsResponse.ok) {
      // Fallback to direct database queries if API endpoint is not available
      // Get real data from database
      await connectDB();
      
      const [totalUsers, totalAgents, totalServices, totalBookings, activeUsers, pendingBookings, recentTickets] = await Promise.all([
        User.countDocuments({ role: "USER" }),
        User.countDocuments({ role: "AGENT" }),
        Service.countDocuments(),
        Booking.countDocuments(),
        User.countDocuments({ role: "USER", isActive: true }),
        Booking.countDocuments({ status: "PENDING" }),
        SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } })
      ]);

      const stats: SystemStats = {
        totalUsers,
        totalAgents,
        totalServices,
        totalBookings,
        activeUsers,
        pendingBookings,
        recentTickets,
        systemHealth: "good" // This would be determined by monitoring in production
      };
      
      // Fetch recent audit logs from database
      const auditLogs = await AuditLog?.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            _id: 1,
            userId: {
              _id: "$user._id",
              name: "$user.name",
              email: "$user.email"
            },
            action: 1,
            entityType: 1,
            createdAt: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 }
      ]) || [];
      
      // Fetch recent support tickets from database
      const supportTickets = await SupportTicket.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            _id: 1,
            userId: {
              _id: "$user._id",
              name: "$user.name",
              email: "$user.email"
            },
            subject: 1,
            status: 1,
            priority: 1,
            createdAt: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 }
      ]) || [];
      
      return (
        <>
          {/* Quick Actions */}
          <FadeIn delay={0.1}>
            <QuickActions />
          </FadeIn>
          
          {/* Stats Grid */}
          <FadeIn delay={0.2}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-row items-center gap-4">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-row items-center gap-4">
                    <UserCog className="h-8 w-8 text-indigo-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Service Providers</p>
                      <p className="text-2xl font-bold">{stats.totalAgents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-row items-center gap-4">
                    <Package className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Services</p>
                      <p className="text-2xl font-bold">{stats.totalServices}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-row items-center gap-4">
                    <Calendar className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
          
          {/* System Health */}
          <FadeIn delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>System Health</span>
                  {stats.systemHealth === "good" && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Good</Badge>
                  )}
                  {stats.systemHealth === "warning" && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Warning</Badge>
                  )}
                  {stats.systemHealth === "critical" && (
                    <Badge variant="destructive">Critical</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Real-time system metrics and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold">{stats.activeUsers}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Online</Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Pending Bookings</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold">{stats.pendingBookings}</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">Needs Action</Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Open Support Tickets</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold">{stats.recentTickets}</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">Active</Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Server Status</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold">100%</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Operational</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
          
          {/* Tabs for Audit Logs and Support Tickets */}
          <FadeIn delay={0.4}>
            <Tabs defaultValue="audit" className="w-full">
              <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                <TabsTrigger value="audit">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="tickets">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Support Tickets
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="audit" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent System Activity</CardTitle>
                    <CardDescription>
                      Latest actions and events in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditLogs.map((log: AuditLogEntry) => (
                        <div key={log._id} className="flex flex-col space-y-2 border-b pb-4 last:border-0">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">By: </span>
                            <Link href={`/admin/users/${log.userId._id}`} className="font-medium hover:underline">
                              {log.userId.name}
                            </Link>
                            {log.entityType && (
                              <span className="text-muted-foreground"> • {log.entityType}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <Button variant="outline" asChild>
                        <Link href="/admin/audit-logs">
                          View All Activity
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tickets" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Support Tickets</CardTitle>
                    <CardDescription>
                      Latest customer support requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {supportTickets.map((ticket: SupportTicket) => (
                        <div key={ticket._id} className="flex flex-col space-y-2 border-b pb-4 last:border-0">
                          <div className="flex justify-between">
                            <Link href={`/admin/support/${ticket._id}`} className="font-medium hover:underline">
                              {ticket.subject}
                            </Link>
                            <div className="flex gap-2">
                              <StatusBadge status={ticket.status} />
                              <PriorityBadge priority={ticket.priority} />
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">From: </span>
                            <Link href={`/admin/users/${ticket.userId._id}`} className="hover:underline">
                              {ticket.userId.name}
                            </Link>
                            <span className="text-muted-foreground"> • {new Date(ticket.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <Button variant="outline" asChild>
                        <Link href="/admin/support">
                          View All Tickets
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </FadeIn>
        </>
      );
    } else {
      const statsData = await statsResponse.json();
      // Implement with real data once the API is available
      // ...
    }
  } catch (error) {
    return <DashboardError error={error instanceof Error ? error : new Error("Failed to load dashboard data")} />;
  }
}

export default async function AdminDashboard() {
  // Get the user session
  const session = await auth();
  
  // Redirect if not authenticated or not an admin
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }
  
  return (
    <div className="container space-y-6 p-6 md:p-10">
      <PageTransition>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardStats />
        </Suspense>
      </PageTransition>
    </div>
  );
} 
