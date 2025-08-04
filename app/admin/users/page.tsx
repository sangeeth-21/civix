import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { PageTransition, FadeIn } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  UserCog,
  UserPlus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// Define types for our data
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsersResponse {
  data: User[];
  pagination: PaginationData;
}

// Page metadata
export const metadata = {
  title: "Manage Users - Admin Dashboard - Civix",
  description: "User management tools for administrators",
};

// Loading component
function UsersTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-64 h-10 rounded-md bg-muted animate-pulse"></div>
        <div className="flex gap-2">
          <div className="w-32 h-10 rounded-md bg-muted animate-pulse"></div>
          <div className="w-24 h-10 rounded-md bg-muted animate-pulse"></div>
        </div>
      </div>
      
      {/* Table */}
      <div className="border rounded-md">
        <div className="h-12 border-b bg-muted animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b last:border-0 bg-card animate-pulse"></div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="w-24 h-8 rounded-md bg-muted animate-pulse"></div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-md bg-muted animate-pulse"></div>
          <div className="w-10 h-10 rounded-md bg-muted animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Error component
function UsersTableError({ error }: { error: Error }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Loading Users</CardTitle>
        <CardDescription>We encountered a problem loading the users data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">{error.message || "Please try again later"}</p>
        <Button asChild>
          <Link href="/admin/users">Refresh Page</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Role badge component
function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "USER":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          User
        </Badge>
      );
    case "AGENT":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Agent
        </Badge>
      );
    case "ADMIN":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Admin
        </Badge>
      );
    case "SUPER_ADMIN":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Super Admin
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {role}
        </Badge>
      );
  }
}

// Status badge component
function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
    );
  }
}

// Users table component
async function UsersTable({ 
  page = 1,
  limit = 10,
  role,
  search,
  sort = "createdAt",
  order = "desc"
}: { 
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  try {
    // Get cookies for authentication
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    
    // Use absolute URL with origin to avoid URL parsing errors
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    
    if (role) {
      queryParams.append("role", role);
    }
    
    if (search) {
      queryParams.append("search", search);
    }
    
    if (sort) {
      queryParams.append("sort", sort);
    }
    
    if (order) {
      queryParams.append("order", order);
    }
    
    // Fetch users data
    const response = await fetch(
      `${baseUrl}/api/admin/users?${queryParams.toString()}`,
      { 
        headers: { 
          cookie: cookieString,
          'Content-Type': 'application/json'
        },
        cache: "no-store" 
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    const { data: users, pagination }: UsersResponse = await response.json();
    
    // Use real data from API
    const displayUsers = users;
    const displayPagination = pagination;
    
    return (
      <div className="space-y-6">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <form action="/admin/users" method="get">
              <Input
                type="search"
                name="search"
                placeholder="Search users..."
                className="pl-8"
                defaultValue={search}
              />
              {role && <input type="hidden" name="role" value={role} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              {order && <input type="hidden" name="order" value={order} />}
            </form>
          </div>
          <div className="flex gap-2">
            <Select defaultValue={role || "all"}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="AGENT">Agents</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[100px]">Role</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[150px]">Created</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/users/${user._id}`} className="hover:underline">
                      {user.name}
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={user.isActive} />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user._id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user._id}/edit`}>
                            Edit User
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isActive ? (
                          <DropdownMenuItem className="text-red-600">
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {displayPagination.page} of {displayPagination.totalPages} pages
            ({displayPagination.totalCount} total users)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={!displayPagination.hasPrevPage}
              asChild={displayPagination.hasPrevPage}
            >
              {displayPagination.hasPrevPage ? (
                <Link href={`/admin/users?page=${displayPagination.page - 1}&limit=${displayPagination.limit}${role ? `&role=${role}` : ''}${search ? `&search=${search}` : ''}${sort ? `&sort=${sort}` : ''}${order ? `&order=${order}` : ''}`}>
                  &lt;
                </Link>
              ) : (
                <span>&lt;</span>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!displayPagination.hasNextPage}
              asChild={displayPagination.hasNextPage}
            >
              {displayPagination.hasNextPage ? (
                <Link href={`/admin/users?page=${displayPagination.page + 1}&limit=${displayPagination.limit}${role ? `&role=${role}` : ''}${search ? `&search=${search}` : ''}${sort ? `&sort=${sort}` : ''}${order ? `&order=${order}` : ''}`}>
                  &gt;
                </Link>
              ) : (
                <span>&gt;</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <UsersTableError error={error instanceof Error ? error : new Error("Failed to load users")} />;
  }
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = Number(resolvedSearchParams.limit) || 10;
  const role = resolvedSearchParams.role as string;
  const search = resolvedSearchParams.search as string;
  const sort = resolvedSearchParams.sort as string || "createdAt";
  const order = resolvedSearchParams.order as string || "desc";

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <Suspense fallback={<UsersTableSkeleton />}>
          <UsersTable 
            page={page}
            limit={limit}
            role={role}
            search={search}
            sort={sort}
            order={order}
          />
        </Suspense>
      </div>
    </PageTransition>
  );
} 
