import bcrypt from "bcryptjs";
import { executeQuery } from "@/lib/mysql";

// User interfaces
export interface INotificationSettings {
  email: boolean;
  sms: boolean;
  marketing: boolean;
  reminders: boolean;
}

export interface IAppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reduceAnimations: boolean;
  highContrast: boolean;
}

export interface IPrivacySettings {
  profileVisibility: 'public' | 'contacts' | 'private';
  shareBookingHistory: boolean;
  shareContactInfo: boolean;
  allowDataCollection: boolean;
}

export interface IUserSettings {
  notifications: INotificationSettings;
  appearance: IAppearanceSettings;
  privacy: IPrivacySettings;
}

export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "USER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
  phone?: string;
  address?: string;
  isActive: boolean;
  settings?: string; // JSON string
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  // Create a new user
  static async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const query = `
      INSERT INTO users (
        name, email, password, role, phone, address, isActive, 
        settings, resetPasswordToken, resetPasswordExpires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      userData.name,
      userData.email,
      hashedPassword,
      userData.role || 'USER',
      userData.phone || null,
      userData.address || null,
      userData.isActive !== false ? 1 : 0,
      userData.settings ? JSON.stringify(userData.settings) : null,
      userData.resetPasswordToken || null,
      userData.resetPasswordExpires || null
    ];
    
    const result: any = await executeQuery(query, params);
    return await User.findById(result.insertId);
  }

  // Find user by ID
  static async findById(id: number): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const users: IUser[] = await executeQuery(query, [id]);
    
    if (users.length === 0) return null;
    
    const user = users[0];
    if (user.settings && typeof user.settings === 'string') {
      try {
        user.settings = JSON.parse(user.settings);
      } catch {
        user.settings = undefined;
      }
    }
    
    return user;
  }

  // Find user by email
  static async findByEmail(email: string): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE email = ?';
    const users: IUser[] = await executeQuery(query, [email]);
    
    if (users.length === 0) return null;
    
    const user = users[0];
    if (user.settings && typeof user.settings === 'string') {
      try {
        user.settings = JSON.parse(user.settings);
      } catch {
        user.settings = undefined;
      }
    }
    
    return user;
  }

  // Find users with filters and pagination
  static async find(
    filters: {
      role?: string;
      search?: string;
      isActive?: boolean;
    } = {},
    options: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ users: IUser[]; total: number }> {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    
    // Apply filters
    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }
    
    if (filters.isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(filters.isActive ? 1 : 0);
    }
    
    if (filters.search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
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
    
    const users: IUser[] = await executeQuery(query, params);
    
    // Parse settings for each user
    users.forEach(user => {
      if (user.settings && typeof user.settings === 'string') {
        try {
          user.settings = JSON.parse(user.settings);
        } catch {
          user.settings = undefined;
        }
      }
    });
    
    return { users, total };
  }

  // Update user
  static async update(id: number, updates: Partial<IUser>): Promise<IUser | null> {
    const allowedFields = [
      'name', 'email', 'role', 'phone', 'address', 'isActive', 
      'settings', 'lastLogin', 'resetPasswordToken', 'resetPasswordExpires'
    ];
    
    const fields: string[] = [];
    const params: any[] = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key as keyof IUser] !== undefined) {
        fields.push(`${key} = ?`);
        
        if (key === 'settings' && typeof updates[key as keyof IUser] === 'object') {
          params.push(JSON.stringify(updates[key as keyof IUser]));
        } else if (key === 'isActive') {
          params.push(updates[key as keyof IUser] ? 1 : 0);
        } else {
          params.push(updates[key as keyof IUser]);
        }
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = NOW()');
    params.push(id);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
    
    return await User.findById(id);
  }

  // Delete user
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';
    const result: any = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Compare password
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update password
  static async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?';
    const result: any = await executeQuery(query, [hashedPassword, id]);
    return result.affectedRows > 0;
  }

  // Find by reset token
  static async findByResetToken(token: string): Promise<IUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE resetPasswordToken = ? 
      AND resetPasswordExpires > NOW()
    `;
    const users: IUser[] = await executeQuery(query, [token]);
    return users.length > 0 ? users[0] : null;
  }
}

export default User;