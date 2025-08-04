import { ApiResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Generic API client for making HTTP requests
 */
export const apiClient = {
  /**
   * Make a GET request
   * @param endpoint - The API endpoint
   * @returns Promise with the response data
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Make a POST request
   * @param endpoint - The API endpoint
   * @param data - The data to send
   * @returns Promise with the response data
   */
  async post<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Make a PATCH request
   * @param endpoint - The API endpoint
   * @param data - The data to send
   * @returns Promise with the response data
   */
  async patch<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Make a DELETE request
   * @param endpoint - The API endpoint
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
}; 