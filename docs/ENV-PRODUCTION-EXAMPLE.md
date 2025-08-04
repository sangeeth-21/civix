# Production Environment Configuration
# Copy this content to .env.local and update with your actual values

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production

# NextAuth Configuration
AUTH_SECRET=your-secure-auth-secret-here
NEXTAUTH_SECRET=your-secure-nextauth-secret-here
NEXTAUTH_URL=https://yourdomain.com

# Email Configuration (SMTP)
# For Gmail:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Alternative SMTP variable names
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Feature Flags
NEXT_PUBLIC_MAINTENANCE_MODE=false

# Contact Information
NEXT_PUBLIC_CONTACT_EMAIL=support@yourdomain.com
NEXT_PUBLIC_CONTACT_PHONE=+1 (555) 123-4567

# Debug Configuration (set to false in production)
NEXTAUTH_DEBUG=false

# Node Environment
NODE_ENV=production
```

## Gmail App Password Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASS`

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for `AUTH_SECRET` and `NEXTAUTH_SECRET`
- Rotate secrets regularly in production
- Use app passwords instead of account passwords for email 