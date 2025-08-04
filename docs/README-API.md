# User Module API Documentation

This document provides information about the API endpoints for the User module in our service-booking web application.

## Authentication

All API routes are protected with JWT-based authentication using NextAuth.js. Include a valid session token in your requests.

## User Profile

### Get User Profile

```
GET /api/users/profile
```

Returns the authenticated user's profile information, excluding the password.

### Update User Profile

```
PATCH /api/users/profile
```

Updates the authenticated user's profile information.

**Request Body:**

```json
{
  "name": "Updated Name",
  "phone": "1234567890",
  "address": "123 Main St, City, Country"
}
```

All fields are optional. Only provided fields will be updated.

## Password Management

### Update Password

```
POST /api/users/password
```

Updates the authenticated user's password.

**Request Body:**

```json
{
  "currentPassword": "current-password",
  "newPassword": "new-password"
}
```

Both fields are required. The current password will be verified before updating.

## User Settings

### Notification Settings

```
GET /api/users/settings/notifications
```

Returns the user's notification settings.

```
PUT /api/users/settings/notifications
```

Updates the user's notification settings.

**Request Body:**

```json
{
  "emailNotifications": true,
  "smsNotifications": false,
  "marketingEmails": false,
  "bookingReminders": true
}
```

### Appearance Settings

```
GET /api/users/settings/appearance
```

Returns the user's appearance settings.

```
PUT /api/users/settings/appearance
```

Updates the user's appearance settings.

**Request Body:**

```json
{
  "theme": "dark",
  "fontSize": "medium",
  "reduceAnimations": false,
  "highContrast": false
}
```

Valid theme values: "light", "dark", "system"  
Valid fontSize values: "small", "medium", "large"

### Privacy Settings

```
GET /api/users/settings/privacy
```

Returns the user's privacy settings.

```
PUT /api/users/settings/privacy
```

Updates the user's privacy settings.

**Request Body:**

```json
{
  "profileVisibility": "public",
  "shareBookingHistory": false,
  "shareContactInfo": false,
  "allowDataCollection": true
}
```

Valid profileVisibility values: "public", "contacts", "private"

## Account Management

### Get Account Information

```
GET /api/users/account
```

Returns account information and stats including total bookings, active bookings, and support tickets.

### Delete Account

```
DELETE /api/users/account?confirm=true
```

Deletes the user account. Must include `confirm=true` query parameter.

**Optional Request Body:**

```json
{
  "password": "current-password"
}
```

## User Details

### Get User/Agent Details

```
GET /api/users/{id}
```

Returns details for a specific user or agent. Privacy settings will be respected when non-admin users access other users' profiles.

## Support Tickets

### Get Support Tickets

```
GET /api/support/tickets
```

Returns the authenticated user's support tickets.

**Query Parameters:**
- `status`: Filter by status (open, in_progress, resolved, closed)
- `limit`: Number of tickets per page (default: 10)
- `page`: Page number (default: 1)

### Create Support Ticket

```
POST /api/support/tickets
```

Creates a new support ticket.

**Request Body:**

```json
{
  "subject": "Ticket Subject",
  "description": "Detailed description of the issue",
  "priority": "medium",
  "category": "technical"
}
```

Valid priority values: "low", "medium", "high", "urgent"  
Valid category values: "technical", "billing", "account", "booking", "other"

### Get Support Ticket Details

```
GET /api/support/tickets/{id}
```

Returns details for a specific support ticket.

### Update Support Ticket Status

```
PATCH /api/support/tickets/{id}
```

Updates the status of a support ticket.

**Request Body:**

```json
{
  "status": "resolved"
}
```

Valid status values: "open", "in_progress", "resolved", "closed"

### Get Support Ticket Responses

```
GET /api/support/tickets/{id}/responses
```

Returns responses for a specific support ticket.

### Add Support Ticket Response

```
POST /api/support/tickets/{id}/responses
```

Adds a response to a support ticket.

**Request Body:**

```json
{
  "message": "Response message content"
}
```

## Booking Confirmations

### Send Booking Confirmation Emails

```
POST /api/bookings/{id}/send-confirmation
```

Sends booking confirmation emails to both the user and assigned agent. Updates the booking to mark confirmation as sent.

## Error Responses

All API endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server-side error 