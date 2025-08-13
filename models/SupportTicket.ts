import { executeQuery } from "@/lib/mysql";

export interface ITicketResponse {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  createdAt: Date;
  isSystemMessage?: boolean;
}

export interface ISupportTicket {
  id: number;
  userId: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'booking' | 'other';
  responses?: ITicketResponse[];
  createdAt: Date;
  updatedAt: Date;
  userDeleted: boolean;
}

export class SupportTicket {
  // Create a new support ticket
  static async create(ticketData: Omit<ISupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'responses'>): Promise<ISupportTicket> {
    const query = `
      INSERT INTO support_tickets (
        userId, subject, description, status, priority, category, userDeleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      ticketData.userId,
      ticketData.subject,
      ticketData.description,
      ticketData.status || 'open',
      ticketData.priority || 'medium',
      ticketData.category || 'other',
      ticketData.userDeleted || false
    ];
    
    const result: any = await executeQuery(query, params);
    return await SupportTicket.findById(result.insertId);
  }

  // Find ticket by ID with responses
  static async findById(id: number): Promise<ISupportTicket | null> {
    const ticketQuery = 'SELECT * FROM support_tickets WHERE id = ?';
    const tickets: ISupportTicket[] = await executeQuery(ticketQuery, [id]);
    
    if (tickets.length === 0) return null;
    
    const ticket = tickets[0];
    
    // Get responses for this ticket
    const responsesQuery = `
      SELECT r.*, u.name as userName 
      FROM ticket_responses r 
      LEFT JOIN users u ON r.userId = u.id 
      WHERE r.ticketId = ? 
      ORDER BY r.createdAt ASC
    `;
    const responses: any[] = await executeQuery(responsesQuery, [id]);
    ticket.responses = responses;
    
    return ticket;
  }

  // Find tickets with filters and pagination
  static async find(
    filters: {
      userId?: number;
      status?: string;
      priority?: string;
      category?: string;
      userDeleted?: boolean;
    } = {},
    options: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ tickets: ISupportTicket[]; total: number }> {
    let query = 'SELECT * FROM support_tickets WHERE 1=1';
    const params: any[] = [];
    
    // Apply filters
    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.userDeleted !== undefined) {
      query += ' AND userDeleted = ?';
      params.push(filters.userDeleted ? 1 : 0);
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
    
    const tickets: ISupportTicket[] = await executeQuery(query, params);
    
    // Get responses for each ticket
    for (const ticket of tickets) {
      const responsesQuery = `
        SELECT r.*, u.name as userName 
        FROM ticket_responses r 
        LEFT JOIN users u ON r.userId = u.id 
        WHERE r.ticketId = ? 
        ORDER BY r.createdAt ASC
      `;
      const responses: any[] = await executeQuery(responsesQuery, [ticket.id]);
      ticket.responses = responses;
    }
    
    return { tickets, total };
  }

  // Update ticket
  static async update(id: number, updates: Partial<ISupportTicket>): Promise<ISupportTicket | null> {
    const allowedFields = ['subject', 'description', 'status', 'priority', 'category', 'userDeleted'];
    
    const fields: string[] = [];
    const params: any[] = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key as keyof ISupportTicket] !== undefined) {
        fields.push(`${key} = ?`);
        
        if (key === 'userDeleted') {
          params.push(updates[key as keyof ISupportTicket] ? 1 : 0);
        } else {
          params.push(updates[key as keyof ISupportTicket]);
        }
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = NOW()');
    params.push(id);
    
    const query = `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
    
    return await SupportTicket.findById(id);
  }

  // Delete ticket
  static async delete(id: number): Promise<boolean> {
    // First delete all responses
    await executeQuery('DELETE FROM ticket_responses WHERE ticketId = ?', [id]);
    
    // Then delete the ticket
    const query = 'DELETE FROM support_tickets WHERE id = ?';
    const result: any = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Add response to ticket
  static async addResponse(
    ticketId: number, 
    userId: number, 
    message: string, 
    isSystemMessage: boolean = false
  ): Promise<ITicketResponse> {
    const query = `
      INSERT INTO ticket_responses (ticketId, userId, message, isSystemMessage) 
      VALUES (?, ?, ?, ?)
    `;
    
    const params = [ticketId, userId, message, isSystemMessage ? 1 : 0];
    const result: any = await executeQuery(query, params);
    
    // Update ticket's updatedAt
    await executeQuery('UPDATE support_tickets SET updatedAt = NOW() WHERE id = ?', [ticketId]);
    
    // Return the created response
    const responseQuery = `
      SELECT r.*, u.name as userName 
      FROM ticket_responses r 
      LEFT JOIN users u ON r.userId = u.id 
      WHERE r.id = ?
    `;
    const responses: ITicketResponse[] = await executeQuery(responseQuery, [result.insertId]);
    return responses[0];
  }

  // Get ticket statistics
  static async getStats(filters: { userId?: number } = {}): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as totalTickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as openTickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgressTickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedTickets,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedTickets,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgentTickets,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as highPriorityTickets
      FROM support_tickets 
      WHERE userDeleted = 0
    `;
    const params: any[] = [];
    
    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }
    
    const result: any[] = await executeQuery(query, params);
    return result[0] || {};
  }
}

export default SupportTicket;