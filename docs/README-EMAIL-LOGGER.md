# Email Service and Logging Implementation

This document outlines the email service and logging enhancements added to the Civix application.

## Email Service

The email service is implemented using Nodemailer and provides standardized email templates for:

- **Booking confirmations**: Sent to users when they book a service
- **Agent notifications**: Sent to agents when they are assigned a booking
- **Welcome emails**: Sent to new users upon registration
- **Password reset emails**: Sent when users request password resets

### Configuration

Add the following to your `.env` file:

```
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-smtp-username
EMAIL_PASS=your-smtp-password
EMAIL_FROM=noreply@example.com
EMAIL_SECURE=false
```

### API

The email service is available in `lib/services/email.ts` and exports the following functions:

- `sendEmail(options)`: Generic email sending function
- `sendBookingConfirmationEmail(userEmail, userName, bookingDetails)`: Sends booking confirmation to users
- `sendAgentNotificationEmail(agentEmail, agentName, userName, bookingDetails)`: Notifies agents of new bookings
- `sendPasswordResetEmail(userEmail, userName, resetToken, resetUrl)`: Sends password reset links
- `sendWelcomeEmail(userEmail, userName)`: Sends welcome emails to new users

## Logging System

A comprehensive logging system has been implemented to track application events, errors, and user actions.

### Features

- **Structured logging**: JSON format in production, pretty-printed in development
- **Namespace support**: Create loggers for specific modules/components
- **Log levels**: debug, info, warn, error
- **Context enrichment**: Additional metadata for each log event
- **Request tracking**: Middleware adds request IDs and logs request/response details

### Configuration

No specific configuration is needed as the logger adapts to the environment:

- Development: Pretty-printed console logs with emojis and colors
- Production: JSON-formatted logs for better machine readability
- Test: Logs are suppressed to avoid cluttering test output

### API

The logging system is available in `lib/logger.ts` and exports:

- `logger`: Singleton instance of the logger
- `createNamespaceLogger(namespace)`: Creates a namespaced logger instance
- `default`: The same singleton logger instance

Example usage:

```typescript
import { logger, createNamespaceLogger } from '@/lib/logger';

// General logging
logger.info('Something happened');

// Namespaced logging
const moduleLogger = createNamespaceLogger('my-module');
moduleLogger.error('Something went wrong', { details: 'More info' });
```

## Authentication Enhancements

The authentication system has been enhanced with:

1. **Login tracking**: Records user login timestamps
2. **Password reset flow**: Complete flow for forgot password and reset password
3. **Security headers**: Added to all responses via middleware
4. **Auth logging**: Comprehensive logging of auth events
5. **Welcome emails**: Sent to new users upon registration

## API Routes

The following API routes were implemented or enhanced:

- **POST /api/auth/login**: Custom login endpoint with logging
- **POST /api/auth/register**: User registration with welcome email
- **POST /api/auth/forgot-password**: Initiates password reset flow
- **POST /api/auth/reset-password**: Completes password reset flow
- **POST /api/bookings/[id]/send-confirmation**: Enhanced with improved email handling

## Security Considerations

1. **Password security**:
   - Passwords are hashed using bcrypt
   - Minimum password length of 8 characters
   - Password reset tokens are hashed before storage

2. **Auth protections**:
   - Rate limiting (to be implemented)
   - CSRF protection via Next.js defaults
   - No leakage of user existence in forgot password flow

3. **Headers & Middleware**:
   - Added security headers to all responses
   - Request tracking with unique IDs
   - Role-based access control

## Next Steps

1. **Rate limiting**: Add rate limiting to auth endpoints
2. **Monitoring**: Add monitoring for failed login attempts
3. **Audit trail**: Expand logging for security-sensitive operations
4. **Email templates**: Enhance email templates with better design 