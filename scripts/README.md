# Database Scripts

This directory contains database management scripts for the Civix application.

## Scripts

### 1. Seed Admin Users (`seed-admin-users.js`)

Creates admin and super-admin users in the database with secure passwords.

#### Usage

```bash
npm run seed:admins
```

Or directly:

```bash
node scripts/seed-admin-users.js
```

#### What it does

- Creates 3 Admin users with different roles and responsibilities
- Creates 2 Super Admin users with full system access
- Validates password strength before creating users
- Checks for existing users to avoid duplicates
- Displays all created credentials for easy access

#### Created Users

**Admin Users:**
- `admin@civix.com` - System Administrator
- `operations@civix.com` - Operations Manager  
- `support@civix.com` - Support Manager

**Super Admin Users:**
- `superadmin@civix.com` - Super Administrator
- `owner@civix.com` - System Owner

#### Default Passwords

All users are created with secure passwords following these patterns:
- Admin users: `[Role]@2024!`
- Super Admin users: `[Role]@2024!`

**⚠️ Security Notice:** Change these passwords immediately after first login!

### 2. Verify Admin Users (`verify-admin-users.js`)

Verifies that admin and super-admin users exist in the database and displays their details.

#### Usage

```bash
npm run verify:admins
```

Or directly:

```bash
node scripts/verify-admin-users.js
```

#### What it does

- Lists all admin and super-admin users in the database
- Shows user details including creation date and active status
- Verifies that all expected users are present
- Checks for any inactive users
- Provides a summary of total users by role

### 3. Reset User Password (`reset-user-password.js`)

Resets a specific user's password to a default value.

#### Usage

```bash
npm run reset:password
```

Or directly:

```bash
node scripts/reset-user-password.js
```

#### What it does

- Resets the password for `tectoviaquiz@gmail.com` to `password123`
- Useful for development and testing purposes
- Includes password verification testing

## Environment Variables

Make sure you have the following environment variable set:

```env
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production
```

Or your production MongoDB connection string.

## Security Considerations

1. **Change Default Passwords**: Always change the default passwords after first login
2. **Secure Storage**: Store credentials securely and don't commit them to version control
3. **Production Use**: These scripts are primarily for development. For production, use proper user management
4. **Access Control**: Limit access to these scripts to authorized personnel only

## Password Requirements

The seeding script validates that all passwords meet these requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running
- Check your `MONGODB_URI` environment variable
- Verify network connectivity

### Duplicate User Errors
- The script checks for existing users and skips them
- If you need to update existing users, modify the script or use the reset password script

### Permission Issues
- Ensure you have write permissions to the database
- Check your MongoDB user roles and permissions

## Development

To modify the seeding script:

1. Edit `scripts/seed-admin-users.js`
2. Update the user arrays (`adminUsers` and `superAdminUsers`)
3. Run the script to apply changes

The script is idempotent - it can be run multiple times safely without creating duplicates. 