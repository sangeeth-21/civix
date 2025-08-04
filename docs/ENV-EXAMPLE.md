# Civix Environment Variables Example

Create a `.env.local` file in the root directory of your project with the following variables. Make sure to replace the placeholder values with your actual credentials.

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civix?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=your_secret_here_at_least_32_chars_long
NEXTAUTH_SECRET=your_secret_here_at_least_32_chars_long

# Email Configuration (Required for welcome emails and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here

# Debug Settings (Set to false in production)
NEXTAUTH_DEBUG=false
```

## Important Notes

1. **MongoDB URI**: Must be valid and include the correct username, password, and database name.
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/civix?retryWrites=true&w=majority`
   - Make sure the user has read/write access to the database

2. **Auth Secrets**: Generate secure random strings for AUTH_SECRET and NEXTAUTH_SECRET:
   ```bash
   # Use this command to generate a secure random string
   openssl rand -base64 32
   ```

3. **SMTP Configuration**: For Gmail, you need to:
   - Enable 2-factor authentication in your Google account
   - Create an App Password (Google Account → Security → App Passwords)
   - Use that App Password as your SMTP_PASS

4. **Production Deployment**: For production environments:
   - Set NEXTAUTH_URL to your production domain (e.g., https://civix.in)
   - Set NEXTAUTH_DEBUG to false
   - Ensure your MongoDB user has appropriate security permissions

## Verifying Your Configuration

Run this command to verify your auth configuration:

```bash
npm run verify:auth
```

This will check if all required environment variables are properly set. 