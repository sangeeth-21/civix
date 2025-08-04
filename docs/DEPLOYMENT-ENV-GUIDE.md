# Production Deployment Environment Guide

## Auth.js (NextAuth) Production Settings

To fix the "Host must be trusted" errors and properly configure authentication for production, ensure the following environment variables are set in your production environment:

```bash
# Required Auth.js Production Settings
NEXTAUTH_URL=https://civix.in
NEXT_PUBLIC_APP_URL=https://civix.in
NEXT_PUBLIC_SITE_URL=https://civix.in

# Secrets (keep these secure!)
AUTH_SECRET=your_existing_auth_secret
NEXTAUTH_SECRET=your_existing_nextauth_secret

# Disable debug in production
NEXTAUTH_DEBUG=false
```

## Deployment Steps

1. Set these environment variables in your production environment
2. Rebuild your application: `npm run build`
3. Restart your application: `pm2 restart [your-app-name]`

## Verifying Configuration

After deployment, you can verify if the authentication is working properly by:

1. Visiting `https://civix.in/api/auth-debug` - this should return a JSON response with auth status
2. Logging in at `https://civix.in/login`
3. Checking if protected routes work as expected

## Troubleshooting

If you still encounter authentication issues:

1. Check server logs for specific error messages
2. Ensure your MongoDB connection string is correct and the database is accessible
3. Verify that your Auth Secrets are properly set
4. Confirm that NEXTAUTH_URL exactly matches your production domain (including https://)

## Additional Resources

- [Auth.js Deployment Documentation](https://authjs.dev/guides/deployment)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) 