# PM2 Deployment Guide for Civix

This guide explains how to deploy and manage the Civix application using PM2, a production process manager for Node.js applications.

## Prerequisites

1. Node.js and npm installed on your server
2. PM2 installed globally: `npm install -g pm2`
3. Git access to the repository
4. MongoDB connection string

## Initial Server Setup

### 1. Install Required Software

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git (if not already installed)
sudo apt install -y git
```

### 2. Set Up SSH Keys for GitHub (if using private repository)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Display the public key to add to GitHub
cat ~/.ssh/id_ed25519.pub
```

Add this key to your GitHub account through the web interface.

## Deployment with PM2

### 1. First-time Deployment

Clone the repository manually and set up the initial deployment:

```bash
# Clone the repository
git clone git@github.com:your-username/civix.git
cd civix

# Install dependencies
npm install

# Create the logs directory
mkdir -p logs

# Set up environment variables
cp .env.example .env.production
# Edit the .env.production file with your production values
```

Edit your `.env.production` file to include:

```
# NextAuth Configuration
NEXTAUTH_URL=https://civix.in
NEXT_PUBLIC_APP_URL=https://civix.in
NEXT_PUBLIC_SITE_URL=https://civix.in

# Secrets
AUTH_SECRET=your_secure_secret_here
NEXTAUTH_SECRET=your_secure_secret_here

# Database
MONGODB_URI=your_mongodb_connection_string
```

### 2. Starting the Application with PM2

```bash
# Start using the ecosystem config
npm run pm2:start

# Or directly with PM2
pm2 start ecosystem.config.js --env production
```

### 3. Managing the Application

```bash
# Check status
npm run pm2:status
# or
pm2 status

# View logs
npm run pm2:logs
# or
pm2 logs civix

# Monitor CPU/Memory usage
npm run pm2:monitor
# or
pm2 monit civix

# Reload the application (zero downtime)
npm run pm2:reload
# or
pm2 reload civix

# Stop the application
npm run pm2:stop
# or
pm2 stop civix
```

### 4. Setting Up PM2 to Start on System Boot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

## Automated Deployments

### 1. Set Up Deployment Configuration

If you want to use PM2's built-in deployment functionality:

1. Ensure your `ecosystem.config.js` file has correct deployment settings:
   - Update the `user` field with your server username
   - Update the `host` array with your server hostname(s)
   - Update the `repo` field with your Git repository URL
   - Update the `path` field with the deployment path on your server

2. Set up a deploy key on your server and add it to GitHub.

### 2. Automated Deployment Commands

```bash
# Deploy to production
npm run deploy:prod
# or
pm2 deploy ecosystem.config.js production

# Deploy to staging
npm run deploy:staging
# or
pm2 deploy ecosystem.config.js staging
```

## Monitoring and Maintenance

### 1. View Dashboard

```bash
pm2 monit
```

### 2. View Application Metrics

Install PM2 Plus for advanced monitoring:

```bash
pm2 plus
```

### 3. Log Rotation

PM2 has built-in log rotation, but you can customize it:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 4. Regular Maintenance

```bash
# Update PM2
npm install -g pm2@latest

# Update the application
git pull
npm install
npm run build
pm2 reload civix
```

## Troubleshooting

### 1. Common Issues

- **Application crashes on start**
  - Check logs: `pm2 logs civix`
  - Verify environment variables
  - Check MongoDB connection

- **High Memory Usage**
  - Increase memory limit in ecosystem.config.js
  - Check for memory leaks using `pm2 monit`

- **Authentication Errors**
  - Verify NEXTAUTH_URL matches your domain exactly
  - Check AUTH_SECRET and NEXTAUTH_SECRET are set
  - Run `npm run verify:auth` to validate configuration

### 2. Restarting PM2

If PM2 itself is having issues:

```bash
pm2 kill
pm2 resurrect
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| NEXTAUTH_URL | Primary domain for auth callbacks | `https://civix.in` |
| NEXT_PUBLIC_APP_URL | Public-facing URL | `https://civix.in` |
| NEXT_PUBLIC_SITE_URL | Site URL for metadata | `https://civix.in` |
| AUTH_SECRET | Secret for auth encryption | Random 32+ character string |
| NEXTAUTH_SECRET | Legacy secret (keep same as AUTH_SECRET) | Random 32+ character string |
| MONGODB_URI | Database connection string | `mongodb+srv://...` |

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Auth.js (NextAuth) Configuration](https://next-auth.js.org/configuration/options) 