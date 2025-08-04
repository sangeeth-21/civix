# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Database Configuration
```bash
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production
```

### NextAuth Configuration
```bash
AUTH_SECRET=your-auth-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Email Configuration (SMTP)
```bash
# Primary email variables
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@civix.com

# Alternative SMTP variable names (also supported)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Feature Flags
```bash
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

### Contact Information
```bash
NEXT_PUBLIC_CONTACT_EMAIL=support@civix.com
NEXT_PUBLIC_CONTACT_PHONE=+1 (555) 123-4567
```

### Debug Configuration
```bash
# Set to 'true' only in development for detailed auth logs
NEXTAUTH_DEBUG=false
```

## Gmail App Password Setup

If using Gmail for SMTP:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASS` or `SMTP_PASS`

## Quick Setup Commands

```bash
# Copy the example and edit it
cp .env.local.example .env.local

# Generate a secure auth secret
openssl rand -base64 32

# Start the development server
npm run dev
```

## Troubleshooting

### Email Issues
- Ensure SMTP credentials are correct
- Check if your email provider requires app passwords
- Verify port and security settings

### Authentication Issues
- Ensure `AUTH_SECRET` is set and unique
- Check MongoDB connection
- Verify user exists in database

### Database Issues
- Ensure MongoDB is running
- Check connection string format
- Verify database permissions 