# Civix - Service Management Platform 🏢

A comprehensive service management platform built with **Next.js 15**, **React 19**, **TypeScript**, and **MySQL**. Designed for efficient booking management, user roles, and service operations with **cPanel hosting compatibility**.

## 🌟 Key Features

### 👥 Multi-Role System
- **USER**: Book services, manage bookings, view history
- **AGENT**: Manage assigned services, handle bookings, respond to customers
- **ADMIN**: Oversee operations, manage users, view analytics
- **SUPER_ADMIN**: Full system control, user management, system configuration

### 📋 Core Functionality
- **Service Management**: Create, update, and manage service listings
- **Booking System**: Real-time booking with status tracking and notifications
- **User Management**: Role-based access control with comprehensive user profiles
- **Support System**: Ticket management with response threading
- **Audit Logging**: Complete activity tracking for security and compliance
- **Email Notifications**: Automated booking confirmations and status updates

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: User preference-based theming
- **Interactive Components**: Built with Radix UI and Framer Motion
- **Real-time Updates**: Live status changes and notifications

## 🚀 Technology Stack

### Frontend
- **Next.js 15.4.2** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Hook Form + Zod** - Form validation

### Backend & Database
- **MySQL** - Relational database with full ACID compliance
- **NextAuth.js** - Authentication and session management
- **bcryptjs** - Password hashing and security
- **Nodemailer** - Email service integration
- **MySQL2** - Database connection pooling

### Development
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📊 Database Schema (MySQL)

### Core Tables
- **users** - User accounts with role management and settings
- **services** - Service listings with agent assignments
- **bookings** - Booking records with status tracking and history
- **support_tickets** - Help desk ticketing system
- **ticket_responses** - Support ticket conversation threading
- **audit_logs** - Complete activity logging for compliance

### Authentication Tables (NextAuth.js)
- **accounts** - OAuth provider accounts
- **sessions** - User session management
- **verification_tokens** - Email/phone verification

## 🔧 Installation & Setup

### Prerequisites
- **Node.js 18+**
- **MySQL 8.0+** (or cPanel MySQL)
- **npm/yarn/pnpm**

### 1. Clone Repository
```bash
git clone https://github.com/sangeeth-21/civix.git
cd civix
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Database Setup

#### For Local Development:
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE civix_dev;
EXIT;
```

#### For cPanel Hosting:
1. Login to cPanel
2. Go to **MySQL® Databases**
3. Create database: `username_civix`
4. Create user: `username_civixuser`
5. Add user to database with **ALL PRIVILEGES**

### 4. Run SQL Schema
Execute the complete SQL schema from `SQL_SCHEMA_AND_DEPLOYMENT.md`:

```sql
-- Copy and run all SQL commands from the deployment guide
-- This creates all tables, indexes, and sample data
```

### 5. Environment Configuration

Create `.env.local` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# Application Settings
NODE_ENV=development
```

### 6. Run Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment to cPanel

### 1. Build Application
```bash
npm run build
```

### 2. Upload Files
- Upload all project files to `public_html` or subdirectory
- Include `.next` folder (built application)
- Upload `node_modules` or run `npm install` on server

### 3. cPanel Configuration
- Set up MySQL database and user
- Update `.env.local` with production values
- Configure Node.js app (if supported)

### 4. Production Environment Variables
```env
DB_HOST=localhost
DB_USER=cpanelusername_civixuser
DB_PASSWORD=production_password
DB_NAME=cpanelusername_civix
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret-key
NODE_ENV=production
```

## 🎯 Usage Guide

### Default Admin Account
```
Email: admin@civix.com
Password: password (Change immediately!)
Role: SUPER_ADMIN
```

### User Roles & Permissions

#### 🔵 USER
- Register and login
- Browse available services
- Create and manage bookings
- Submit support tickets
- Update profile and preferences

#### 🟢 AGENT
- Manage assigned services
- View and update bookings
- Respond to customer support tickets
- Access customer communication tools

#### 🟡 ADMIN
- Manage all users and agents
- Oversee all bookings and services
- Access system analytics
- Handle escalated support tickets

#### 🔴 SUPER_ADMIN
- Full system access
- User role management
- System configuration
- Audit log access
- Database management

## 📁 Project Structure

```
civix/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   ├── admin/         # Admin endpoints
│   │   ├── auth/          # Authentication
│   │   ├── bookings/      # Booking management
│   │   ├── services/      # Service management
│   │   └── support/       # Support system
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── mysql.ts           # Database connection
│   ├── api-utils.ts       # API utilities
│   ├── auth-utils.ts      # Authentication helpers
│   └── services/          # Business logic
├── models/                # MySQL data models
│   ├── User.ts            # User model
│   ├── Service.ts         # Service model
│   ├── Booking.ts         # Booking model
│   ├── SupportTicket.ts   # Support model
│   └── AuditLog.ts        # Audit model
├── types/                 # TypeScript definitions
├── SQL_SCHEMA_AND_DEPLOYMENT.md  # Database & deployment guide
└── README.md              # This file
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure session management
- **Role-Based Access**: Granular permission system
- **Audit Logging**: Complete activity tracking
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: API endpoint protection

## 📧 Email Integration

The platform supports automated email notifications:

- **Booking Confirmations**: Sent to users upon booking
- **Status Updates**: Notify users of booking changes
- **Agent Notifications**: Alert agents of new bookings
- **Support Responses**: Email notifications for ticket updates

Configure SMTP settings in environment variables for email functionality.

## 🎨 UI Components

Built with modern, accessible components:

- **Forms**: React Hook Form with Zod validation
- **Tables**: Sortable, filterable data tables
- **Modals**: Accessible dialog components
- **Navigation**: Responsive sidebar and mobile menu
- **Themes**: Dark/light mode support
- **Animations**: Smooth transitions with Framer Motion

## 📈 Performance

- **Database Indexing**: Optimized MySQL indexes for fast queries
- **Connection Pooling**: Efficient database connection management
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: API response caching where appropriate

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Database Migrations
When updating the schema, always:
1. Backup existing data
2. Test migrations locally
3. Update both development and production
4. Document changes in SQL_SCHEMA_AND_DEPLOYMENT.md

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@civix.com
- Documentation: [SQL_SCHEMA_AND_DEPLOYMENT.md](SQL_SCHEMA_AND_DEPLOYMENT.md)

## 🚀 Roadmap

- [ ] Real-time notifications with WebSocket
- [ ] Mobile app with React Native
- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API rate limiting and throttling
- [ ] Advanced reporting features
- [ ] Integration with external calendar systems

---

**Civix** - Empowering efficient service management with modern technology 🚀