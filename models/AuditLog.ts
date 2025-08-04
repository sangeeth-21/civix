import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  entityId?: mongoose.Types.ObjectId;
  entityType?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    entityType: {
      type: String,
      index: true,
    },
    details: {
      type: Object,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We only care about creation time
  }
);

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

// Create audit log utility function
export const createAuditLog = async (
  userId: string | mongoose.Types.ObjectId,
  action: string,
  data: {
    entityId?: string | mongoose.Types.ObjectId;
    entityType?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }
) => {
  try {
    // Check if AuditLog model is available
    if (!AuditLog) {
      return null;
    }
    
    return await AuditLog.create({
      userId,
      action,
      ...data,
    });
  } catch (error) {
    // Non-blocking - we don't want to fail operations if audit logging fails
    return null;
  }
};

// Safe model creation that works in both Node.js and Edge runtime
const AuditLog: mongoose.Model<IAuditLog> | null = (() => {
  try {
    // Check if we're in an environment where mongoose.models is available
    if (mongoose.models && mongoose.models.AuditLog) {
      return mongoose.models.AuditLog as mongoose.Model<IAuditLog>;
    }
    return mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
  } catch (error) {
    // In edge runtime or other environments where mongoose.models is not available
    // Return a mock model that won't break the import
    return null;
  }
})();

export default AuditLog; 