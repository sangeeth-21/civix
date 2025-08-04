# 🌱 Civix User Seeder

This script populates your Civix database with comprehensive test users from the `civix.users.json` file.

## 📋 Overview

The seeder creates users for all 4 roles in your Civix application:
- **USER** (6 users) - Regular customers
- **AGENT** (9 users) - Service providers  
- **ADMIN** (5 users) - System administrators
- **SUPER_ADMIN** (4 users) - Full system control

## 🚀 Quick Start

### 1. Run the Seeder
```bash
npm run seed:users
```

### 2. Alternative Commands
```bash
# Using npm script
npm run seed:all

# Direct node command
node scripts/seed-users.js

# Clean collection (delete all users)
npm run clean:users
node scripts/seed-users.js --clean

# With help
node scripts/seed-users.js --help
```

## 🔐 Login Credentials

**All users are created with the same password:**
```
Password: Civix@2025Dev!
```

## 📧 Sample Login Emails

### USER Role
- john.smith@example.com
- sarah.johnson@example.com
- michael.brown@example.com

### AGENT Role
- rajesh.civix.in@gmail.com
- priya.civix.in@gmail.com
- sabari.civix.in@gmail.com

### ADMIN Role
- admin@civix.com
- operations@civix.com
- support@civix.com

### SUPER_ADMIN Role
- superadmin@civix.com
- owner@civix.com
- cto@civix.com

## ⚙️ Configuration

### Environment Variables
The script uses these environment variables:
- `MONGODB_URI` - Your MongoDB connection string (defaults to `mongodb://localhost:27017/civix_fInal_production`)

### Database Connection
The script will:
1. Connect to your MongoDB database
2. Clear existing users (to avoid duplicates)
3. Create all users from `civix.users.json`
4. Hash passwords automatically
5. Display a summary of created users

## 📊 User Data Included

Each user includes:
- **Basic Info**: Name, email, phone, address
- **Role-specific Data**: 
  - Agents: experience, specialization, rating, totalJobs, isVerified
  - All: role, isActive status
- **Settings**: Notifications, appearance, privacy preferences
- **Timestamps**: createdAt, updatedAt

## 🛠️ Script Features

### Error Handling
- Continues processing even if individual users fail
- Provides detailed error messages
- Shows summary of successes and failures

### Progress Tracking
- Real-time progress updates
- User-by-user creation feedback
- Final summary with role breakdown

### Data Validation
- Validates email formats
- Ensures required fields are present
- Handles missing optional fields gracefully

## 🔧 Customization

### Modify User Data
Edit `civix.users.json` to:
- Add new users
- Change user details
- Modify settings
- Update specializations

### Change Password
To use a different password, modify line 95 in `seed-users.js`:
```javascript
const universalPassword = "YourNewPassword123!";
```

### Skip User Deletion
To keep existing users, comment out line 78 in `seed-users.js`:
```javascript
// const deleteResult = await User.deleteMany({});
```

## 📝 Output Example

```
✅ Connected to MongoDB successfully
📖 Found 24 users in the JSON file
🗑️  Deleted 0 existing users

✅ Created user 1/24: John Smith (john.smith@example.com) - USER
✅ Created user 2/24: Sarah Johnson (sarah.johnson@example.com) - USER
...

📊 SEEDING SUMMARY
==================
✅ Successfully created: 24 users
❌ Errors: 0

👥 CREATED USERS:
================

🔸 USER (6 users):
   • John Smith - john.smith@example.com
   • Sarah Johnson - sarah.johnson@example.com
   ...

🔸 AGENT (9 users):
   • Rajesh Kumar - rajesh.civix.in@gmail.com
   • Priya Sharma - priya.civix.in@gmail.com
   ...

🔸 ADMIN (5 users):
   • System Administrator - admin@civix.com
   • Operations Manager - operations@civix.com
   ...

🔸 SUPER_ADMIN (4 users):
   • Super Administrator - superadmin@civix.com
   • System Owner - owner@civix.com
   ...

🔐 LOGIN CREDENTIALS
===================
All users have been created with the password: Civix@2025Dev!

📧 Sample login emails:

USER:
   • john.smith@example.com
   • sarah.johnson@example.com
   • michael.brown@example.com

AGENT:
   • rajesh.civix.in@gmail.com
   • priya.civix.in@gmail.com
   • sabari.civix.in@gmail.com

ADMIN:
   • admin@civix.com
   • operations@civix.com
   • support@civix.com

SUPER_ADMIN:
   • superadmin@civix.com
   • owner@civix.com
   • cto@civix.com

🎉 Seeding completed successfully!
🔌 Disconnected from MongoDB
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your `MONGODB_URI` environment variable
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Duplicate Email Error**
   - The script automatically clears existing users
   - If you see this error, check for manual user creation

3. **Permission Denied**
   - Ensure you have write permissions to the database
   - Check MongoDB user roles

4. **File Not Found**
   - Ensure `civix.users.json` exists in the project root
   - Check file path and permissions

### Debug Mode
For detailed debugging, you can modify the script to add more logging:
```javascript
console.log('Debug: Processing user:', userData);
```

## 📞 Support

If you encounter issues:
1. Check the error messages in the console output
2. Verify your MongoDB connection
3. Ensure all required dependencies are installed
4. Check the `civix.users.json` file format

## 🔄 Re-running the Seeder

You can safely re-run the seeder multiple times:
- It will clear existing users first
- All users will be recreated with fresh data
- No duplicate users will be created

---

**Happy Seeding! 🌱** 