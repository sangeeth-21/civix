# Production Setup Guide for Civix

## 🚀 Quick Start

### 1. Environment Configuration

Create a `.env.local` file in your project root:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production

# NextAuth Configuration
AUTH_SECRET=your-secure-auth-secret-here
NEXTAUTH_SECRET=your-secure-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@civix.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_MAINTENANCE_MODE=false

# Contact Information
NEXT_PUBLIC_CONTACT_EMAIL=support@civix.com
NEXT_PUBLIC_CONTACT_PHONE=+1 (555) 123-4567

# Debug Configuration
NEXTAUTH_DEBUG=false
```

### 2. Database Setup

Ensure MongoDB is running locally or update the `MONGODB_URI` to point to your MongoDB instance.

### 3. Create Production Users

Run the production setup script:

```bash
npm run setup:production
```

This will create the following test users:

| Email           | Password        | Role        | Purpose         |
|-----------------|-----------------|-------------|-----------------|
| admin@civix.com | admin123456     | SUPER_ADMIN | Full access     |
| agent@civix.com | agent123456     | AGENT       | Service provider|
| user@civix.com  | user123456      | USER        | Customer        |

### 4. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and test login with the credentials above.

## 🔧 Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASS`

### Other SMTP Providers

Update the email configuration in `.env.local`:

```bash
EMAIL_HOST=your-smtp-host.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup:test` - Create single test user
- `npm run setup:production` - Create all production users

## 🔍 Troubleshooting

### Authentication Issues

1. **"Invalid email or password"**
   - Ensure the user exists in the database
   - Check if the password is correct
   - Verify the user is active (`isActive: true`)

2. **"CredentialsSignin" error**
   - Check database connection
   - Verify NextAuth configuration
   - Ensure `AUTH_SECRET` is set

3. **"CallbackRouteError"**
   - Check NextAuth configuration
   - Verify database connection
   - Check for errors in the `authorize` function

### Email Issues

1. **"Missing credentials for PLAIN"**
   - Ensure `EMAIL_USER` and `EMAIL_PASS` are set
   - Check SMTP configuration
   - Verify app password for Gmail

2. **Emails not sending**
   - Check SMTP credentials
   - Verify email service configuration
   - Check network connectivity

### Database Issues

1. **Connection failed**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` format
   - Verify network connectivity

2. **User not found**
   - Run setup script to create users
   - Check database indexes
   - Verify user email format

## 📊 Monitoring

### Logs

The application uses structured logging with the following levels:
- `INFO` - General information
- `WARN` - Warning messages
- `ERROR` - Error messages
- `DEBUG` - Debug information (only when `NEXTAUTH_DEBUG=true`)

### Health Checks

- Database connection: Check MongoDB connectivity
- Authentication: Test login functionality
- Email service: Verify SMTP configuration

## 🔒 Security

### Environment Variables

- Never commit `.env.local` to version control
- Use strong, unique secrets for `AUTH_SECRET` and `NEXTAUTH_SECRET`
- Rotate secrets regularly in production

### Database Security

- Use strong passwords for database access
- Enable authentication for MongoDB
- Use SSL/TLS for database connections in production

### Email Security

- Use app passwords instead of account passwords
- Enable 2FA on email accounts
- Use secure SMTP connections

## 🚀 Production Deployment

### Environment Variables

For production deployment, set the following environment variables:

```bash
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
AUTH_SECRET=your-production-auth-secret
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXTAUTH_URL=https://yourdomain.com
EMAIL_HOST=your-production-smtp-host
EMAIL_USER=your-production-email
EMAIL_PASS=your-production-email-password
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### Build and Deploy

```bash
npm run build
npm run start
```

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review the logs for error messages
- Ensure all environment variables are properly configured
- Verify database and email service connectivity 