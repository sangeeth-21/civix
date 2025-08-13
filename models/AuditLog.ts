import { executeQuery } from "@/lib/mysql";

export interface IAuditLog {
  id: number;
  userId: number;
  action: string;
  entityId?: number;
  entityType?: string;
  details?: string; // JSON string
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Define common audit actions as constants
export const AuditActions = {
  // Authentication actions
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
  
  // User account actions
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  
  // Booking actions
  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_UPDATED: "BOOKING_UPDATED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  BOOKING_COMPLETED: "BOOKING_COMPLETED",
  
  // Service actions
  SERVICE_CREATED: "SERVICE_CREATED",
  SERVICE_UPDATED: "SERVICE_UPDATED",
  SERVICE_DELETED: "SERVICE_DELETED",
  
  // Admin actions
  SETTING_CHANGED: "SETTING_CHANGED",
  ROLE_CHANGED: "ROLE_CHANGED",
};

export class AuditLog {
  // Create audit log entry
  static async create(auditData: Omit<IAuditLog, 'id' | 'createdAt'>): Promise<IAuditLog> {
    try {
      const query = `
        INSERT INTO audit_logs (
          userId, action, entityId, entityType, details, ipAddress, userAgent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        auditData.userId,
        auditData.action,
        auditData.entityId || null,
        auditData.entityType || null,
        auditData.details || null,
        auditData.ipAddress || null,
        auditData.userAgent || null
      ];
      
      const result: any = await executeQuery(query, params);
      return await AuditLog.findById(result.insertId);
    } catch (error) {
      // Non-blocking - we don't want to fail operations if audit logging fails
      console.warn('Audit log creation failed:', error);
      return null;
    }
  }

  // Find audit log by ID
  static async findById(id: number): Promise<IAuditLog | null> {
    const query = 'SELECT * FROM audit_logs WHERE id = ?';
    const logs: IAuditLog[] = await executeQuery(query, [id]);
    
    if (logs.length === 0) return null;
    
    const log = logs[0];
    if (log.details && typeof log.details === 'string') {
      try {
        log.details = JSON.parse(log.details);
      } catch {
        log.details = undefined;
      }
    }
    
    return log;
  }

  // Find audit logs with filters and pagination
  static async find(
    filters: {
      userId?: number;
      action?: string;
      entityType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    options: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    
    // Apply filters
    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }
    
    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    
    if (filters.entityType) {
      query += ' AND entityType = ?';
      params.push(filters.entityType);
    }
    
    if (filters.dateFrom) {
      query += ' AND createdAt >= ?';
      params.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query += ' AND createdAt <= ?';
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
    
    const logs: IAuditLog[] = await executeQuery(query, params);
    
    // Parse details for each log
    logs.forEach(log => {
      if (log.details && typeof log.details === 'string') {
        try {
          log.details = JSON.parse(log.details);
        } catch {
          log.details = undefined;
        }
      }
    });
    
    return { logs, total };
  }

  // Delete old logs (cleanup)
  static async cleanup(olderThanDays: number = 90): Promise<number> {
    const query = 'DELETE FROM audit_logs WHERE createdAt < DATE_SUB(NOW(), INTERVAL ? DAY)';
    const result: any = await executeQuery(query, [olderThanDays]);
    return result.affectedRows;
  }
}

// Create audit log utility function
export const createAuditLog = async (
  userId: number,
  action: string,
  data: {
    entityId?: number;
    entityType?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }
) => {
  try {
    return await AuditLog.create({
      userId,
      action,
      entityId: data.entityId,
      entityType: data.entityType,
      details: data.details ? JSON.stringify(data.details) : undefined,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch (error) {
    // Non-blocking - we don't want to fail operations if audit logging fails
    console.warn('Audit log creation failed:', error);
    return null;
  }
};

export default AuditLog;