# Civix Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or cloud instance)
3. **npm** or **yarn**

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production

# NextAuth Configuration
AUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@civix.com
FROM_NAME=Civix Support

# Environment
NODE_ENV=development
```

## MongoDB Setup

### Option 1: Local MongoDB

1. **Install MongoDB Community Edition:**
   - [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB service:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

3. **Verify connection:**
   ```bash
   mongosh
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create MongoDB Atlas account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster

2. **Get connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `civix`

3. **Update .env.local:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civix?retryWrites=true&w=majority
   ```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### MongoDB Connection Issues

If you see `mongoose.connect is not a function` error:

1. **Check MongoDB is running:**
   ```bash
   # Check if MongoDB is running
   mongosh --eval "db.runCommand('ping')"
   ```

2. **Verify connection string:**
   - Ensure MONGODB_URI is correct
   - Check if username/password are correct (for Atlas)
   - Verify network connectivity

3. **Test connection manually:**
   ```bash
   node -e "
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civix_fInal_production')
     .then(() => console.log('Connected to MongoDB'))
     .catch(err => console.error('Connection failed:', err));
   "
   ```

### Common Issues

1. **Port 27017 already in use:**
   - Check if another MongoDB instance is running
   - Kill the process or use a different port

2. **Authentication failed:**
   - Verify username/password for MongoDB Atlas
   - Check if IP whitelist includes your IP

3. **Network timeout:**
   - Check firewall settings
   - Verify internet connection for Atlas

## Development

The application should now be running at `http://localhost:3000`

- **Login:** `/login`
- **Register:** `/register`
- **Admin Dashboard:** `/admin`
- **Super Admin:** `/super-admin` 