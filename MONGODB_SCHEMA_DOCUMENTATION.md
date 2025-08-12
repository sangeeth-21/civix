# Civix MongoDB Schema Documentation

## Database Overview
- **Database Name**: `civix_fInal_production`
- **MongoDB Connection**: Local MongoDB instance (localhost:27017) or MongoDB Atlas
- **ORM**: Mongoose with TypeScript
- **Collections**: 5 main collections

## Schema Structure

### 1. Users Collection (`users`)

**Model File**: `models/User.ts`

```typescript
interface IUser {
  _id: ObjectId
  name: string                    // Required
  email: string                   // Required, unique index
  password: string                // Required, hashed with bcrypt
  role: enum                      // Required, default: "USER"
  phone?: string                  // Optional
  address?: string                // Optional  
  isActive: boolean               // Default: true
  settings?: IUserSettings        // Nested object
  lastLogin?: Date                // Optional
  resetPasswordToken?: string     // For password reset
  resetPasswordExpires?: Date     // Password reset expiry
  createdAt: Date                 // Auto-generated
  updatedAt: Date                 // Auto-generated
}
```

**Role Enum Values**:
- `USER` - Regular users who can book services
- `AGENT` - Service providers
- `ADMIN` - System administrators  
- `SUPER_ADMIN` - Super administrators with full access

**Nested Settings Schema**:
```typescript
interface IUserSettings {
  notifications: {
    email: boolean           // Default: true
    sms: boolean            // Default: false
    marketing: boolean      // Default: false
    reminders: boolean      // Default: true
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'    // Default: 'system'
    fontSize: 'small' | 'medium' | 'large' // Default: 'medium'
    reduceAnimations: boolean              // Default: false
    highContrast: boolean                  // Default: false
  }
  privacy: {
    profileVisibility: 'public' | 'contacts' | 'private' // Default: 'public'
    shareBookingHistory: boolean                          // Default: false
    shareContactInfo: boolean                             // Default: false
    allowDataCollection: boolean                          // Default: true
  }
}
```

**Indexes**:
- `email: 1` (unique)
- `role: 1`
- `resetPasswordToken: 1`

**Methods**:
- `comparePassword(candidatePassword: string): Promise<boolean>`
- Pre-save middleware for password hashing

---

### 2. Services Collection (`services`)

**Model File**: `models/Service.ts`

```typescript
interface IService {
  _id: ObjectId
  title: string               // Required
  description: string         // Required
  price: number              // Required
  category: string           // Required
  agentId: ObjectId          // Required, ref: "User"
  isActive: boolean          // Default: true
  createdAt: Date            // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

**Indexes**:
- Text search index: `{ title: "text", description: "text", category: "text" }`

**Relationships**:
- `agentId` → References `users` collection (Agent role)

---

### 3. Bookings Collection (`bookings`)

**Model File**: `models/Booking.ts`

```typescript
interface IBooking {
  _id: ObjectId
  userId: ObjectId           // Required, ref: "User"
  serviceId: ObjectId        // Required, ref: "Service" 
  agentId: ObjectId          // Required, ref: "User"
  status: enum               // Required, default: "PENDING"
  scheduledDate: Date        // Required
  amount: number             // Required
  totalAmount?: number       // Optional
  rating?: number            // Optional, min: 1, max: 5
  notes?: string             // Optional, user notes
  agentNotes?: string        // Optional, agent notes
  notifications?: object     // Nested notification tracking
  statusHistory?: array      // Array of status changes
  lastStatusUpdate?: Date    // Last status change timestamp
  paymentStatus?: enum       // Optional, default: "PENDING"
  createdAt: Date            // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

**Status Enum Values**:
- `PENDING` - Newly created booking
- `CONFIRMED` - Agent confirmed the booking
- `COMPLETED` - Service completed
- `CANCELLED` - Booking cancelled

**Payment Status Enum Values**:
- `PENDING` - Payment not processed
- `PAID` - Payment completed
- `REFUNDED` - Payment refunded

**Nested Notifications Schema**:
```typescript
notifications: {
  confirmationSent: boolean           // Default: false
  confirmationSentAt?: Date
  statusUpdateSent: boolean           // Default: false  
  statusUpdateSentAt?: Date
  lastNotificationType?: string
  notificationHistory?: Array<{
    type: string                      // Required
    sentAt: Date                      // Default: Date.now
    success: boolean                  // Default: true
  }>
}
```

**Status History Schema**:
```typescript
statusHistory: Array<{
  status: string                      // Required
  updatedAt: Date                     // Default: Date.now
  updatedBy?: ObjectId               // Optional, ref: "User"
}>
```

**Indexes**:
- `{ userId: 1, status: 1 }` (compound)
- `{ agentId: 1, status: 1 }` (compound)
- `{ scheduledDate: 1 }`
- `{ lastStatusUpdate: -1 }`

**Middleware**:
- Pre-save middleware to track status changes automatically

**Relationships**:
- `userId` → References `users` collection (Customer)
- `serviceId` → References `services` collection
- `agentId` → References `users` collection (Agent role)

---

### 4. Support Tickets Collection (`supporttickets`)

**Model File**: `models/SupportTicket.ts`

```typescript
interface ISupportTicket {
  _id: ObjectId
  userId: ObjectId           // Required, ref: "User"
  subject: string            // Required
  description: string        // Required
  status: enum               // Default: "open"
  priority: enum             // Default: "medium"
  category: enum             // Default: "other"
  responses: array           // Array of ticket responses
  createdAt: Date            // Default: Date.now
  updatedAt: Date            // Default: Date.now
  userDeleted: boolean       // Default: false
}
```

**Status Enum Values**:
- `open` - Newly created ticket
- `in_progress` - Being worked on
- `resolved` - Issue resolved
- `closed` - Ticket closed

**Priority Enum Values**:
- `low` - Low priority
- `medium` - Medium priority  
- `high` - High priority
- `urgent` - Urgent priority

**Category Enum Values**:
- `technical` - Technical issues
- `billing` - Billing related
- `account` - Account issues
- `booking` - Booking related
- `other` - Other issues

**Nested Responses Schema**:
```typescript
interface ITicketResponse {
  userId: ObjectId           // Required, ref: "User"
  message: string            // Required
  createdAt: Date            // Default: Date.now
  isSystemMessage?: boolean  // Default: false
}
```

**Indexes**:
- `{ userId: 1, status: 1 }` (compound)
- `{ createdAt: -1 }`
- `{ updatedAt: -1 }`

**Relationships**:
- `userId` → References `users` collection
- `responses.userId` → References `users` collection

---

### 5. Audit Logs Collection (`auditlogs`)

**Model File**: `models/AuditLog.ts`

```typescript
interface IAuditLog {
  _id: ObjectId
  userId: ObjectId           // Required, ref: "User"
  action: string             // Required, indexed
  entityId?: ObjectId        // Optional, indexed
  entityType?: string        // Optional, indexed
  details?: object           // Optional, flexible object
  ipAddress?: string         // Optional
  userAgent?: string         // Optional
  createdAt: Date            // Default: Date.now
}
```

**Predefined Action Constants**:
```typescript
export const AuditActions = {
  // Authentication
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT", 
  LOGIN_FAILED: "LOGIN_FAILED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
  
  // User Management
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED", 
  USER_DELETED: "USER_DELETED",
  
  // Booking Management
  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_UPDATED: "BOOKING_UPDATED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED", 
  BOOKING_COMPLETED: "BOOKING_COMPLETED",
  
  // Service Management
  SERVICE_CREATED: "SERVICE_CREATED",
  SERVICE_UPDATED: "SERVICE_UPDATED",
  SERVICE_DELETED: "SERVICE_DELETED",
  
  // Admin Actions
  SETTING_CHANGED: "SETTING_CHANGED",
  ROLE_CHANGED: "ROLE_CHANGED"
}
```

**Indexes**:
- `action: 1`
- `entityId: 1` 
- `entityType: 1`

**Utility Functions**:
- `createAuditLog()` - Helper function for creating audit entries
- Non-blocking operation (won't fail main operations if audit fails)

**Relationships**:
- `userId` → References `users` collection
- `entityId` → Can reference any collection based on `entityType`

---

## Database Relationships Diagram

```
Users (users)
├── 1:N → Services (agentId)
├── 1:N → Bookings (userId - customer)  
├── 1:N → Bookings (agentId - service provider)
├── 1:N → Support Tickets (userId)
├── 1:N → Audit Logs (userId)
└── 1:N → Ticket Responses (userId)

Services (services)
├── N:1 → Users (agentId)
└── 1:N → Bookings (serviceId)

Bookings (bookings)
├── N:1 → Users (userId - customer)
├── N:1 → Users (agentId - agent)
└── N:1 → Services (serviceId)

Support Tickets (supporttickets)
├── N:1 → Users (userId)
└── 1:N → Responses (embedded)

Audit Logs (auditlogs)
└── N:1 → Users (userId)
```

## Connection Configuration

**Environment Variables**:
```env
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production
```

**Connection Options**:
```typescript
{
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true
}
```

## Data Validation & Security

### Password Security
- Passwords hashed using `bcryptjs` with salt rounds: 10
- Password comparison method available on User model

### Input Validation  
- Zod schemas used for API request validation
- Mongoose schema validation at database level
- Email format validation
- Enum constraints for status fields

### Authorization Levels
1. **USER**: Own bookings, own support tickets, own profile
2. **AGENT**: Assigned bookings, own services, assigned users  
3. **ADMIN**: All users, all bookings, all services, all tickets
4. **SUPER_ADMIN**: Full system access, user role management

## API Query Patterns

### Common Query Examples
```typescript
// Get user's bookings with pagination
Booking.find({ userId: userId })
  .populate('serviceId', 'title description price category')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)

// Search users with filters
User.find({
  role: 'USER',
  $or: [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } }
  ]
}).select('-password')

// Get services with text search
Service.find({ $text: { $search: searchTerm } })
  .where('isActive').equals(true)
```

## Performance Considerations

### Indexes Created
- User email uniqueness and lookups
- Booking queries by user/agent and status
- Text search on services
- Audit log queries by action and entity
- Support ticket queries by user and status

### Query Optimization
- Use `.lean()` for read-only operations
- Select specific fields to reduce payload
- Compound indexes for multi-field queries
- Pagination implemented for large datasets

## Backup & Migration Strategy

### Regular Backups
```bash
mongodump --db civix_fInal_production --out backup/
```

### Data Migration
- Mongoose migrations for schema changes
- Version tracking in database
- Rollback capabilities for failed migrations

This schema supports a full-featured service management platform with role-based access control, comprehensive audit trails, and scalable booking management.