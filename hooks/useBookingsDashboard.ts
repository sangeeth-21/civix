import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

// Define types for booking data
export interface BookingDashboardData {
  bookingsByStatus: Record<string, {
    count: number;
    totalAmount: number;
    bookings: BookingData[];
  }>;
  stats: {
    total: number;
    totalAmount: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  timestamp: string;
}

export interface BookingData {
  _id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledDate: string;
  amount: number;
  totalAmount: number;
  notes?: string;
  agentNotes?: string;
  createdAt: string;
  updatedAt: string;
  lastStatusUpdate?: string;
  service: {
    _id: string;
    title: string;
    category: string;
    price: number;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  agent: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface BookingsByStatus {
  PENDING: BookingData[];
  CONFIRMED: BookingData[];
  COMPLETED: BookingData[];
  CANCELLED: BookingData[];
  [key: string]: BookingData[];
}

export interface DashboardStats {
  total: number;
  totalAmount: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

interface UseBookingsDashboardOptions {
  limit?: number;
  enabled?: boolean;
  pollingInterval?: number;
  onStatusChange?: (prevStats: DashboardStats, newStats: DashboardStats) => void;
  queryOptions?: Omit<UseQueryOptions<BookingDashboardData, Error>, 'queryKey' | 'queryFn'>;
}

/**
 * Custom hook to fetch and poll booking dashboard data
 */
export function useBookingsDashboard({
  limit = 10,
  enabled = true,
  pollingInterval = 10000, // 10 seconds by default
  onStatusChange,
  queryOptions = {},
}: UseBookingsDashboardOptions = {}) {
  // Keep track of the last timestamp to only fetch newer data
  const [lastTimestamp, setLastTimestamp] = useState<string | undefined>(undefined);
  const statsRef = useRef<DashboardStats | null>(null);
  
  // Fetch dashboard data function
  const fetchDashboardData = useCallback(async (): Promise<BookingDashboardData> => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    
    if (lastTimestamp) {
      params.append("since", lastTimestamp);
    }
    
    const response = await fetch(`/api/bookings/dashboard?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch dashboard data");
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to load dashboard data");
    }
    
    return data.data;
  }, [limit, lastTimestamp]);
  
  // Use React Query for data fetching with polling
  const query = useQuery<BookingDashboardData, Error>({
    queryKey: ["bookingsDashboard", limit],
    queryFn: fetchDashboardData,
    enabled,
    refetchInterval: enabled ? pollingInterval : false,
    ...queryOptions,
  });
  
  // Extract and format data
  const dashboardData = query.data;
  const bookingsByStatus: BookingsByStatus = {
    PENDING: [],
    CONFIRMED: [],
    COMPLETED: [],
    CANCELLED: [],
  };
  
  // Process the data when it's available
  useEffect(() => {
    if (dashboardData) {
      // Update the timestamp for the next poll
      setLastTimestamp(dashboardData.timestamp);
      
      // Call status change callback if provided
      if (onStatusChange && statsRef.current && dashboardData.stats) {
        const prevStats = statsRef.current;
        const newStats = dashboardData.stats;
        
        // Only call if there's an actual change
        if (
          prevStats.total !== newStats.total ||
          prevStats.pending !== newStats.pending ||
          prevStats.confirmed !== newStats.confirmed ||
          prevStats.completed !== newStats.completed ||
          prevStats.cancelled !== newStats.cancelled
        ) {
          onStatusChange(prevStats, newStats);
        }
      }
      
      // Update the stats ref
      if (dashboardData.stats) {
        statsRef.current = dashboardData.stats;
      }
    }
  }, [dashboardData, onStatusChange]);
  
  // Format the bookings by status
  if (dashboardData?.bookingsByStatus) {
    Object.entries(dashboardData.bookingsByStatus).forEach(([status, data]) => {
      if (bookingsByStatus[status]) {
        bookingsByStatus[status] = data.bookings;
      }
    });
  }
  
  return {
    ...query,
    bookingsByStatus,
    stats: dashboardData?.stats || {
      total: 0,
      totalAmount: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    },
    timestamp: dashboardData?.timestamp,
    // Helper method to manually refresh the data
    refreshData: () => query.refetch(),
  };
} 