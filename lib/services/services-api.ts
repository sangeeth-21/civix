import { apiClient } from "@/lib/services/api";
import { Service, ApiResponse } from "@/types";

/**
 * Service-specific API client
 */
export const servicesApi = {
  /**
   * Get all services
   * @returns Promise with the services data
   */
  async getAll(): Promise<ApiResponse<Service[]>> {
    return apiClient.get<Service[]>("/services");
  },

  /**
   * Get a service by ID
   * @param id - The service ID
   * @returns Promise with the service data
   */
  async getById(id: string): Promise<ApiResponse<Service>> {
    return apiClient.get<Service>(`/services/${id}`);
  },

  /**
   * Create a new service
   * @param service - The service data
   * @returns Promise with the created service
   */
  async create(service: Partial<Service>): Promise<ApiResponse<Service>> {
    return apiClient.post<Service>("/services", service);
  },

  /**
   * Update a service
   * @param id - The service ID
   * @param service - The service data
   * @returns Promise with the updated service
   */
  async update(id: string, service: Partial<Service>): Promise<ApiResponse<Service>> {
    return apiClient.patch<Service>(`/services/${id}`, service);
  },

  /**
   * Delete a service
   * @param id - The service ID
   * @returns Promise with the result
   */
  async delete(id: string): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return apiClient.delete<{ success: boolean; message?: string }>(`/services/${id}`);
  },
}; 