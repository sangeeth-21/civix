import { executeQuery } from "@/lib/mysql";

export interface IService {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  agentId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Service {
  // Create a new service
  static async create(serviceData: Omit<IService, 'id' | 'createdAt' | 'updatedAt'>): Promise<IService> {
    const query = `
      INSERT INTO services (title, description, price, category, agentId, isActive) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      serviceData.title,
      serviceData.description,
      serviceData.price,
      serviceData.category,
      serviceData.agentId,
      serviceData.isActive !== false ? 1 : 0
    ];
    
    const result: any = await executeQuery(query, params);
    return await Service.findById(result.insertId);
  }

  // Find service by ID
  static async findById(id: number): Promise<IService | null> {
    const query = 'SELECT * FROM services WHERE id = ?';
    const services: IService[] = await executeQuery(query, [id]);
    return services.length > 0 ? services[0] : null;
  }

  // Find services with filters and pagination
  static async find(
    filters: {
      agentId?: number;
      category?: string;
      isActive?: boolean;
      search?: string;
    } = {},
    options: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ services: IService[]; total: number }> {
    let query = 'SELECT * FROM services WHERE 1=1';
    const params: any[] = [];
    
    // Apply filters
    if (filters.agentId) {
      query += ' AND agentId = ?';
      params.push(filters.agentId);
    }
    
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(filters.isActive ? 1 : 0);
    }
    
    if (filters.search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
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
    
    const services: IService[] = await executeQuery(query, params);
    return { services, total };
  }

  // Get services with agent info
  static async findWithAgent(
    filters: any = {},
    options: any = {}
  ): Promise<{ services: any[]; total: number }> {
    let query = `
      SELECT 
        s.*, 
        u.name as agentName,
        u.email as agentEmail,
        u.phone as agentPhone
      FROM services s
      LEFT JOIN users u ON s.agentId = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    // Apply filters
    if (filters.agentId) {
      query += ' AND s.agentId = ?';
      params.push(filters.agentId);
    }
    
    if (filters.category) {
      query += ' AND s.category = ?';
      params.push(filters.category);
    }
    
    if (filters.isActive !== undefined) {
      query += ' AND s.isActive = ?';
      params.push(filters.isActive ? 1 : 0);
    }
    
    if (filters.search) {
      query += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT s.*, u.name as agentName, u.email as agentEmail, u.phone as agentPhone', 'SELECT COUNT(*) as count');
    const countResult: any[] = await executeQuery(countQuery, params);
    const total = countResult[0].count;
    
    // Apply sorting and pagination
    const sort = options.sort || 's.createdAt';
    const order = options.order || 'DESC';
    query += ` ORDER BY ${sort} ${order}`;
    
    if (options.limit) {
      const offset = ((options.page || 1) - 1) * options.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(options.limit, offset);
    }
    
    const services: any[] = await executeQuery(query, params);
    return { services, total };
  }

  // Update service
  static async update(id: number, updates: Partial<IService>): Promise<IService | null> {
    const allowedFields = ['title', 'description', 'price', 'category', 'isActive'];
    
    const fields: string[] = [];
    const params: any[] = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key as keyof IService] !== undefined) {
        fields.push(`${key} = ?`);
        
        if (key === 'isActive') {
          params.push(updates[key as keyof IService] ? 1 : 0);
        } else {
          params.push(updates[key as keyof IService]);
        }
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = NOW()');
    params.push(id);
    
    const query = `UPDATE services SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
    
    return await Service.findById(id);
  }

  // Delete service
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM services WHERE id = ?';
    const result: any = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Get categories
  static async getCategories(): Promise<string[]> {
    const query = 'SELECT DISTINCT category FROM services WHERE isActive = 1 ORDER BY category';
    const result: any[] = await executeQuery(query);
    return result.map(row => row.category);
  }
}

export default Service;