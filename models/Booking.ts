import { executeQuery } from "@/lib/mysql";

export interface IBooking {
  id: number;
  userId: number;
  serviceId: number;
  agentId: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledDate: Date;
  amount: number;
  totalAmount?: number;
  rating?: number;
  notes?: string;
  agentNotes?: string;
  notifications?: string; // JSON string
  statusHistory?: string; // JSON string
  lastStatusUpdate?: Date;
  paymentStatus?: "PENDING" | "PAID" | "REFUNDED";
  createdAt: Date;
  updatedAt: Date;
}

export class Booking {
  // Create a new booking
  static async create(bookingData: Omit<IBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBooking> {
    const query = `
      INSERT INTO bookings (
        userId, serviceId, agentId, status, scheduledDate, amount, 
        totalAmount, rating, notes, agentNotes, notifications, 
        statusHistory, lastStatusUpdate, paymentStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const statusHistory = [{
      status: bookingData.status || 'PENDING',
      updatedAt: new Date(),
      updatedBy: bookingData.userId
    }];
    
    const params = [
      bookingData.userId,
      bookingData.serviceId,
      bookingData.agentId,
      bookingData.status || 'PENDING',
      bookingData.scheduledDate,
      bookingData.amount,
      bookingData.totalAmount || bookingData.amount,
      bookingData.rating || null,
      bookingData.notes || null,
      bookingData.agentNotes || null,
      bookingData.notifications ? JSON.stringify(bookingData.notifications) : JSON.stringify({
        confirmationSent: false,
        statusUpdateSent: false,
        notificationHistory: []
      }),
      JSON.stringify(statusHistory),
      new Date(),
      bookingData.paymentStatus || 'PENDING'
    ];
    
    const result: any = await executeQuery(query, params);
    return await Booking.findById(result.insertId);
  }

  // Find booking by ID
  static async findById(id: number): Promise<IBooking | null> {
    const query = 'SELECT * FROM bookings WHERE id = ?';
    const bookings: IBooking[] = await executeQuery(query, [id]);
    
    if (bookings.length === 0) return null;
    
    const booking = bookings[0];
    // Parse JSON fields
    if (booking.notifications && typeof booking.notifications === 'string') {
      try {
        booking.notifications = JSON.parse(booking.notifications);
      } catch {
        booking.notifications = undefined;
      }
    }
    
    if (booking.statusHistory && typeof booking.statusHistory === 'string') {
      try {
        booking.statusHistory = JSON.parse(booking.statusHistory);
      } catch {
        booking.statusHistory = undefined;
      }
    }
    
    return booking;
  }

  // Find bookings with filters and pagination
  static async find(
    filters: {
      userId?: number;
      agentId?: number;
      serviceId?: number;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    options: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ bookings: IBooking[]; total: number }> {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];
    
    // Apply filters
    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }
    
    if (filters.agentId) {
      query += ' AND agentId = ?';
      params.push(filters.agentId);
    }
    
    if (filters.serviceId) {
      query += ' AND serviceId = ?';
      params.push(filters.serviceId);
    }
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.dateFrom) {
      query += ' AND scheduledDate >= ?';
      params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query += ' AND scheduledDate <= ?';
      params.push(filters.dateTo);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult: any[] = await executeQuery(countQuery, params);
    const total = countResult[0].count;
    
    // Apply sorting and pagination
    const sort = options.sort || 'createdAt';
    const order = options.order || 'DESC';
    query += ` ORDER BY ${sort} ${order}`;
    
    if (options.limit) {
      const offset = ((options.page || 1) - 1) * options.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(options.limit, offset);
    }
    
    const bookings: IBooking[] = await executeQuery(query, params);
    
    // Parse JSON fields for each booking
    bookings.forEach(booking => {
      if (booking.notifications && typeof booking.notifications === 'string') {
        try {
          booking.notifications = JSON.parse(booking.notifications);
        } catch {
          booking.notifications = undefined;
        }
      }
      
      if (booking.statusHistory && typeof booking.statusHistory === 'string') {
        try {
          booking.statusHistory = JSON.parse(booking.statusHistory);
        } catch {
          booking.statusHistory = undefined;
        }
      }
    });
    
    return { bookings, total };
  }

  // Get bookings with related data
  static async findWithDetails(
    filters: any = {},
    options: any = {}
  ): Promise<{ bookings: any[]; total: number }> {
    let query = `
      SELECT 
        b.*,
        u.name as userName,
        u.email as userEmail,
        u.phone as userPhone,
        s.title as serviceTitle,
        s.description as serviceDescription,
        s.category as serviceCategory,
        a.name as agentName,
        a.email as agentEmail,
        a.phone as agentPhone
      FROM bookings b
      LEFT JOIN users u ON b.userId = u.id
      LEFT JOIN services s ON b.serviceId = s.id
      LEFT JOIN users a ON b.agentId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    // Apply filters
    if (filters.userId) {
      query += ' AND b.userId = ?';
      params.push(filters.userId);
    }
    
    if (filters.agentId) {
      query += ' AND b.agentId = ?';
      params.push(filters.agentId);
    }
    
    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT b.*, u.name as userName, u.email as userEmail, u.phone as userPhone, s.title as serviceTitle, s.description as serviceDescription, s.category as serviceCategory, a.name as agentName, a.email as agentEmail, a.phone as agentPhone', 'SELECT COUNT(*) as count');
    const countResult: any[] = await executeQuery(countQuery, params);
    const total = countResult[0].count;
    
    // Apply sorting and pagination
    const sort = options.sort || 'b.createdAt';
    const order = options.order || 'DESC';
    query += ` ORDER BY ${sort} ${order}`;
    
    if (options.limit) {
      const offset = ((options.page || 1) - 1) * options.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(options.limit, offset);
    }
    
    const bookings: any[] = await executeQuery(query, params);
    
    // Parse JSON fields
    bookings.forEach(booking => {
      if (booking.notifications && typeof booking.notifications === 'string') {
        try {
          booking.notifications = JSON.parse(booking.notifications);
        } catch {
          booking.notifications = undefined;
        }
      }
      
      if (booking.statusHistory && typeof booking.statusHistory === 'string') {
        try {
          booking.statusHistory = JSON.parse(booking.statusHistory);
        } catch {
          booking.statusHistory = undefined;
        }
      }
    });
    
    return { bookings, total };
  }

  // Update booking status with history tracking
  static async updateStatus(
    id: number, 
    newStatus: string, 
    updatedBy: number,
    agentNotes?: string
  ): Promise<IBooking | null> {
    // First get current booking
    const currentBooking = await Booking.findById(id);
    if (!currentBooking) return null;
    
    // Parse current status history
    let statusHistory: any[] = [];
    if (currentBooking.statusHistory && typeof currentBooking.statusHistory === 'string') {
      try {
        statusHistory = JSON.parse(currentBooking.statusHistory);
      } catch {
        statusHistory = [];
      }
    }
    
    // Add new status to history
    statusHistory.push({
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: updatedBy
    });
    
    const updates: any = {
      status: newStatus,
      lastStatusUpdate: new Date(),
      statusHistory: JSON.stringify(statusHistory)
    };
    
    if (agentNotes) {
      updates.agentNotes = agentNotes;
    }
    
    return await Booking.update(id, updates);
  }

  // Update booking
  static async update(id: number, updates: Partial<IBooking>): Promise<IBooking | null> {
    const allowedFields = [
      'status', 'scheduledDate', 'amount', 'totalAmount', 'rating', 
      'notes', 'agentNotes', 'notifications', 'statusHistory', 
      'lastStatusUpdate', 'paymentStatus'
    ];
    
    const fields: string[] = [];
    const params: any[] = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key as keyof IBooking] !== undefined) {
        fields.push(`${key} = ?`);
        
        if (key === 'notifications' || key === 'statusHistory') {
          const value = updates[key as keyof IBooking];
          params.push(typeof value === 'object' ? JSON.stringify(value) : value);
        } else {
          params.push(updates[key as keyof IBooking]);
        }
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = NOW()');
    params.push(id);
    
    const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
    
    return await Booking.findById(id);
  }

  // Delete booking
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM bookings WHERE id = ?';
    const result: any = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Get booking statistics
  static async getStats(filters: { agentId?: number; userId?: number } = {}): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as totalBookings,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingBookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmedBookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedBookings,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledBookings,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as totalRevenue,
        COALESCE(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 0) as averageRating
      FROM bookings 
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (filters.agentId) {
      query += ' AND agentId = ?';
      params.push(filters.agentId);
    }
    
    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }
    
    const result: any[] = await executeQuery(query, params);
    return result[0] || {};
  }
}

export default Booking;