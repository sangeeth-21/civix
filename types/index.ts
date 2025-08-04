export interface User {
  _id: string
  email: string
  name: string
  role: 'USER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN'
  phone?: string
  address?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  _id: string
  title: string
  description: string
  price: number
  category: string
  agentId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Booking {
  _id: string
  userId: string
  serviceId: string
  agentId: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  scheduledDate: Date
  amount: number
  totalAmount?: number
  rating?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
