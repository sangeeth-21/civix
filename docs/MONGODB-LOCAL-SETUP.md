# MongoDB Local Setup Guide for Civix

This guide will help you set up MongoDB locally for the Civix project.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Community Edition

## Step 1: Install MongoDB

### Windows
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a Windows service and should start automatically
4. Verify installation by opening Command Prompt and running:
   ```bash
   mongod --version
   ```

### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

## Step 2: Verify MongoDB Installation

### Check if MongoDB is running
```bash
# Windows
net start MongoDB

# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod
```

### Connect to MongoDB
```bash
# Connect to MongoDB shell
mongosh

# You should see something like:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/
# Using MongoDB: 7.0.x
# ...
```

## Step 3: Set Up Civix Project

### 1. Run the setup script
```bash
npm run setup:local-mongodb
```

This will create a `.env.local` file with the following configuration:
```env
# Database Configuration - Local MongoDB
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=your_generated_secret
NEXTAUTH_SECRET=your_generated_secret

# Debug Settings
NEXTAUTH_DEBUG=true

# Site Configuration
NEXT_PUBLIC_SITE_NAME=Civix
NEXT_PUBLIC_SITE_DESCRIPTION=Professional service booking platform
NEXT_PUBLIC_CONTACT_EMAIL=support@civix.com
NEXT_PUBLIC_CONTACT_PHONE=+1 (555) 123-4567

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Test MongoDB connection
```bash
npm run test:mongodb
```

You should see output like:
```
🧪 Testing MongoDB connection...

📋 Configuration:
   • MongoDB URI: mongodb://localhost:27017/civix_fInal_production
   • NODE_ENV: development

🔄 Attempting to connect to MongoDB...
✅ MongoDB connected successfully!
   • Database: civix_test
   • Host: localhost
   • Port: 27017
   • Ready State: 1

🧪 Testing database operations...
📚 Available databases:
   • civix_test (0.00 MB)
   • admin (0.00 MB)
   • local (0.00 MB)
✅ Test document inserted successfully
🧹 Test document cleaned up

🎉 MongoDB connection test completed successfully!
🔒 Connection closed
```

### 3. Start the development server
```bash
npm run dev
```

You should see in the console:
```
[DB] NODE_ENV: development
[DB] Raw MONGODB_URI: mongodb://localhost:27017/civix_fInal_production
[DB] Using MongoDB URI (sanitized): mongodb://localhost:27017/civix_fInal_production
[DB] isServer: true
[DB] Initialized global.mongoose cache
[DB] MongoDB connection attempt - check if MongoDB is running locally
✅ MongoDB connected successfully
[DB] Database: civix_test
[DB] Host: localhost
[DB] Port: 27017
```

### 4. Seed the database (optional)
```bash
npm run seed:all
```

## Step 4: Using MongoDB Compass

MongoDB Compass is a GUI for MongoDB that makes it easy to explore and manipulate your data.

### Install MongoDB Compass
1. Download from [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Install and open MongoDB Compass
3. Connect to: `mongodb://localhost:27017`
4. You should see the `civix_test` database

### Explore Collections
After seeding the database, you should see collections like:
- `users`
- `services`
- `bookings`
- `supporttickets`
- `auditlogs`

## Troubleshooting

### MongoDB is not running
**Error**: `ECONNREFUSED`

**Solution**:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port 27017 is already in use
**Error**: `EADDRINUSE`

**Solution**:
```bash
# Find process using port 27017
lsof -i :27017

# Kill the process
kill -9 <PID>
```

### Permission denied
**Error**: `EACCES`

**Solution**:
```bash
# Linux/macOS - Check MongoDB data directory permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

### Database not found in Compass
**Solution**:
1. Make sure you've seeded the database: `npm run seed:all`
2. Check if collections exist by running the test script: `npm run test:mongodb`
3. Refresh MongoDB Compass

## Database Schema

The Civix project uses the following collections:

### Users
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `role`: String (USER, AGENT, ADMIN, SUPER_ADMIN)
- `isActive`: Boolean
- `createdAt`: Date
- `updatedAt`: Date

### Services
- `_id`: ObjectId
- `title`: String
- `description`: String
- `price`: Number
- `category`: String
- `agentId`: ObjectId (reference to User)
- `isActive`: Boolean
- `createdAt`: Date
- `updatedAt`: Date

### Bookings
- `_id`: ObjectId
- `userId`: ObjectId (reference to User)
- `serviceId`: ObjectId (reference to Service)
- `agentId`: ObjectId (reference to User)
- `status`: String (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- `scheduledDate`: Date
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## Next Steps

1. **Explore the API**: Visit `http://localhost:3000/api` to see available endpoints
2. **Test Authentication**: Try registering and logging in
3. **Create Services**: Add services as an agent
4. **Make Bookings**: Book services as a user
5. **Monitor Logs**: Check the console for detailed connection logs

## Production Considerations

For production deployment:
1. Use MongoDB Atlas or a managed MongoDB service
2. Set up proper authentication and authorization
3. Configure SSL/TLS connections
4. Set up database backups
5. Monitor database performance
6. Use environment-specific configuration

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify MongoDB is running: `npm run test:mongodb`
3. Check the `.env.local` file configuration
4. Ensure all dependencies are installed: `npm install` 